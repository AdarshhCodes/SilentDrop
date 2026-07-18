'use strict';

const mongoose = require('mongoose');

/**
 * DailyMetric — one record per user per calendar day.
 *
 * Captures a daily snapshot of commit volume and inferred strain signals.
 * These records are the source of truth for the Trends page's historical view.
 *
 * date format: 'YYYY-MM-DD' — same convention as Reflection.date.
 *
 * burnoutRisk is calculated with calculateDailyRisk(commitCount) from
 * burnoutService.js (the single-day step-band function), matching exactly what
 * the live dashboard showed the user on that day.
 * Do NOT use calculateHistoricalTrendScore here — that is a different
 * multi-day aggregate formula, not a per-day stored value.
 */
const dailyMetricSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Calendar day in the user's own timezone — 'YYYY-MM-DD'
  date: {
    type: String,
    required: true,
  },
  commitCount: {
    type: Number,
    default: 0,
  },
  // Percentage 0-100 from calculateDailyRisk(commitCount)
  burnoutRisk: {
    type: Number,
    default: 0,
  },
  lateNightCommits: {
    type: Number,
    default: 0,
  },
  weekendCommits: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// One record per user per day — enforced at DB level.
// The unique index also makes upserts safe and idempotent.
dailyMetricSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyMetric', dailyMetricSchema);
