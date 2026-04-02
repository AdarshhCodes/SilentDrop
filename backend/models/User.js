const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  githubId: String,
  username: String,
  profileUrl: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  preferences: {
    timezone: { type: String, default: 'UTC' },
    coreHoursStart: { type: Number, default: 9 }, // 9 AM
    coreHoursEnd: { type: Number, default: 17 } // 5 PM
  }
});

module.exports = mongoose.model("User", userSchema);
