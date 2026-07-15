const axios = require("axios");
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;
const pendingRequests = new Map();
const rawCommitsCache = new Map();
const RAW_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in ms

const githubApi = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Accept: "application/vnd.github+json",
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
    })
  },
});

async function makeGithubRequest(url, config = {}) {
  try {
    return await githubApi.get(url, config);
  } catch (error) {
    if (error.response?.status === 401 && process.env.GITHUB_TOKEN) {
      console.warn("Invalid GITHUB_TOKEN detected in .env. Retrying unauthenticated...");
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
  console.log("=== fetchCommitActivity ===");
  console.log("Username:", username);
  console.log("Has GITHUB_TOKEN:", !!process.env.GITHUB_TOKEN);
  console.log("Token preview:", process.env.GITHUB_TOKEN ? `${process.env.GITHUB_TOKEN.substring(0, 10)}...` : "MISSING");

  if (cache.has(username)) {
    const cached = cache.get(username);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("Returning cached data");
      return cached.data;
    }
  }

  if (pendingRequests.has(username)) {
    return pendingRequests.get(username);
  }

  const requestPromise = (async () => {
    const commitsByDate = {};

    try {
      console.log(`Fetching repos for user: ${username}`);
      const reposRes = await makeGithubRequest(
        `/users/${username}/repos`,
        { params: { per_page: 5 } }
      );
      
      console.log(`Found ${reposRes.data.length} repos`);

      for (const repo of reposRes.data) {
        console.log(`Fetching commits for repo: ${repo.name}`);
        const commitsRes = await makeGithubRequest(
          `/repos/${username}/${repo.name}/commits`,
          { params: { per_page: 20 } }
        );

        commitsRes.data.forEach(commit => {
          const date = commit.commit.author.date.split("T")[0];
          commitsByDate[date] = (commitsByDate[date] || 0) + 1;
        });
      }

      cache.set(username, {
        data: commitsByDate,
        timestamp: Date.now(),
      });

      pendingRequests.delete(username);
      return commitsByDate;
    } catch (error) {
      console.error("GitHub API Error:");
      console.error("Status:", error.response?.status);
      console.error("Message:", error.response?.data?.message);
      console.error("URL:", error.config?.url);
      throw error;
    }
  })();

  pendingRequests.set(username, requestPromise);
  return requestPromise;
}
/**
  Fetch RAW commits with timestamps
 Patterns aur Analysis page ke liye
 */
async function fetchRawCommits(username) {
  const now = Date.now();
  if (rawCommitsCache.has(username)) {
    const { data, timestamp } = rawCommitsCache.get(username);
    if (now - timestamp < RAW_CACHE_TTL) {
      console.log(`[Cache Hit] Returning cached raw commits for ${username}`);
      return data;
    }
  }

  const allCommits = [];
  const seenShas = new Set();

  try {
    // Fetch user repos (increase per_page for accuracy)
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
          {
            params: {
              per_page: 30,
              page,
            },
          }
        );

        if (commitsRes.data.length === 0) {
          hasMore = false;
          break;
        }

        commitsRes.data.forEach(commit => {
          // Avoid duplicates across repos/pages
          if (!seenShas.has(commit.sha)) {
            seenShas.add(commit.sha);
            allCommits.push(commit);
          }
        });

        page++;
        // Safety break (rate-limit protection)
        if (page > 3) break;
      }
    }

    rawCommitsCache.set(username, { data: allCommits, timestamp: now });
    return allCommits;

  } catch (error) {
    console.error("GitHub RAW commit fetch error:");
    console.error("Status:", error.response?.status);
    console.error("Message:", error.response?.data?.message);
    throw error;
  }
}

const todaysCommitsCache = new Map();
const TODAYS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in ms

async function getTodaysCommitCount(username) {
  const now = Date.now();
  const cacheKey = `commits_${username}`;

  // Check cache first
  if (todaysCommitsCache.has(cacheKey)) {
    const { count, timestamp } = todaysCommitsCache.get(cacheKey);
    if (now - timestamp < TODAYS_CACHE_TTL) {
      console.log(`[Cache Hit] Returning cached commits for ${username}`);
      return count;
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString().split("T")[0]; // YYYY-MM-DD

  try {
    // Use GitHub Search API for efficient cross-repo commit counting
    // Query: author:${username} committer-date:>=YYYY-MM-DD
    const response = await makeGithubRequest("/search/commits", {
      params: {
        q: `author:${username} author-date:>=${todayISO}`,
      },
    });

    const totalCount = response.data.total_count || 0;

    // Store in cache
    todaysCommitsCache.set(cacheKey, { count: totalCount, timestamp: now });
    console.log(`[GitHub API] Fetched and cached ${totalCount} commits for ${username}`);

    return totalCount;
  } catch (error) {
    console.error("Error fetching commit count from GitHub Search API:", error.message);
    
    // If search API fails, fall back to previous cached value if available
    if (todaysCommitsCache.has(cacheKey)) {
      return todaysCommitsCache.get(cacheKey).count;
    }
    return 0;
  }
}

module.exports = { fetchCommitActivity, fetchRawCommits, getTodaysCommitCount };