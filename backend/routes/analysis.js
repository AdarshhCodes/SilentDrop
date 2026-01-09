const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth")

const { fetchCommitActivity } = require("../services/githubService");
const { calculateBurnoutScore } = require("../services/burnoutService");

router.get("/me", auth, (req, res) => {
  res.json({ user: req.user });
});


router.get("/", auth, async (req, res) => {
   
    try {
    const username = req.user.githubId;
    if (!username) {
  return res.status(400).json({ error: "GitHub username missing" });
}


    const commitsByDate = await fetchCommitActivity(username);

    const burnoutRisk = calculateBurnoutScore(commitsByDate);

      //Additional pattern analysis
      let lateNightCommits = 0;
let weekendCommits = 0;
let hourCount = {};

Object.entries(commitsByDate).forEach(([date, count]) => {
  const d = new Date(date);
  const hour = d.getHours();
  const day = d.getDay();

  // late night: 11 PM – 4 AM
  if (hour >= 23 || hour <= 4) {
    lateNightCommits += count;
  }

  // weekend
  if (day === 0 || day === 6) {
    weekendCommits += count;
  }

  hourCount[hour] = (hourCount[hour] || 0) + count;
});

const totalCommits = Object.values(commitsByDate)
  .reduce((a, b) => a + b, 0);

const lateNightPercentage = Math.round(
  (lateNightCommits / totalCommits) * 100
);

const weekendPercentage = Math.round(
  (weekendCommits / totalCommits) * 100
);

const peakHour = Object.keys(hourCount).length >0 ? Object.keys(hourCount).reduce((a, b) => hourCount[a] > hourCount[b] ? a : b) : null;


    res.json({
      totalCommits,
      burnoutRisk,
      pattern : {
        lateNightPercentage,
        weekendPercentage,
        peakHour
      }
    });

  } catch (error) {
    console.error("Burnout analysis error:", error);
    res.status(500).json({ error: "Failed to analyze burnout" });
  }
});

module.exports = router;

