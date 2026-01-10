
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const DailySnapshot = require("../models/DailySnapshot");

router.get("/", auth, async (req, res) => {
  const userId = req.user._id;

  const snapshots = await DailySnapshot
    .find({ userId })
    .sort({ date: -1 })
    .limit(14)
    .lean();

  if (snapshots.length === 0) {
    return res.json({
      latestRisk: null,
      previousRisk: null,
      direction: "No data",
      history: [],
    });
  }

  const latest = snapshots[0];
  const previous = snapshots[1] || null;

  let direction = "Stable";
  if (previous) {
    if (latest.burnoutRisk > previous.burnoutRisk) direction = "Rising";
    if (latest.burnoutRisk < previous.burnoutRisk) direction = "Improving";
  }

  res.json({
    latestRisk: latest.burnoutRisk,
    previousRisk: previous ? previous.burnoutRisk : null,
    direction,
    history: snapshots.reverse(), // oldest → newest
  });
});

module.exports = router;
