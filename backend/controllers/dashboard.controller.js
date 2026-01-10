const { calculateBurnoutScore } = require("../services/burnoutService");
const { getTodaysCommitCount } = require(
  "../services/github.service"
);
function calculateTodayBurnout(commits) {
  // No work
  if (commits === 0) return 0;

  // Very light work
  if (commits <= 4) return 10;
  if (commits <= 7) return 18;

  // Normal productive day
  if (commits <= 10) return 25;
  if (commits <= 14) return 32;
  if (commits <= 17) return 40;

  // Heavy focus
  if (commits <= 20) return 48;
  if (commits <= 22) return 56;
  if (commits <= 25) return 64;

  // Intense workload
  if (commits <= 28) return 72;
  if (commits <= 34) return 80;

  // Very high strain
  if (commits <= 40) return 88;
  if (commits <= 50) return 94;

  // Extreme / unhealthy
  return 100;
}


exports.getDashboardData = async (req, res) => {
    if (!req.user) {
  return res.status(401).json({ error: "Unauthorized" });
}

  try {
    const username = req.user.githubUsername; // IMPORTANT
    const todaysCommits = await getTodaysCommitCount(username);
    const burnoutRisk = calculateTodayBurnout(todaysCommits)


    res.json({
      todaysCommits,
      burnoutRisk,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Dashboard data fetch failed" });
  }
};
