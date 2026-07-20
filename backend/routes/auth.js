'use strict';

const express  = require('express');
const passport = require('passport');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
} = require('../utils/jwt');
const auth    = require('../middleware/auth');
const User    = require('../models/User');
const logger  = require('../utils/logger');

const router = express.Router();

// ─── Auth-specific brute-force limiter ────────────────────────────────────────
// Applied ONLY to the two GitHub OAuth entry points — not to /me or /refresh.
//
// /refresh fires automatically from the Axios interceptor every 15 min during
// normal use, and /me is called on every page load.  Applying the strict
// limiter to those would cause legitimate 429s for any user browsing for an
// hour or coming from a shared/corporate IP.
//
// RATE_LIMIT_WINDOW_MS can be overridden in tests (e.g. to 100ms) so the
// rate-limit test does not need to wait 15 real minutes.
const AUTH_WINDOW_MS  = parseInt(process.env.RATE_LIMIT_WINDOW_MS,  10) || 15 * 60 * 1000;
const AUTH_MAX        = parseInt(process.env.RATE_LIMIT_AUTH_MAX,   10) || 10;

const githubLoginLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_MAX,
  keyGenerator: (req) => ipKeyGenerator(req),
  handler: (_req, res) => {
    res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
  },
  standardHeaders: false,
  legacyHeaders:   false,
});




// ─── GitHub OAuth — initiation ────────────────────────────────────────────────
router.get(
  '/github',
  githubLoginLimiter,   // ← only this route and /github/callback are rate-limited
  (req, res, next) => {
    const origin = req.query.origin || req.headers.referer || 'https://silent-drop.vercel.app';
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const callbackURL = `${protocol}://${req.get('host')}/api/auth/github/callback`;

    passport.authenticate('github', {
      scope: ['user:email'],
      prompt: 'login',
      state: origin,
      callbackURL,
    })(req, res, next);
  }
);

// ─── GitHub OAuth — callback ──────────────────────────────────────────────────
router.get(
  '/github/callback',
  githubLoginLimiter,   // ← rate-limit the callback too (prevents callback replay spam)
  (req, res, next) => {
    const stateOrigin = req.query.state || process.env.FRONTEND_URL || 'https://silent-drop.vercel.app';
    req.authOrigin = stateOrigin;
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const callbackURL = `${protocol}://${req.get('host')}/api/auth/github/callback`;

    passport.authenticate('github', {
      failureRedirect: stateOrigin,
      session: false,
      callbackURL,
    })(req, res, next);
  },
  async (req, res) => {
    try {
      const user = req.user;
      const accessToken  = signAccessToken(user);
      const refreshToken = signRefreshToken(user._id);

      // Store a hash of the refresh token so that:
      //   (a) a DB dump does not expose the raw token,
      //   (b) clearing this field invalidates all active sessions.
      await User.findByIdAndUpdate(user._id, {
        refreshTokenHash: hashRefreshToken(refreshToken),
      });

      const frontendUrl = req.authOrigin || req.query.state || process.env.FRONTEND_URL || 'https://silent-drop.vercel.app';
      const cleanUrl    = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;

      // RESIDUAL RISK — documented, not silent:
      // Both tokens are passed in the redirect query string.  Render's access
      // logs may capture full URLs including these values.  The refresh token
      // is long-lived (7 days), so a copy in server logs is a real residual
      // risk.  Eliminating this fully would require POST-based token delivery
      // (e.g. a one-time code exchanged for tokens via a separate /api/auth/token
      // call), which requires frontend changes beyond the scope of this phase.
      // AuthSuccess.jsx calls window.history.replaceState() immediately after
      // reading the tokens to remove them from visible browser history.
      res.redirect(`${cleanUrl}/auth-success?token=${accessToken}&refreshToken=${refreshToken}`);

    } catch (err) {
      logger.error({ err }, 'auth: error issuing tokens after OAuth callback');
      res.redirect(req.authOrigin || process.env.FRONTEND_URL || 'https://silent-drop.vercel.app');
    }
  }

);

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
// Verifies the refresh token, checks the stored hash, issues a new pair,
// and overwrites the stored hash (rotation — old token immediately invalid).
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    if (payload.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Validate against the stored hash — prevents reuse of an old refresh token
    // after a newer one has been issued (rotation invalidates the previous token).
    const incomingHash = hashRefreshToken(refreshToken);
    if (!user.refreshTokenHash || user.refreshTokenHash !== incomingHash) {
      // Possible token reuse attack — clear the stored hash to force re-login.
      await User.findByIdAndUpdate(user._id, { refreshTokenHash: null });
      logger.warn({ userId: user._id }, 'auth: refresh token hash mismatch — possible reuse attack, sessions cleared');
      return res.status(401).json({ error: 'Refresh token already used or revoked' });
    }

    // Issue new pair and rotate the stored hash
    const newAccessToken  = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, {
      refreshTokenHash: hashRefreshToken(newRefreshToken),
    });

    logger.info({ userId: user._id }, 'auth: tokens refreshed');
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });

  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
// Clears the stored refresh token hash — invalidates all active sessions
// ("logout everywhere").  Client is responsible for clearing localStorage.
router.post('/logout', auth, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshTokenHash: null });
    logger.info({ userId: req.user.id }, 'auth: logout — refresh token hash cleared');
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Not rate-limited by the auth limiter — it's called on every page load.
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
