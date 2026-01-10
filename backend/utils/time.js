/**
  Convert a UTC date string to IST hour (0–23)
  GitHub timestamps UTC me hote hai isiliye
 */
function getISTHour(utcDateString) {
  const utcDate = new Date(utcDateString);

  // IST = UTC + 5 hours 30 minutes
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

  const istDate = new Date(utcDate.getTime() + IST_OFFSET_MS);

  return istDate.getHours(); // 0–23
}

/**
  Convert a UTC date string to IST day (0–6)
  0 = Sunday, 6 = Saturday
 */
function getISTDay(utcDateString) {
  const utcDate = new Date(utcDateString);
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(utcDate.getTime() + IST_OFFSET_MS);

  return istDate.getDay();
}

module.exports = {
  getISTHour,
  getISTDay,
};
