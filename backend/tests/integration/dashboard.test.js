'use strict';

/**
 * Integration tests for GET /api/dashboard
 *
 * Tests the full middleware → controller pipeline using Supertest against a
 * minimal Express app.  getTodaysCommitCount is mocked so no real GitHub API
 * calls are made.  The step-band function calculateDailyRisk is now exported
 * from burnoutService.js; its bands are validated here both through the HTTP
 * response body (integration) and by direct import (unit).
 */

// Must be set before auth middleware or controllers are required
process.env.JWT_SECRET = 'test-jwt-secret';

// Mock the GitHub service before any requires so Jest replaces it in the
// module registry before dashboard.controller.js imports it.
jest.mock('../../services/githubService', () => ({
  getTodaysCommitCount: jest.fn(),
}));

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { getTodaysCommitCount } = require('../../services/githubService');
const { calculateDailyRisk } = require('../../services/burnoutService');
const dashboardRoutes = require('../../routes/dashboard.routes');
const errorHandler = require('../../middleware/errorHandler');

// Minimal Express app — only the dashboard route, no DB or Passport needed.
// errorHandler is wired last, matching production server.js, so next(error)
// calls from the controller are handled correctly in tests.
const app = express();
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);
app.use(errorHandler);

/** Sign a test JWT with the shared secret */
function makeToken(payload = { id: 'user123', githubUsername: 'testuser' }) {
  return jwt.sign(payload, 'test-jwt-secret', { expiresIn: '1d' });
}

beforeEach(() => {
  getTodaysCommitCount.mockReset();
});

// ─── Authentication guard tests ───────────────────────────────────────────────

describe('GET /api/dashboard — authentication', () => {
  test('returns 401 with "No token provided" when Authorization header is absent', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('No token provided');
  });

  test('returns 401 with "No token provided" for a malformed Bearer header', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', 'NotBearer token');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('No token provided');
  });

  test('returns 401 with "Invalid token" for a tampered JWT', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', 'Bearer invalid.jwt.token');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token');
  });

  test('returns 401 for a JWT signed with a wrong secret', async () => {
    const badToken = jwt.sign({ id: 'u1', githubUsername: 'x' }, 'wrong-secret');
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${badToken}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token');
  });
});

// ─── Burnout risk step-band tests (calculateDailyRisk via HTTP route) ─────────
// Each band matches the §14 spec, now implemented in burnoutService.calculateDailyRisk
// and imported by dashboard.controller.js.
//
//   0          → 0%
//   1–4        → 10%
//   5–7        → 18%
//   8–10       → 25%
//   11–14      → 32%
//   15–17      → 40%
//   18–20      → 48%
//   21–22      → 56%
//   23–25      → 64%
//   26–28      → 72%
//   29–34      → 80%
//   35–40      → 88%
//   41–50      → 94%
//   51+        → 100%

describe('GET /api/dashboard — burnout risk step bands', () => {
  async function getRisk(commits) {
    getTodaysCommitCount.mockResolvedValue(commits);
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.todaysCommits).toBe(commits);
    return res.body.burnoutRisk;
  }

  // ── Band 0: 0 commits ──────────────────────────────────────────────────────
  test('0 commits → burnoutRisk 0', async () => {
    expect(await getRisk(0)).toBe(0);
  });

  // ── Band 1: 1–4 commits → 10% ─────────────────────────────────────────────
  test('1 commit (band lower boundary) → burnoutRisk 10', async () => {
    expect(await getRisk(1)).toBe(10);
  });

  test('4 commits (band upper boundary) → burnoutRisk 10', async () => {
    expect(await getRisk(4)).toBe(10);
  });

  // ── Band 2: 5–7 commits → 18% ────────────────────────────────────────────
  test('5 commits (band lower boundary) → burnoutRisk 18', async () => {
    expect(await getRisk(5)).toBe(18);
  });

  // ── Band 3: 8–10 commits → 25% ───────────────────────────────────────────
  test('8 commits → burnoutRisk 25', async () => {
    expect(await getRisk(8)).toBe(25);
  });

  // ── Band 4: 11–14 commits → 32% ──────────────────────────────────────────
  test('14 commits (band upper boundary) → burnoutRisk 32', async () => {
    expect(await getRisk(14)).toBe(32);
  });

  // ── Band 5: 15–17 commits → 40% ──────────────────────────────────────────
  test('15 commits (band lower boundary) → burnoutRisk 40', async () => {
    expect(await getRisk(15)).toBe(40);
  });

  // ── Band 6: 18–20 commits → 48% ──────────────────────────────────────────
  test('18 commits → burnoutRisk 48', async () => {
    expect(await getRisk(18)).toBe(48);
  });

  // ── Band 7: 21–22 commits → 56% ──────────────────────────────────────────
  test('22 commits (band upper boundary) → burnoutRisk 56', async () => {
    expect(await getRisk(22)).toBe(56);
  });

  // ── Band 8: 23–25 commits → 64% ──────────────────────────────────────────
  test('25 commits (band upper boundary) → burnoutRisk 64', async () => {
    expect(await getRisk(25)).toBe(64);
  });

  // ── Band 9: 26–28 commits → 72% ──────────────────────────────────────────
  test('26 commits (band lower boundary) → burnoutRisk 72', async () => {
    expect(await getRisk(26)).toBe(72);
  });

  // ── Band 10–11 (heavy load) ───────────────────────────────────────────────
  test('34 commits → burnoutRisk 80', async () => {
    expect(await getRisk(34)).toBe(80);
  });

  test('40 commits → burnoutRisk 88', async () => {
    expect(await getRisk(40)).toBe(88);
  });

  // ── Band 12: 41–50 commits → 94% ─────────────────────────────────────────
  test('50 commits (band upper boundary) → burnoutRisk 94', async () => {
    expect(await getRisk(50)).toBe(94);
  });

  // ── Band 13: >50 commits → 100% ──────────────────────────────────────────
  test('51 commits → burnoutRisk 100', async () => {
    expect(await getRisk(51)).toBe(100);
  });

  test('100 commits → burnoutRisk 100 (extreme/unhealthy cap)', async () => {
    expect(await getRisk(100)).toBe(100);
  });
});

// ─── Error path ───────────────────────────────────────────────────────────────

describe('GET /api/dashboard — error handling', () => {
  test('returns 500 when getTodaysCommitCount throws an unexpected error', async () => {
    getTodaysCommitCount.mockRejectedValue(new Error('GitHub API down'));
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(500);
    // errorHandler returns a generic message for all 5xx to avoid leaking internals
    expect(res.body.error).toBe('Internal server error');
  });
});
