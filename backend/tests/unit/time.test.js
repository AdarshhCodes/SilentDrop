'use strict';

const {
  getHourInTimezone,
  getDayInTimezone,
  getISTHour,
  getISTDay,
} = require('../../utils/time');

// Helper: check if hour falls in late-night window (22:00–04:59)
const isLateNight = (hour) => hour >= 22 || hour <= 4;

// ─── Reference UTC timestamps ─────────────────────────────────────────────────
// 2024-01-06T00:00:00Z  = Saturday midnight UTC
// 2024-01-06T12:00:00Z  = Saturday noon UTC
// 2024-01-07T12:00:00Z  = Sunday noon UTC
// 2024-01-08T12:00:00Z  = Monday noon UTC
// 2024-01-06T22:00:00Z  = Saturday 22:00 UTC (late-night start)
// 2024-01-06T04:59:00Z  = Saturday 04:59 UTC (last late-night minute)
// 2024-01-06T05:00:00Z  = Saturday 05:00 UTC (first non-late-night minute)
// ─────────────────────────────────────────────────────────────────────────────

describe('getHourInTimezone — UTC', () => {
  test('midnight UTC → hour 0', () => {
    expect(getHourInTimezone('2024-01-06T00:00:00Z', 'UTC')).toBe(0);
  });

  test('14:30 UTC → hour 14', () => {
    expect(getHourInTimezone('2024-01-06T14:30:00Z', 'UTC')).toBe(14);
  });

  test('23:59 UTC → hour 23', () => {
    expect(getHourInTimezone('2024-01-06T23:59:00Z', 'UTC')).toBe(23);
  });

  test('result is always 0–23 (normalizes any potential Intl hour=24)', () => {
    const hour = getHourInTimezone('2024-01-06T00:00:00Z', 'UTC');
    expect(hour).toBeGreaterThanOrEqual(0);
    expect(hour).toBeLessThanOrEqual(23);
  });
});

describe('getHourInTimezone — late-night boundary (22:00–04:59)', () => {
  test('22:00 UTC is the start of the late-night window', () => {
    const hour = getHourInTimezone('2024-01-06T22:00:00Z', 'UTC');
    expect(hour).toBe(22);
    expect(isLateNight(hour)).toBe(true);
  });

  test('23:30 UTC is within the late-night window', () => {
    const hour = getHourInTimezone('2024-01-06T23:30:00Z', 'UTC');
    expect(hour).toBe(23);
    expect(isLateNight(hour)).toBe(true);
  });

  test('00:00 UTC is within the late-night window', () => {
    const hour = getHourInTimezone('2024-01-07T00:00:00Z', 'UTC');
    expect(hour).toBe(0);
    expect(isLateNight(hour)).toBe(true);
  });

  test('04:59 UTC is the last minute of the late-night window', () => {
    const hour = getHourInTimezone('2024-01-06T04:59:00Z', 'UTC');
    expect(hour).toBe(4);
    expect(isLateNight(hour)).toBe(true);
  });

  test('05:00 UTC is NOT late-night (first safe hour)', () => {
    const hour = getHourInTimezone('2024-01-06T05:00:00Z', 'UTC');
    expect(hour).toBe(5);
    expect(isLateNight(hour)).toBe(false);
  });

  test('21:59 UTC is NOT late-night (one minute before window)', () => {
    const hour = getHourInTimezone('2024-01-06T21:59:00Z', 'UTC');
    expect(hour).toBe(21);
    expect(isLateNight(hour)).toBe(false);
  });
});

describe('getHourInTimezone — Asia/Kolkata (UTC+5:30, half-hour offset)', () => {
  test('18:30 UTC → 00:00 IST (midnight IST, hour 0)', () => {
    // 18:30 UTC + 5:30 = 24:00 = 00:00 IST
    expect(getHourInTimezone('2024-01-05T18:30:00Z', 'Asia/Kolkata')).toBe(0);
  });

  test('13:00 UTC → 18:30 IST (hour 18)', () => {
    expect(getHourInTimezone('2024-01-05T13:00:00Z', 'Asia/Kolkata')).toBe(18);
  });

  test('16:30 UTC → 22:00 IST — start of IST late-night window', () => {
    const hour = getHourInTimezone('2024-01-05T16:30:00Z', 'Asia/Kolkata');
    expect(hour).toBe(22);
    expect(isLateNight(hour)).toBe(true);
  });

  test('23:30 UTC → 05:00 IST — NOT late-night in IST', () => {
    // 23:30 UTC + 5:30 = 29:00 = 05:00 IST
    const hour = getHourInTimezone('2024-01-05T23:30:00Z', 'Asia/Kolkata');
    expect(hour).toBe(5);
    expect(isLateNight(hour)).toBe(false);
  });
});

describe('getHourInTimezone — America/New_York (UTC-5 in winter, EST)', () => {
  test('05:00 UTC → 00:00 EST (midnight in New York, hour 0)', () => {
    expect(getHourInTimezone('2024-01-06T05:00:00Z', 'America/New_York')).toBe(0);
  });

  test('00:00 UTC → 19:00 EST (prior evening in New York, hour 19)', () => {
    expect(getHourInTimezone('2024-01-06T00:00:00Z', 'America/New_York')).toBe(19);
  });

  test('03:00 UTC → 22:00 EST — late-night for a New York developer', () => {
    const hour = getHourInTimezone('2024-01-06T03:00:00Z', 'America/New_York');
    expect(hour).toBe(22);
    expect(isLateNight(hour)).toBe(true);
  });
});

describe('getHourInTimezone — invalid timezone fallback', () => {
  test('does not throw for an invalid timezone string', () => {
    expect(() => getHourInTimezone('2024-01-06T14:00:00Z', 'Fake/Zone')).not.toThrow();
  });

  test('falls back to the UTC hour when timezone is invalid', () => {
    // Error path returns date.getUTCHours()
    expect(getHourInTimezone('2024-01-06T14:00:00Z', 'Fake/Zone')).toBe(14);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('getDayInTimezone — UTC weekday and weekend classification', () => {
  test('Sunday noon UTC → day 0 (Sunday)', () => {
    expect(getDayInTimezone('2024-01-07T12:00:00Z', 'UTC')).toBe(0);
  });

  test('Saturday noon UTC → day 6 (Saturday)', () => {
    expect(getDayInTimezone('2024-01-06T12:00:00Z', 'UTC')).toBe(6);
  });

  test('Monday noon UTC → day 1 (Monday, not a weekend)', () => {
    expect(getDayInTimezone('2024-01-08T12:00:00Z', 'UTC')).toBe(1);
  });

  test('Friday noon UTC → day 5 (Friday, not a weekend)', () => {
    expect(getDayInTimezone('2024-01-05T12:00:00Z', 'UTC')).toBe(5);
  });

  test('Sunday is classified as a weekend day', () => {
    const day = getDayInTimezone('2024-01-07T12:00:00Z', 'UTC');
    expect(day === 0 || day === 6).toBe(true);
  });

  test('Saturday is classified as a weekend day', () => {
    const day = getDayInTimezone('2024-01-06T12:00:00Z', 'UTC');
    expect(day === 0 || day === 6).toBe(true);
  });

  test('Monday is NOT classified as a weekend day', () => {
    const day = getDayInTimezone('2024-01-08T12:00:00Z', 'UTC');
    expect(day === 0 || day === 6).toBe(false);
  });
});

describe('getDayInTimezone — Asia/Kolkata day-boundary crossing', () => {
  test('2024-01-06T18:30:00Z is midnight IST on Sunday — should return day 0', () => {
    // 18:30 UTC = 00:00 IST on 2024-01-07 (Sunday)
    expect(getDayInTimezone('2024-01-06T18:30:00Z', 'Asia/Kolkata')).toBe(0);
  });

  test('2024-01-06T18:29:00Z is 23:59 IST on Saturday — should return day 6', () => {
    // 18:29 UTC = 23:59 IST on 2024-01-06 (Saturday) — still Saturday in IST
    expect(getDayInTimezone('2024-01-06T18:29:00Z', 'Asia/Kolkata')).toBe(6);
  });

  test('IST weekend commits are correctly identified', () => {
    // Saturday IST midnight (Friday 18:30 UTC)
    const day = getDayInTimezone('2024-01-05T18:30:00Z', 'Asia/Kolkata');
    expect(day === 0 || day === 6).toBe(true); // Saturday IST
  });
});

describe('getDayInTimezone — America/New_York day-boundary crossing', () => {
  test('Sunday UTC midnight is still Saturday evening in New York (EST, UTC-5)', () => {
    // 2024-01-07T00:00:00Z = 2024-01-06T19:00 EST (Saturday)
    expect(getDayInTimezone('2024-01-07T00:00:00Z', 'America/New_York')).toBe(6);
  });
});

describe('getDayInTimezone — invalid timezone fallback', () => {
  test('does not throw for an invalid timezone string', () => {
    expect(() => getDayInTimezone('2024-01-07T12:00:00Z', 'Fake/TZ')).not.toThrow();
  });

  test('falls back to UTC day when timezone is invalid', () => {
    // Sunday in UTC → 0
    expect(getDayInTimezone('2024-01-07T12:00:00Z', 'Fake/TZ')).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('getISTHour and getISTDay — convenience wrappers', () => {
  test('getISTHour: 2024-01-05T18:30:00Z → hour 0 (IST midnight)', () => {
    expect(getISTHour('2024-01-05T18:30:00Z')).toBe(0);
  });

  test('getISTDay: 2024-01-06T18:30:00Z → day 0 (Sunday in IST)', () => {
    // 18:30 UTC on Saturday = 00:00 IST on Sunday
    expect(getISTDay('2024-01-06T18:30:00Z')).toBe(0);
  });

  test('getISTHour: 2024-01-06T16:30:00Z → hour 22 (IST late-night)', () => {
    expect(getISTHour('2024-01-06T16:30:00Z')).toBe(22);
  });
});
