const { calculateDailyRisk } = require("../services/burnoutService");
const { getTodaysCommitCount } = require("../services/githubService");
const logger = require("../utils/logger");


exports.getDashboardData = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const username = req.user.githubUsername;
    const todaysCommits = await getTodaysCommitCount(username);
    const burnoutRisk = calculateDailyRisk(todaysCommits);

    res.json({ todaysCommits, burnoutRisk });
  } catch (error) {
    logger.error({ reqId: req.id, err: error }, "Dashboard data fetch failed");
    next(error);
  }
};


