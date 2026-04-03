const axios = require("axios");

const githubApi = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Accept: "application/vnd.github+json",
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    }),
  },
});

/**
 * LIVE dashboard commit counter
 * Counts today's commits across ALL repos for the user
 *  No cache
 * No DB
 */
// In-memory cache to store commit counts for 5 minutes
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in ms

async function getTodaysCommitCount(username) {
  const now = Date.now();
  const cacheKey = `commits_${username}`;

  // Check cache first
  if (cache.has(cacheKey)) {
    const { count, timestamp } = cache.get(cacheKey);
    if (now - timestamp < CACHE_TTL) {
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
    const response = await githubApi.get("/search/commits", {
      params: {
        q: `author:${username} author-date:>=${todayISO}`,
      },
    });

    const totalCount = response.data.total_count || 0;

    // Store in cache
    cache.set(cacheKey, { count: totalCount, timestamp: now });
    console.log(`[GitHub API] Fetched and cached ${totalCount} commits for ${username}`);

    return totalCount;
  } catch (error) {
    console.error("Error fetching commit count from GitHub Search API:", error.message);
    
    // If search API fails (highly unlikely but possible for new accounts/repos), 
    // fall back to 0 or previous cached value if available
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey).count;
    }
    return 0;
  }
}

module.exports = { getTodaysCommitCount };
