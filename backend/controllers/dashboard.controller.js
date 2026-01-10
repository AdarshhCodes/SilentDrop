const { calculateBurnoutScore } = require("../services/burnoutService");
const { getTodaysCommitCount } = require(
  "../services/github.service"
);

exports.getDashboardData = async (req, res) => {
    if (!req.user) {
  return res.status(401).json({ error: "Unauthorized" });
}

  try {
    const username = req.user.githubUsername; // IMPORTANT

    const todaysCommits = await getTodaysCommitCount(username);

    res.json({
      todaysCommits,
      burnoutRisk: calculateBurnoutScore(todaysCommits)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Dashboard data fetch failed" });
  }
};
