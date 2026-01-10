const express = require("express");
const auth = require("../middleware/auth")
const router = express.Router();
const { getDashboardData } = require("../controllers/dashboard.controller");

router.get("/", auth, getDashboardData);

module.exports = router;
