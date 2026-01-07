const express = require("express");
const axios = require("axios");
const Commit = require("../models/Commit");

const router = express.Router();

// Fetch and store GitHub commits
router.get("/fetch", async (req, res) => {
  try {
    // TEMP: hardcoded username for now
    const username = req.user?.username || "octocat";

    const response = await axios.get(
      `https://api.github.com/users/${username}/events/public`
    );

    const pushEvents = response.data.filter(
      (event) => event.type === "PushEvent"
    );

    const commitsToSave = [];

    pushEvents.forEach((event) => {
      const commitDate = new Date(event.created_at);

      commitsToSave.push({
        userId: req.user?._id,
        commitDate,
        commitCount: event.payload.commits.length,
      });
    });

    if (commitsToSave.length > 0) {
      await Commit.insertMany(commitsToSave);
    }

    res.json({
      message: "Commits fetched & saved successfully",
      saved: commitsToSave.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch commits" });
  }
});

module.exports = router;
