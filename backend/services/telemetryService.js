'use strict';

/**
 * backend/services/telemetryService.js
 *
 * Nightly telemetry capture for all users.
 *
 * recordDailyMetricsForAllUsers():
 *   - Iterates every User document.
 *   - Fetches raw commits via fetchRawCommits(user.username).
 *   - user.username is set in passport.js from profile.username (the GitHub
 *     login handle, confirmed identical to profile.login for passport-github2).
 *   - Determines "yesterday" in the user's own stored timezone using the
 *     existing getHourInTimezone / getDayInTimezone utilities — no new
 *     timezone logic is introduced here.
 *   - Counts commitCount, lateNightCommits, weekendCommits for yesterday only.
 *   - Calls calculateDailyRisk(commitCount) — the single-day step-band
 *     function — for the burnoutRisk field.  Do NOT use
 *     calculateHistoricalTrendScore; that is a multi-day aggregate formula.
 *   - Upserts a DailyMetric record (idempotent — safe to re-run).
 *   - Per-user failures are caught and logged as WARN so one bad user never
 *     aborts the entire run.
 */

const User        = require('../models/User');
const DailyMetric = require('../models/DailyMetric');
const { fetchRawCommits }         = require('./githubService');
const { calculateDailyRisk }      = require('./burnoutService');
const { getHourInTimezone, getDayInTimezone } = require('../utils/time');
const logger = require('../utils/logger');

/**
 * Returns the 'YYYY-MM-DD' string representing "yesterday" in the given
 * IANA timezone (e.g. 'Asia/Kolkata').  Falls back to UTC on any parse error.
 */
function getYesterdayDateString(timezone = 'UTC') {
  try {
    const now = new Date();
    // Go back 24 hours to land somewhere in yesterday
    const yesterdayMs = now.getTime() - 24 * 60 * 60 * 1000;
    const yesterday   = new Date(yesterdayMs);

    const formatter = new Intl.DateTimeFormat('en-CA', {   // en-CA gives YYYY-MM-DD
      timeZone: timezone,
      year:  'numeric',
      month: '2-digit',
      day:   '2-digit',
    });
    return formatter.format(yesterday);   // 'YYYY-MM-DD'
  } catch {
    // Fallback: UTC yesterday
    const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  }
}

async function recordDailyMetricsForAllUsers() {
  logger.info('telemetryService: starting daily metric capture for all users');

  let users;
  try {
    users = await User.find({}, '_id username preferences');
  } catch (err) {
    logger.error({ err }, 'telemetryService: failed to fetch user list — aborting run');
    return;
  }

  logger.info({ userCount: users.length }, 'telemetryService: processing users');

  for (const user of users) {
    const username = user.username;
    const timezone = user.preferences?.timezone || 'UTC';
    const yesterdayDate = getYesterdayDateString(timezone);

    try {
      let rawCommits = [];
      try {
        rawCommits = await fetchRawCommits(username);
      } catch (fetchErr) {
        // GitHub fetch failed for this user — log and skip to next user.
        // This is intentionally a WARN (not ERROR) so one bad user doesn't
        // pollute the alert channel for a cron run.
        logger.warn(
          { userId: user._id, username, err: fetchErr.message },
          'telemetryService: GitHub fetch failed for user — skipping'
        );
        continue;    // ← do not abort; process remaining users
      }

      // Filter commits that fall within yesterday in the user's own timezone
      let commitCount      = 0;
      let lateNightCommits = 0;
      let weekendCommits   = 0;

      for (const commit of rawCommits) {
        const dateStr = commit.commit?.author?.date;
        if (!dateStr) continue;

        // Convert commit timestamp to user's timezone YYYY-MM-DD
        const commitDate = new Intl.DateTimeFormat('en-CA', {
          timeZone: timezone,
          year:  'numeric',
          month: '2-digit',
          day:   '2-digit',
        }).format(new Date(dateStr));

        if (commitDate !== yesterdayDate) continue;

        commitCount++;

        const hour = getHourInTimezone(dateStr, timezone);
        const day  = getDayInTimezone(dateStr, timezone);

        // Late-night: 22:00–04:59 in user's timezone
        if (hour >= 22 || hour <= 4) lateNightCommits++;

        // Weekend: Saturday (6) or Sunday (0)
        if (day === 0 || day === 6) weekendCommits++;
      }

      const burnoutRisk = calculateDailyRisk(commitCount);

      await DailyMetric.findOneAndUpdate(
        { user: user._id, date: yesterdayDate },
        { commitCount, burnoutRisk, lateNightCommits, weekendCommits },
        { upsert: true, new: true }
      );

      logger.info(
        { userId: user._id, username, date: yesterdayDate, commitCount, burnoutRisk },
        'telemetryService: DailyMetric upserted'
      );

    } catch (err) {
      // Catch-all for unexpected errors (DB write failure, etc.)
      // Log as WARN and continue — do not abort the loop.
      logger.warn(
        { userId: user._id, username, err: err.message },
        'telemetryService: unexpected error processing user — skipping'
      );
    }
  }

  logger.info('telemetryService: daily metric capture complete');
}

module.exports = { recordDailyMetricsForAllUsers, getYesterdayDateString };
