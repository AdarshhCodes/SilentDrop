'use strict';

/**
 * backend/cron/index.js
 *
 * Schedules the nightly DailyMetric capture for all users.
 *
 * SCHEDULE: 23:00 UTC daily ("0 23 * * *")
 *
 * Timezone approximation note:
 *   Running at 23:00 UTC means the job fires at:
 *     • 23:00 for UTC+0  (UK)
 *     • 04:30 next day for UTC+5:30  (IST, the primary user base)
 *     • 12:00 noon for UTC+13:00  (Pacific/Apia — too early)
 *   This is an approximation.  Users in strongly negative offsets (UTC-11
 *   to UTC-12) will have their "yesterday" snapshot captured while their
 *   local day is still in progress.  The upsert is idempotent, so if the
 *   cron fires again the next real midnight it will overwrite with the
 *   complete count.  Acceptable for this app's scale and user base.
 *
 * DEPLOYMENT NOTE:
 *   node-cron runs in-process inside the Render web service.  This is
 *   intentional given the current single-instance, low-frequency workload.
 *   If the service ever:
 *     (a) restarts frequently (free-tier sleep/wake cycles can miss the window),
 *     (b) scales to multiple instances (each instance would run the job independently),
 *   → migrate this to Render's dedicated Cron Job feature, which runs in a
 *     separate isolated process on a guaranteed schedule.
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const { recordDailyMetricsForAllUsers } = require('../services/telemetryService');

// 23:00 UTC every day
cron.schedule('0 23 * * *', async () => {
  logger.info('cron: triggering recordDailyMetricsForAllUsers (23:00 UTC)');
  try {
    await recordDailyMetricsForAllUsers();
  } catch (err) {
    logger.error({ err }, 'cron: recordDailyMetricsForAllUsers threw unexpectedly');
  }
}, {
  timezone: 'UTC',
});

logger.info('cron: daily telemetry job scheduled at 23:00 UTC');
