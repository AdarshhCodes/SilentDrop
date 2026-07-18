'use strict';

/**
 * backend/tests/unit/telemetryService.test.js
 *
 * Unit tests for recordDailyMetricsForAllUsers().
 *
 * Core property under test:
 *   If one user's GitHub fetch throws, the function WARNS for that user and
 *   continues processing the remaining users — it must not abort the loop.
 *
 * All external I/O is mocked:
 *   - User.find()             → controlled user list
 *   - fetchRawCommits()       → one rejects, others resolve
 *   - DailyMetric.findOneAndUpdate() → captured for assertion
 *   - logger                  → spied on
 */

jest.mock('../../utils/logger', () => ({
  info:  jest.fn(),
  warn:  jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('../../models/User');
jest.mock('../../models/DailyMetric');
jest.mock('../../services/githubService');
// burnoutService is NOT mocked — we use the real calculateDailyRisk
// so tests break if the function signature changes unexpectedly.

const logger       = require('../../utils/logger');
const User         = require('../../models/User');
const DailyMetric  = require('../../models/DailyMetric');
const { fetchRawCommits } = require('../../services/githubService');
const { recordDailyMetricsForAllUsers } = require('../../services/telemetryService');

const mongoose = require('mongoose');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fakeUser(overrides = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    username: 'testuser',
    preferences: { timezone: 'UTC' },
    ...overrides,
  };
}

/** Build a minimal fake commit object for yesterday UTC */
function fakeCommit(dateStr) {
  return {
    commit: { author: { date: `${dateStr}T10:00:00Z` } },
  };
}

/** Returns yesterday's YYYY-MM-DD in UTC */
function yesterdayUTC() {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  DailyMetric.findOneAndUpdate.mockResolvedValue({});
});

// ─── Core resilience test ─────────────────────────────────────────────────────

describe('recordDailyMetricsForAllUsers — per-user failure resilience', () => {
  test(
    'if one user\'s GitHub fetch throws, logs a warn for that user and ' +
    'continues — remaining users still get their DailyMetric records written',
    async () => {
      const failingUser  = fakeUser({ username: 'broken-user' });
      const passingUser1 = fakeUser({ username: 'good-user-1' });
      const passingUser2 = fakeUser({ username: 'good-user-2' });

      User.find.mockResolvedValue([failingUser, passingUser1, passingUser2]);

      const yesterday = yesterdayUTC();

      fetchRawCommits.mockImplementation(async (username) => {
        if (username === 'broken-user') {
          throw new Error('GitHub rate limit exceeded');
        }
        if (username === 'good-user-1') {
          return [fakeCommit(yesterday), fakeCommit(yesterday)]; // 2 commits
        }
        if (username === 'good-user-2') {
          return [fakeCommit(yesterday)]; // 1 commit
        }
        return [];
      });

      // Should resolve without throwing
      await expect(recordDailyMetricsForAllUsers()).resolves.not.toThrow();

      // ── The failing user must be warned, not errored ────────────────────────
      const warnCalls = logger.warn.mock.calls;
      const failWarn  = warnCalls.find(
        ([meta]) => meta?.username === 'broken-user'
      );
      expect(failWarn).toBeDefined();
      expect(failWarn[1]).toMatch(/GitHub fetch failed for user/);

      // ── The two passing users must each have had DailyMetric upserted ───────
      const upsertCalls = DailyMetric.findOneAndUpdate.mock.calls;

      // Verify both passing users were written (by userId match)
      const upsertedUserIds = upsertCalls.map(([filter]) =>
        filter.user.toString()
      );
      expect(upsertedUserIds).toContain(passingUser1._id.toString());
      expect(upsertedUserIds).toContain(passingUser2._id.toString());

      // The failing user must NOT have had an upsert attempted
      expect(upsertedUserIds).not.toContain(failingUser._id.toString());

      // ── Correct commit counts written ─────────────────────────────────────
      const user1Call = upsertCalls.find(
        ([filter]) => filter.user.toString() === passingUser1._id.toString()
      );
      expect(user1Call[1].commitCount).toBe(2);

      const user2Call = upsertCalls.find(
        ([filter]) => filter.user.toString() === passingUser2._id.toString()
      );
      expect(user2Call[1].commitCount).toBe(1);
    }
  );

  test('all three users succeed — no warn logged, all three upserted', async () => {
    const u1 = fakeUser({ username: 'alpha' });
    const u2 = fakeUser({ username: 'beta' });
    const u3 = fakeUser({ username: 'gamma' });

    User.find.mockResolvedValue([u1, u2, u3]);

    const yesterday = yesterdayUTC();
    fetchRawCommits.mockResolvedValue([fakeCommit(yesterday)]);

    await recordDailyMetricsForAllUsers();

    expect(DailyMetric.findOneAndUpdate).toHaveBeenCalledTimes(3);
    // No fetch-failure warns
    const fetchFailWarn = logger.warn.mock.calls.find(
      ([, msg]) => msg && msg.includes('GitHub fetch failed')
    );
    expect(fetchFailWarn).toBeUndefined();
  });

  test('all users fail — warns for each, no upserts attempted', async () => {
    const u1 = fakeUser({ username: 'bad1' });
    const u2 = fakeUser({ username: 'bad2' });

    User.find.mockResolvedValue([u1, u2]);
    fetchRawCommits.mockRejectedValue(new Error('Network error'));

    await recordDailyMetricsForAllUsers();

    expect(DailyMetric.findOneAndUpdate).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledTimes(2);
  });

  test('function resolves (does not throw) even if User.find itself fails', async () => {
    User.find.mockRejectedValue(new Error('DB connection lost'));

    await expect(recordDailyMetricsForAllUsers()).resolves.not.toThrow();
    expect(logger.error).toHaveBeenCalled();
  });
});

// ─── Metric calculation ───────────────────────────────────────────────────────

describe('recordDailyMetricsForAllUsers — metric calculation', () => {
  test('burnoutRisk is calculated via calculateDailyRisk (step-bands)', async () => {
    const user = fakeUser({ username: 'calc-test' });
    User.find.mockResolvedValue([user]);

    const yesterday = yesterdayUTC();
    // Seed 5 commits for yesterday → step-band for 5 commits = 18%
    fetchRawCommits.mockResolvedValue(Array(5).fill(fakeCommit(yesterday)));

    await recordDailyMetricsForAllUsers();

    const [, updateData] = DailyMetric.findOneAndUpdate.mock.calls[0];
    expect(updateData.commitCount).toBe(5);
    expect(updateData.burnoutRisk).toBe(18);   // calculateDailyRisk(5) === 18
  });

  test('commits from days other than yesterday are excluded', async () => {
    const user = fakeUser({ username: 'filter-test' });
    User.find.mockResolvedValue([user]);

    const yesterday = yesterdayUTC();
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)
      .toISOString().slice(0, 10);

    // 1 commit from yesterday, 3 from two days ago
    fetchRawCommits.mockResolvedValue([
      fakeCommit(yesterday),
      fakeCommit(twoDaysAgo),
      fakeCommit(twoDaysAgo),
      fakeCommit(twoDaysAgo),
    ]);

    await recordDailyMetricsForAllUsers();

    const [, updateData] = DailyMetric.findOneAndUpdate.mock.calls[0];
    // Only the 1 commit from yesterday should be counted
    expect(updateData.commitCount).toBe(1);
  });
});
