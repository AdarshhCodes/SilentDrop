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
    failureRedirect: "http://localhost:5173",
  }),
  (req, res) => {
    res.redirect("http://localhost:5173/dashboard");
  }
);

// Get logged-in user
router.get("/user", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  res.json({
    username: req.user.username,
    githubId: req.user.githubId,
  });
});

router.get("/logout", (req, res, next) => {
  req.logout(err => {
    if(err) return next(err);
    req.session.regenerate(() => {
      res.clearCookie("sid");
      res.status(200).json({messsage: "Logged out successfully"});

    });
  });
});

module.exports = router;
