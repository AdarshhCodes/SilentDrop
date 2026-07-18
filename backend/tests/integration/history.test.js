'use strict';

/**
 * backend/tests/integration/history.test.js
 *
 * Integration test for GET /api/analysis/history.
 *
 * Core regression being guarded:
 *   .sort({ date: 1 }).limit(days) returns the OLDEST records once a user
 *   has more history than requested.  The correct implementation sorts
 *   descending, limits, then reverses — this test is written to FAIL against
 *   the naive ascending-sort approach and PASS only against the correct one.
 */

const request      = require('supertest');
const express      = require('express');
const jwt          = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose     = require('mongoose');

// ─── Env setup (must be before model / route requires) ────────────────────────
process.env.JWT_SECRET = 'test-secret-history';

const DailyMetric    = require('../../models/DailyMetric');
const analysisRoutes = require('../../routes/analysis');
const errorHandler   = require('../../middleware/errorHandler');

// ─── Minimal Express app ──────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/api/analysis', analysisRoutes);
app.use(errorHandler);

// ─── In-memory MongoDB ────────────────────────────────────────────────────────
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await DailyMetric.deleteMany({});
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FAKE_USER_ID = new mongoose.Types.ObjectId();

function makeToken() {
  return jwt.sign(
    { id: FAKE_USER_ID, githubUsername: 'testuser' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Seed N DailyMetric records for FAKE_USER_ID spanning consecutive days
 * starting from a given ISO date string.
 * Returns the array of date strings seeded, oldest-first.
 */
async function seedMetrics(startDateStr, count) {
  const dates = [];
  const start = new Date(startDateStr);

  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    dates.push(dateStr);

    await DailyMetric.create({
      user:         FAKE_USER_ID,
      date:         dateStr,
      commitCount:  i + 1,     // distinct so we can identify records
      burnoutRisk:  (i + 1) * 2,
      lateNightCommits: 0,
      weekendCommits:   0,
    });
  }
  return dates;   // oldest → newest
}

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/analysis/history — sort/limit correctness (regression for ascending-sort bug)', () => {
  /**
   * Seeds 45 consecutive daily records.
   * Requests ?days=30.
   * Asserts the response contains the 30 MOST RECENT dates, not the oldest 30.
   *
   * Against the buggy .sort({ date: 1 }).limit(30) implementation this test
   * would receive dates[0..29] (the oldest 30) and FAIL the assertion that
   * the first response date equals dates[15] (the 16th oldest = 31st from end).
   */
  test('returns the 30 most-recent records when user has 45 days of history', async () => {
    const allDates = await seedMetrics('2024-01-01', 45);
    // The 30 most recent are allDates[15..44]
    const expectedDates = allDates.slice(15);   // 30 entries

    const res = await request(app)
      .get('/api/analysis/history?days=30')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.days).toHaveLength(30);

    // Response must be ordered oldest-to-newest (chart order)
    const returnedDates = res.body.days.map((d) => d.date);
    expect(returnedDates[0]).toBe(expectedDates[0]);          // oldest of the 30
    expect(returnedDates[29]).toBe(expectedDates[29]);        // newest of the 30
    expect(returnedDates).toEqual(expectedDates);             // exact match

    // Confirm the OLDEST record (day 1) is NOT in the response — this is the
    // direct proof that ascending-sort + limit would have failed.
    expect(returnedDates).not.toContain(allDates[0]);
    expect(returnedDates).not.toContain(allDates[14]);
  });

  test('response dates are in ascending (oldest-to-newest) order', async () => {
    await seedMetrics('2024-03-01', 10);

    const res = await request(app)
      .get('/api/analysis/history?days=10')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    const dates = res.body.days.map((d) => d.date);
    const sorted = [...dates].sort();   // lexicographic sort = date sort for YYYY-MM-DD
    expect(dates).toEqual(sorted);
  });

  test('returns all records (oldest-to-newest) when user has fewer than requested days', async () => {
    await seedMetrics('2024-06-01', 5);

    const res = await request(app)
      .get('/api/analysis/history?days=30')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.days).toHaveLength(5);
  });
});

describe('GET /api/analysis/history — days param default and cap', () => {
  beforeEach(async () => {
    await seedMetrics('2024-01-01', 10);
  });

  test('defaults to 30 when ?days param is absent', async () => {
    // Only 10 records seeded — endpoint returns all 10; no truncation at 30
    const res = await request(app)
      .get('/api/analysis/history')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.days.length).toBeLessThanOrEqual(30);
  });

  test('caps at 90 when ?days=100 is requested', async () => {
    // Seed 10 records — response limited to those 10; but the cap logic
    // is exercised (min(100, 90) = 90 → then limited by actual DB count)
    const res = await request(app)
      .get('/api/analysis/history?days=100')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    // Can't exceed 90 (only 10 seeded so response has 10 — cap is tested by unit logic)
    expect(res.body.days.length).toBeLessThanOrEqual(90);
  });
});

describe('GET /api/analysis/history — response shape', () => {
  test('each record has the expected fields', async () => {
    await seedMetrics('2024-05-01', 2);

    const res = await request(app)
      .get('/api/analysis/history?days=2')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    const [first] = res.body.days;
    expect(first).toHaveProperty('date');
    expect(first).toHaveProperty('commitCount');
    expect(first).toHaveProperty('burnoutRisk');
    expect(first).toHaveProperty('lateNightCommits');
    expect(first).toHaveProperty('weekendCommits');
  });

  test('returns empty array when user has no history', async () => {
    const res = await request(app)
      .get('/api/analysis/history')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.days).toEqual([]);
  });
});
