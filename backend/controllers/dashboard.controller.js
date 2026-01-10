const { getTodaysCommitCount } = require(
  "../services/github.service"
);

exports.getDashboardData = async (req, res) => {
  try {
    const username = req.user.githubUsername; // IMPORTANT

    const todaysCommits = await getTodaysCommitCount(username);

    res.json({
      todaysCommits,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Dashboard data fetch failed" });
  }
};
