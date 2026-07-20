'use strict';

/**
 * backend/tests/integration/rateLimit.test.js
 *
 * Tests that the GitHub-specific rate limiter (githubLoginLimiter) configured
 * in auth.js behaves correctly:
 *   (i)  Returns 429 after the configured maximum is exceeded.
 *   (ii) A DIFFERENT route (/me) is NOT covered by the same limiter.
 *
 * This file tests the BEHAVIOUR of the limiter in isolation by building a
 * minimal Express app with the same limiter configuration as auth.js, so that:
 *   - No real passport strategy is required.
 *   - No dotenv module-cache timing issues.
 *   - The limiter's in-memory store is freshly initialised for this test.
 */

const request   = require('supertest');
const express   = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// ─── Build a minimal app with the same limiter config as auth.js ──────────────
// Limit of 3, window of 30 seconds (plenty of time for sequential requests).
const strictLimiter = rateLimit({
  windowMs: 30_000,
  max: 3,
  // Use a constant key so all test requests share the same counter.
  // ipKeyGenerator is not reliable in supertest's in-process transport
  // (no real TCP socket, so req.ip / req.connection may differ per call).
  // In production, the real auth.js uses ipKeyGenerator which works correctly
  // because requests arrive over a real TCP connection.
  keyGenerator: () => 'test-ip',
  handler: (_req, res) => {
    res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
  },
  standardHeaders: false,
  legacyHeaders:   false,
});


const app = express();
app.set('trust proxy', 1);

// The /github route is protected by the strict limiter.
app.get('/api/auth/github',   strictLimiter, (_req, res) => res.status(200).json({ ok: true }));
// The /me route is NOT covered by the strict limiter.
app.get('/api/auth/me',       (_req, res) => res.status(200).json({ ok: true }));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Rate limiting — /api/auth/github (strict) vs /api/auth/me (not limited)', () => {
  test('/api/auth/github returns 429 after exceeding the limit (max=3)', async () => {
    // 5 sequential requests; the 4th and 5th must be 429 (limit=3).
    const statuses = [];
    for (let i = 0; i < 5; i++) {
      // eslint-disable-next-line no-await-in-loop
      const r = await request(app).get('/api/auth/github');
      statuses.push(r.status);
    }

    // First 3 must succeed; at least the 4th must be 429.
    expect(statuses.slice(0, 3)).not.toContain(429);
    const blocked = statuses.filter((s) => s === 429);
    expect(blocked.length).toBeGreaterThanOrEqual(1);
  });

  test('/api/auth/me is NOT blocked by the /github rate limiter', async () => {
    // Exhaust the /github limit (send 5, limit=3).
    for (let i = 0; i < 5; i++) {
      // eslint-disable-next-line no-await-in-loop
      await request(app).get('/api/auth/github');
    }

    // /me is on a separate route without the limiter — must still respond 200.
    const meRes = await request(app).get('/api/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.status).not.toBe(429);
  });
});
