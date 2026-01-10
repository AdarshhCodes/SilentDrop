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
async function getTodaysCommitCount(username) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let totalCommits = 0;

  // 1️⃣ Fetch ALL repos
  const reposRes = await githubApi.get(
    `/users/${username}/repos`,
    { params: { per_page: 100 } }
  );

  const repos = reposRes.data;

  // 2️⃣ Loop repos
  for (const repo of repos) {
    let page = 1;

    while (true) {
      const commitsRes = await githubApi.get(
        `/repos/${username}/${repo.name}/commits`,
        {
          params: {
            author: username,
            per_page: 100,
            page,
          },
        }
      );

      const commits = commitsRes.data;
      if (commits.length === 0) break;

      for (const commit of commits) {
        const commitDate = new Date(commit.commit.author.date);

        if (commitDate >= todayStart) {
          totalCommits++;
        } else {
          break; // older commit → stop this repo
        }
      }

      page++;
    }
  }

  return totalCommits;
}

module.exports = { getTodaysCommitCount };
