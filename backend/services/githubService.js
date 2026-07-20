'use strict';

const axios = require("axios");
const logger = require("../utils/logger");

const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;
const pendingRequests = new Map();
const rawCommitsCache = new Map();
const RAW_CACHE_TTL = 5 * 60 * 1000;

const githubApi = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Accept: "application/vnd.github+json",
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    }),
  },
});

async function makeGithubRequest(url, config = {}) {
  try {
    return await githubApi.get(url, config);
  } catch (error) {
    if (error.response?.status === 401 && process.env.GITHUB_TOKEN) {
      // WARN: token was rejected by GitHub — retrying without authentication.
      logger.warn(
        { status: 401, url },
        "Invalid GITHUB_TOKEN detected. Retrying unauthenticated..."
      );
      const unauthApi = axios.create({
        baseURL: "https://api.github.com",
        headers: { Accept: "application/vnd.github+json" },
      });
      return await unauthApi.get(url, config);
    }
    throw error;
  }
}

async function fetchCommitActivity(username) {
  // Never log the token value — log only whether one is configured.
  logger.debug(
    { username, hasToken: !!process.env.GITHUB_TOKEN },
    "fetchCommitActivity called"
  );

  if (cache.has(username)) {
    const cached = cache.get(username);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      logger.debug({ username }, "Returning cached commit activity");
      return cached.data;
    }
  }

  if (pendingRequests.has(username)) {
    return pendingRequests.get(username);
  }

  const requestPromise = (async () => {
    const commitsByDate = {};

    try {
      logger.debug({ username }, "Fetching repos from GitHub");
      const reposRes = await makeGithubRequest(
        `/users/${username}/repos`,
        { params: { per_page: 5 } }
      );

      logger.debug({ username, repoCount: reposRes.data.length }, "Repos fetched");

      for (const repo of reposRes.data) {
        logger.debug({ username, repo: repo.name }, "Fetching commits for repo");
        const commitsRes = await makeGithubRequest(
          `/repos/${username}/${repo.name}/commits`,
          { params: { per_page: 20 } }
        );

        commitsRes.data.forEach((commit) => {
          const date = commit.commit.author.date.split("T")[0];
          commitsByDate[date] = (commitsByDate[date] || 0) + 1;
        });
      }

      cache.set(username, { data: commitsByDate, timestamp: Date.now() });
      pendingRequests.delete(username);
      return commitsByDate;
    } catch (error) {
      logger.error(
        {
          username,
          status: error.response?.status,
          githubMessage: error.response?.data?.message,
          url: error.config?.url,
        },
        "GitHub API error in fetchCommitActivity"
      );
      throw error;
    }
  })();

  pendingRequests.set(username, requestPromise);
  return requestPromise;
}

/**
 * Fetch RAW commits with timestamps (for Patterns and Analysis pages).
 */
async function fetchRawCommits(username) {
  const now = Date.now();
  if (rawCommitsCache.has(username)) {
    const { data, timestamp } = rawCommitsCache.get(username);
    if (now - timestamp < RAW_CACHE_TTL) {
      logger.debug({ username }, "[Cache Hit] Returning cached raw commits");
      return data;
    }
  }

  const allCommits = [];
  const seenShas = new Set();

  try {
    const reposRes = await makeGithubRequest(
      `/users/${username}/repos`,
      { params: { per_page: 10 } }
    );

    for (const repo of reposRes.data) {
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const commitsRes = await makeGithubRequest(
          `/repos/${username}/${repo.name}/commits`,
          { params: { per_page: 30, page } }
        );

        if (commitsRes.data.length === 0) {
          hasMore = false;
          break;
        }

        commitsRes.data.forEach((commit) => {
          if (!seenShas.has(commit.sha)) {
            seenShas.add(commit.sha);
            allCommits.push(commit);
          }
        });

        page++;
        if (page > 3) break; // rate-limit protection
      }
    }

    rawCommitsCache.set(username, { data: allCommits, timestamp: now });
    return allCommits;
  } catch (error) {
    logger.error(
      {
        username,
        status: error.response?.status,
        githubMessage: error.response?.data?.message,
      },
      "GitHub RAW commit fetch error"
    );
    throw error;
  }
}

const todaysCommitsCache = new Map();
const TODAYS_CACHE_TTL = 5 * 60 * 1000;

async function getTodaysCommitCount(username) {
  const now = Date.now();
  const cacheKey = `commits_${username}`;

  if (todaysCommitsCache.has(cacheKey)) {
    const { count, timestamp } = todaysCommitsCache.get(cacheKey);
    if (now - timestamp < TODAYS_CACHE_TTL) {
      logger.debug({ username }, "[Cache Hit] Returning cached today's commit count");
      return count;
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString().split("T")[0];

  try {
    const response = await makeGithubRequest("/search/commits", {
      params: { q: `author:${username} author-date:>=${todayISO}` },
    });


    const totalCount = response.data.total_count || 0;
    todaysCommitsCache.set(cacheKey, { count: totalCount, timestamp: now });

    logger.info(
      { username, todayISO, totalCount },
      "[GitHub API] Fetched and cached today's commit count"
    );

    return totalCount;
  } catch (error) {
    logger.error(
      { username, errMsg: error.message },
      "Error fetching commit count from GitHub Search API"
    );

    if (todaysCommitsCache.has(cacheKey)) {
      return todaysCommitsCache.get(cacheKey).count;
    }
    return 0;
  }
}

module.exports = { fetchCommitActivity, fetchRawCommits, getTodaysCommitCount };