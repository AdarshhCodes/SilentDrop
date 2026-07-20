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
    coreHoursStart: { type: Number, default: 9 },  // 9 AM
    coreHoursEnd:   { type: Number, default: 17 },  // 5 PM
  },
  // SHA-256 hash of the current valid refresh token.
  // Overwritten on every login/refresh; clear it to invalidate all sessions.
  refreshTokenHash: { type: String, default: null },
});

// Fast lookup during OAuth upsert (every login hits this query).
userSchema.index({ githubId: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
