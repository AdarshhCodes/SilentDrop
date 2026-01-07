
const axios = require("axios");
const cache = new Map(); // username -> { data, timestamp }
const CACHE_TTL = 30 * 60 * 1000; // 10 minutes
const pendingRequests = new Map();

const githubApi = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
  },
});

async function fetchCommitActivity(username) {
  if (cache.has(username)) {
    const cached = cache.get(username);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
    
      return cached.data;
    }
  }

  if (pendingRequests.has(username)) {
   
    return pendingRequests.get(username);
  }

  const requestPromise = (async () => {
    const commitsByDate = {};

    const reposRes = await githubApi.get(
      `/users/${username}/repos`,
      { params: { per_page: 5 } }
    );

    for (const repo of reposRes.data) {
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
  })();

  pendingRequests.set(username, requestPromise);
  return requestPromise;
}


module.exports = { fetchCommitActivity };

