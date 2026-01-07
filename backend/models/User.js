const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  githubId: String,
  username: String,
  profileUrl: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
