const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { ANALYSIS_DAYS_WINDOW } = require("../constants/analysisWindow");
const { getHourInTimezone, getDayInTimezone } = require("../utils/time");
const User = require("../models/User");
const { fetchRawCommits } = require("../services/githubService");
const logger = require("../utils/logger");
const DailyMetric = require("../models/DailyMetric");

router.get("/", auth, async (req, res, next) => {

  try {
    const username = req.user.githubUsername;
    if (!username) {
      return res.status(400).json({ error: "GitHub username missing" });
    }

    const user = await User.findById(req.user.id);
    const timezone = user?.preferences?.timezone || "UTC";

    const hourHistogram = Array(24).fill(0);
    let totalCommits = 0;
    let lateNightCommits = 0;
    let weekendCommits = 0;

    // Fetch raw commits from GitHub
    let commits = [];
    try {
      commits = await fetchRawCommits(username);
    } catch (err) {
      logger.error({ reqId: req.id, username, err: err.message }, "Error fetching raw commits from GitHub");
      commits = [];
    }

    const now = Date.now();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    commits.forEach((commit) => {
      const dateStr = commit.commit?.author?.date;
      if (!dateStr) return;

      const commitTime = new Date(dateStr).getTime();
      const daysAgo = (now - commitTime) / MS_PER_DAY;

      // Ignore commits outside analysis window
      if (daysAgo > ANALYSIS_DAYS_WINDOW) return;

      totalCommits++;

      // Timezone-normalized hour & day
      const hour = getHourInTimezone(dateStr, timezone);
      const day = getDayInTimezone(dateStr, timezone);

      hourHistogram[hour]++;

      // Late night: 22:00 – 04:59
      if (hour >= 22 || hour <= 4) {
        lateNightCommits++;
      }

      // Weekend: Saturday (6) or Sunday (0)
      if (day === 0 || day === 6) {
        weekendCommits++;
      }
    });
    let confidence = "Low";

if (totalCommits >= 50) {
  confidence = "High";
} else if (totalCommits >= 20) {
  confidence = "Medium";
}


    // Find most active hour
    let peakHour = null;
    let maxCount = 0;

    hourHistogram.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count;
        peakHour = hour;
      }
    });

    res.json({
      totalCommits,
      pattern: {
        mostActiveHour: peakHour, // 0–23 (IST)
        lateNightPercentage:
          totalCommits === 0
            ? 0
            : Math.round((lateNightCommits / totalCommits) * 100),
        weekendPercentage:
          totalCommits === 0
            ? 0
            : Math.round((weekendCommits / totalCommits) * 100),
        basedOnDays: ANALYSIS_DAYS_WINDOW,
        confidence,
        hourHistogram,
      },
    });

  } catch (error) {
    logger.error({ reqId: req.id, err: error }, "Pattern analysis error");
    next(error);
  }

});

// ─── GET /api/analysis/history ───────────────────────────────────────────────
// Returns the most recent N DailyMetric records for the current user, ordered
// oldest → newest so the frontend can chart them left-to-right.
//
// BUG NOTE (intentionally fixed before first deploy):
//   .sort({ date: 1 }).limit(days) would return the OLDEST N records once a
//   user has more history than `days`.  The correct pattern is:
//   sort descending (most-recent first), limit, then reverse in memory so the
//   response is still oldest-to-newest for charting.
router.get("/history", auth, async (req, res, next) => {
  try {
    const rawDays = parseInt(req.query.days, 10);
    const days = (!rawDays || rawDays < 1) ? 30 : Math.min(rawDays, 90);

    // Sort descending so limit() keeps the MOST RECENT records.
    const docs = await DailyMetric
      .find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(days)
      .lean();

    // Reverse in memory → oldest-to-newest order for the chart.
    docs.reverse();

    res.json({
      days: docs.map((d) => ({
        date:             d.date,
        commitCount:      d.commitCount,
        burnoutRisk:      d.burnoutRisk,
        lateNightCommits: d.lateNightCommits,
        weekendCommits:   d.weekendCommits,
      })),
    });
  } catch (error) {
    logger.error({ reqId: req.id, err: error }, "History query error");
    next(error);
  }
});

module.exports = router;


