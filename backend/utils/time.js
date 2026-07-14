const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/**
  Convert a UTC date string to the target timezone's hour (0–23)
 */
function getHourInTimezone(utcDateString, timezone = "UTC") {
  const date = new Date(utcDateString);
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    });
    const parts = formatter.formatToParts(date);
    const hourPart = parts.find(p => p.type === "hour");
    let hour = Number(hourPart.value);
    if (hour === 24) hour = 0;
    return hour;
  } catch (err) {
    return date.getUTCHours();
  }
}

/**
  Convert a UTC date string to the target timezone's day (0-6, 0=Sunday)
 */
function getDayInTimezone(utcDateString, timezone = "UTC") {
  const date = new Date(utcDateString);
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: timezone,
    });
    const parts = formatter.formatToParts(date);
    const dayPart = parts.find(p => p.type === "weekday");
    const dayName = dayPart.value;
    return days[dayName] !== undefined ? days[dayName] : date.getUTCDay();
  } catch (err) {
    return date.getUTCDay();
  }
}

/**
  Convert a UTC date string to IST hour (0–23)
  GitHub timestamps UTC me hote hai isiliye
 */
function getISTHour(utcDateString) {
  return getHourInTimezone(utcDateString, "Asia/Kolkata");
}

/**
  Convert a UTC date string to IST day (0–6)
  0 = Sunday, 6 = Saturday
 */
function getISTDay(utcDateString) {
  return getDayInTimezone(utcDateString, "Asia/Kolkata");
}

module.exports = {
  getHourInTimezone,
  getDayInTimezone,
  getISTHour,
  getISTDay,
};
