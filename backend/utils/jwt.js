const jwt = require("jsonwebtoken");

const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      githubId: user.githubId,
       githubUsername: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

module.exports = { signToken };
