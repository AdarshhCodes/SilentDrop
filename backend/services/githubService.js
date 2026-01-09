const axios = require("axios");
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;
const pendingRequests = new Map();

const githubApi = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Accept: "application/vnd.github+json",
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
    })
  },
});

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
      const reposRes = await githubApi.get(
        `/users/${username}/repos`,
        { params: { per_page: 5 } }
      );
      
      console.log(`Found ${reposRes.data.length} repos`);

      for (const repo of reposRes.data) {
        console.log(`Fetching commits for repo: ${repo.name}`);
        const commitsRes = await githubApi.get(
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

module.exports = { fetchCommitActivity };