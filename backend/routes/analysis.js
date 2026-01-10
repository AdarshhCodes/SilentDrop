const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { ANALYSIS_DAYS_WINDOW } = require("../constants/analysisWindow");
const { getISTHour, getISTDay } = require("../utils/time");

const { fetchRawCommits } = require("../services/githubService");

const {calculateTodayBurnout} = require("../services/burnoutService");

router.get("/", auth, async (req, res) => {
  try {
    const username = req.user.githubUsername;
    if (!username) {
      return res.status(400).json({ error: "GitHub username missing" });
    }

    const hourHistogram = Array(24).fill(0);
    let totalCommits = 0;
    let lateNightCommits = 0;
    let weekendCommits = 0;

    // Fetch raw commits from GitHub
    const commits = await fetchRawCommits(username);

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

      // IST-normalized hour & day
      const hour = getISTHour(dateStr);
      const day = getISTDay(dateStr);

      hourHistogram[hour]++;

      // Late night: 22:00 – 04:59 IST
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
    if (totalCommits > 0 && peakHour === null) {
  peakHour = hourHistogram.findIndex((c) => c > 0);
}
    const burnoutRisk =calculateTodayBurnout(totalCommits);

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
    console.error("Pattern analysis error:", error);
    res.status(500).json({ error: "Failed to analyze patterns" });
  }
});

module.exports = router;

