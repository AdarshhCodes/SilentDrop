const express = require("express");
const passport = require("passport");
const { signToken } = require("../utils/jwt");
const auth = require("../middleware/auth");

const router = express.Router();

// GitHub login
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
    prompt: "login",
  })
);

// GitHub callback → JWT
// GitHub callback → JWT
router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: "https://silent-drop.vercel.app",
    session: false,
  }),
  (req, res) => {
    const token = signToken(req.user);

    res.redirect(
      `https://silent-drop.vercel.app/auth-success?token=${token}`
    );
  }
);


// JWT test route
router.get("/me", auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
