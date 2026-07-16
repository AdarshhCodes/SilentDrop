'use strict';

/**
 * calculateDailyRisk(commitCount)
 *
 * Single-day burnout risk index derived from today's raw commit count.
 * Returns a risk percentage (0–100) following fixed step-bands (see §14 spec).
 *
 * Used by:   dashboard.controller.js → GET /api/dashboard
 * Powers:    RiskMeter UI, Digital Sunset overlay, Breathe Overlay.
 * Do NOT use for multi-day/trend analysis — use calculateHistoricalTrendScore.
 */
const calculateDailyRisk = (commits) => {
  // No work
  if (commits === 0) return 0;

  // Very light work
  if (commits <= 4) return 10;
  if (commits <= 7) return 18;

  // Normal productive day
  if (commits <= 10) return 25;
  if (commits <= 14) return 32;
  if (commits <= 17) return 40;

  // Heavy focus
  if (commits <= 20) return 48;
  if (commits <= 22) return 56;
  if (commits <= 25) return 64;

  // Intense workload
  if (commits <= 28) return 72;
  if (commits <= 34) return 80;

  // Very high strain
  if (commits <= 40) return 88;
  if (commits <= 50) return 94;

  // Extreme / unhealthy
  return 100;
};

/**
 * calculateHistoricalTrendScore(commitsByDate)
 *
 * Multi-day burnout trend score derived from a date-keyed commits map.
 * Uses a weighted formula:
 *   (weekendCommits / totalCommits) * 40
 *   + (highLoadDays  / totalDays)   * 60
 *
 * Used by:   (future) Trends page — historical multi-day burnout analysis.
 * Do NOT use for single-day snapshots — use calculateDailyRisk for that.
 */
const calculateHistoricalTrendScore = (commitsByDate) => {
  if (!commitsByDate || Object.keys(commitsByDate).length === 0) {
    return 0;
  }

  let totalCommits = 0;
  let weekendCommits = 0;
  let highLoadDays = 0;

  Object.entries(commitsByDate).forEach(([date, count]) => {
    totalCommits += count;

    const day = new Date(date).getDay();

    // Weekend commits (Saturday = 6, Sunday = 0)
    if (day === 0 || day === 6) {
      weekendCommits += count;
    }

    // High workload day (more than 5 commits/day)
    if (count >= 5) {
      highLoadDays++;
    }
  });

  let riskScore = 0;

  // Weekend pressure
  riskScore += (weekendCommits / totalCommits) * 40;

  // High intensity days pressure
  riskScore += (highLoadDays / Object.keys(commitsByDate).length) * 60;

  return Math.min(100, Math.round(riskScore));
};

module.exports = { calculateDailyRisk, calculateHistoricalTrendScore };

