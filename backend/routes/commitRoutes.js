const express = require("express");
const router = express.Router();
const Commit = require("../models/Commit");
const { fetchCommitActivity } = require("../services/githubService");
// const calculateBurnoutRisk = require("../services/burnoutService");

router.get("/fetch/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const commitData = await fetchCommitActivity(username);

    for (let date in commitData) {
      await Commit.create({
        commitDate: new Date(date),
        commitCount: commitData[date],
      });
    }

    res.json({ message: "Commit data stored successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch commits" });
  }
});

module.exports = router;
