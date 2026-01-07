const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  res.json({
    link: "https://silentdrop.dev/dummy-link",
  });
});

module.exports = router;
