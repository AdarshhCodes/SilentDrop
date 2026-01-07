
const path = require("path");
require("dotenv").config({
    path: path.resolve(__dirname, "../.env"),
});

const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;

const User = require("../models/User");

passport.use(
    new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,

        callbackURL: "http://localhost:5000/auth/github/callback"

    },
        async (accessToken, refreshToken, profile, done) => {
            let user = await User.findOne({ githubId: profile.id });
            if (!user) {
                user = await User.create({
                    githubId: profile.id,
                    username: profile.username,
                    profileUrl: profile.profileUrl,
                });
            }
            return done(null, user);
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
   try {
     const user = await User.findById(id);
    done(null, user || null);
}
  catch (err) {
    done(err, null)
  }
});

