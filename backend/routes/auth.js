const express = require("express");
const passport = require("passport");

const router = express.Router();

// GitHub login
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
    prompt: "login",
  })
);

// GitHub callback
router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: "https://silentdrop-frontend.onrender.com",
    session: true,
  }),
  (req, res) => {
    // Save session explicitly before redirecting
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.redirect("https://silentdrop-frontend.onrender.com");
      }
      res.redirect("https://silentdrop-frontend.onrender.com/dashboard");
    });
  }
);


// Get logged-in user
router.get("/me", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  return res.json({
    username: req.user.username,
    githubId: req.user.githubId,
  });
});


// Logout
router.get("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.session.regenerate(() => {
      res.clearCookie("connect.sid", {
        path: "/",
        sameSite: "none",
        secure: true,
      });
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
});

module.exports = router;
