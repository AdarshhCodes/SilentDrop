'use strict';

// burnoutService.js uses new Date(date).getDay() which reads local timezone.
// Fix the process timezone to UTC before any Date operations so tests are
// deterministic across developer machines and CI runners.
process.env.TZ = 'UTC';

const {
  calculateDailyRisk,
  calculateHistoricalTrendScore,
} = require('../../services/burnoutService');

// ─── Reference dates (all UTC) ────────────────────────────────────────────────
// 2024-01-06  Saturday  (getDay() === 6)
// 2024-01-07  Sunday    (getDay() === 0)
// 2024-01-08  Monday    (getDay() === 1)
// 2024-01-09  Tuesday   (getDay() === 2)
// 2024-01-10  Wednesday (getDay() === 3)
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateHistoricalTrendScore — null / empty inputs', () => {
  test('returns 0 for null', () => {
    expect(calculateHistoricalTrendScore(null)).toBe(0);
  });

  test('returns 0 for undefined', () => {
    expect(calculateHistoricalTrendScore(undefined)).toBe(0);
  });

  test('returns 0 for an empty commits map', () => {
    expect(calculateHistoricalTrendScore({})).toBe(0);
  });
});

describe('calculateHistoricalTrendScore — weekday-only commits (no weekend pressure)', () => {
  test('returns 0 when all weekday commits are below the 5/day high-load threshold', () => {
    // Each day has 4 commits → no highLoadDays, no weekendCommits
    // score = (0/12)*40 + (0/3)*60 = 0
    const data = {
      '2024-01-08': 4, // Monday
      '2024-01-09': 4, // Tuesday
      '2024-01-10': 4, // Wednesday
    };
    expect(calculateHistoricalTrendScore(data)).toBe(0);
  });

  test('single weekday with exactly 5 commits triggers full high-load pressure', () => {
    // highLoadDays = 1, totalDays = 1 → ratio = 1 → highLoad score = 60
    // weekendCommits = 0 → weekend score = 0
    // total = 60
    const data = { '2024-01-08': 5 }; // Monday
    expect(calculateHistoricalTrendScore(data)).toBe(60);
  });

  test('4 commits does NOT trigger a high-load day', () => {
    // Boundary: count >= 5 triggers highLoadDay. 4 does not.
    const data = { '2024-01-08': 4 }; // Monday
    expect(calculateHistoricalTrendScore(data)).toBe(0);
  });

  test('single weekday with 10 commits — only high-load component scores', () => {
    // highLoadDays=1/1 → 60; weekendCommits=0 → 0; total=60
    const data = { '2024-01-08': 10 }; // Monday
    expect(calculateHistoricalTrendScore(data)).toBe(60);
  });

  test('two weekdays, one high-load, one not — half high-load pressure', () => {
    // highLoadDays=1, totalDays=2 → ratio=0.5 → score += 30
    // weekendCommits=0 → score += 0; total = 30
    const data = {
      '2024-01-08': 5, // Monday — high load
      '2024-01-09': 1, // Tuesday — not high load
    };
    expect(calculateHistoricalTrendScore(data)).toBe(30);
  });
});

describe('calculateHistoricalTrendScore — weekend commits', () => {
  test('full weekend score when all commits are on weekends (below 5 each)', () => {
    // weekendCommits=6, totalCommits=6 → ratio=1 → score += 40
    // highLoadDays=0 → score += 0; total = 40
    const data = {
      '2024-01-06': 3, // Saturday
      '2024-01-07': 3, // Sunday
    };
    expect(calculateHistoricalTrendScore(data)).toBe(40);
  });

  test('returns 100 when all commits are weekend + all days are high-load', () => {
    // weekendCommits=12/12 → 40; highLoadDays=2/2 → 60; total=100
    const data = {
      '2024-01-06': 6, // Saturday — high load
      '2024-01-07': 6, // Sunday  — high load
    };
    expect(calculateHistoricalTrendScore(data)).toBe(100);
  });

  test('score is capped at 100 even with extreme inputs', () => {
    const data = {
      '2024-01-06': 100, // Saturday
      '2024-01-07': 100, // Sunday
    };
    expect(calculateHistoricalTrendScore(data)).toBe(100);
  });
});

describe('calculateHistoricalTrendScore — mixed weekday and weekend commits', () => {
  test('calculates correct blended score for one weekend high-load + one weekday non-high-load', () => {
    // weekendCommits=6, totalCommits=10 → ratio=0.6 → score += 24
    // highLoadDays=1, totalDays=2 → ratio=0.5 → score += 30
    // total = 54
    const data = {
      '2024-01-06': 6, // Saturday — weekend + high load
      '2024-01-08': 4, // Monday  — weekday,   NOT high load
    };
    expect(calculateHistoricalTrendScore(data)).toBe(54);
  });

  test('one weekend day (no high load) + one weekday (no high load) → only partial weekend score', () => {
    // weekendCommits=2, totalCommits=6 → ratio≈0.333 → score += 13.33 → Math.round=13
    // highLoadDays=0 → 0; total = 13
    const data = {
      '2024-01-07': 2, // Sunday — low commits
      '2024-01-08': 4, // Monday — low commits (4 < 5 threshold)
    };
    // (2/6)*40 = 13.33… → Math.round(13.33) = 13
    expect(calculateHistoricalTrendScore(data)).toBe(13);
  });

  test('all commits on weekdays but all are high-load', () => {
    // weekendCommits=0 → 0; highLoadDays=3/3=1 → 60; total=60
    const data = {
      '2024-01-08': 5, // Monday
      '2024-01-09': 7, // Tuesday
      '2024-01-10': 9, // Wednesday
    };
    expect(calculateHistoricalTrendScore(data)).toBe(60);
  });
});

// ─── calculateDailyRisk — step-band boundary tests ───────────────────────────
// These mirror the integration-level coverage in dashboard.test.js and confirm
// the step-band logic directly against the exported function, independent of
// HTTP middleware or the GitHub service mock.

describe('calculateDailyRisk — step-band boundaries (§14 spec)', () => {
  // Band 0
  test('0 commits → 0%', () => expect(calculateDailyRisk(0)).toBe(0));

  // Band 1: 1–4 → 10%
  test('1 commit (lower boundary) → 10%', () => expect(calculateDailyRisk(1)).toBe(10));
  test('4 commits (upper boundary) → 10%', () => expect(calculateDailyRisk(4)).toBe(10));

  // Band 2: 5–7 → 18%
  test('5 commits (lower boundary) → 18%', () => expect(calculateDailyRisk(5)).toBe(18));
  test('7 commits (upper boundary) → 18%', () => expect(calculateDailyRisk(7)).toBe(18));

  // Band 3: 8–10 → 25%
  test('8 commits (lower boundary) → 25%', () => expect(calculateDailyRisk(8)).toBe(25));
  test('10 commits (upper boundary) → 25%', () => expect(calculateDailyRisk(10)).toBe(25));

  // Band 4: 11–14 → 32%
  test('11 commits (lower boundary) → 32%', () => expect(calculateDailyRisk(11)).toBe(32));
  test('14 commits (upper boundary) → 32%', () => expect(calculateDailyRisk(14)).toBe(32));

  // Band 5: 15–17 → 40%
  test('15 commits (lower boundary) → 40%', () => expect(calculateDailyRisk(15)).toBe(40));
  test('17 commits (upper boundary) → 40%', () => expect(calculateDailyRisk(17)).toBe(40));

  // Band 6: 18–20 → 48%
  test('18 commits (lower boundary) → 48%', () => expect(calculateDailyRisk(18)).toBe(48));
  test('20 commits (upper boundary) → 48%', () => expect(calculateDailyRisk(20)).toBe(48));

  // Band 7: 21–22 → 56%
  test('21 commits (lower boundary) → 56%', () => expect(calculateDailyRisk(21)).toBe(56));
  test('22 commits (upper boundary) → 56%', () => expect(calculateDailyRisk(22)).toBe(56));

  // Band 8: 23–25 → 64%
  test('23 commits (lower boundary) → 64%', () => expect(calculateDailyRisk(23)).toBe(64));
  test('25 commits (upper boundary) → 64%', () => expect(calculateDailyRisk(25)).toBe(64));

  // Band 9: 26–28 → 72%
  test('26 commits (lower boundary) → 72%', () => expect(calculateDailyRisk(26)).toBe(72));
  test('28 commits (upper boundary) → 72%', () => expect(calculateDailyRisk(28)).toBe(72));

  // Band 10: 29–34 → 80%
  test('29 commits (lower boundary) → 80%', () => expect(calculateDailyRisk(29)).toBe(80));
  test('34 commits (upper boundary) → 80%', () => expect(calculateDailyRisk(34)).toBe(80));

  // Band 11: 35–40 → 88%
  test('35 commits (lower boundary) → 88%', () => expect(calculateDailyRisk(35)).toBe(88));
  test('40 commits (upper boundary) → 88%', () => expect(calculateDailyRisk(40)).toBe(88));

  // Band 12: 41–50 → 94%
  test('41 commits (lower boundary) → 94%', () => expect(calculateDailyRisk(41)).toBe(94));
  test('50 commits (upper boundary) → 94%', () => expect(calculateDailyRisk(50)).toBe(94));

  // Band 13: >50 → 100%
  test('51 commits (lower boundary) → 100%', () => expect(calculateDailyRisk(51)).toBe(100));
  test('100 commits → 100%', () => expect(calculateDailyRisk(100)).toBe(100));
});
