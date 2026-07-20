'use strict';

const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

// ─── Access token (short-lived, 15 min) ──────────────────────────────────────
// Same payload shape as the old signToken so all existing middleware
// (auth.js reads decoded.id, decoded.githubUsername) continues to work.
function signAccessToken(user) {
  return jwt.sign(
    {
      id:             user._id ?? user.id,
      githubId:       user.githubId,
      githubUsername: user.username ?? user.githubUsername,
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

// ─── Refresh token (long-lived, 7 days) ──────────────────────────────────────
// Minimal payload — just enough to look up the user and check the stored hash.
// Uses a separate REFRESH_TOKEN_SECRET so the two token types are
// cryptographically independent; compromise of one does not compromise the other.
// jti (JWT ID) is a random value so each issued token is unique even for the
// same user within the same second — required for hash-rotation to work.
function signRefreshToken(userId) {
  return jwt.sign(
    { sub: String(userId), type: 'refresh', jti: crypto.randomUUID() },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
}

// ─── Verify helpers ───────────────────────────────────────────────────────────
function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
}

// ─── Refresh token hashing ────────────────────────────────────────────────────
// Store only a SHA-256 hash of the refresh token in the DB so a DB dump
// does not expose the actual token value.
function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ─── Deprecated alias (kept for backward-compat with existing tests) ──────────
// @deprecated Use signAccessToken() for new code.
const signToken = signAccessToken;

module.exports = {
  signToken,          // backward-compat alias
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashRefreshToken,
};
