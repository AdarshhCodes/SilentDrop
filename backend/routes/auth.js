const express = require("express");
const passport = require("passport");
const { signToken } = require("../utils/jwt");
const auth = require("../middleware/auth");

const router = express.Router();

// GitHub login
router.get(
  "/github",
  (req, res, next) => {
    const origin = req.query.origin || req.headers.referer || "https://silent-drop.vercel.app";
    passport.authenticate("github", {
      scope: ["user:email"],
      prompt: "login",
      state: origin,
    })(req, res, next);
  }
);

// GitHub callback → JWT
router.get(
  "/github/callback",
  (req, res, next) => {
    const stateOrigin = req.query.state || process.env.FRONTEND_URL || "https://silent-drop.vercel.app";
    passport.authenticate("github", {
      failureRedirect: stateOrigin,
      session: false,
    })(req, res, next);
  },
  (req, res) => {
    const token = signToken(req.user);
    const frontendUrl = req.query.state || process.env.FRONTEND_URL || "https://silent-drop.vercel.app";
    const cleanUrl = frontendUrl.endsWith("/") ? frontendUrl.slice(0, -1) : frontendUrl;

    res.redirect(
      `${cleanUrl}/auth-success?token=${token}`
    );
  }
);


// JWT test route
router.get("/me", auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
