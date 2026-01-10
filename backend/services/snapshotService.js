const DailySnapshot = require("../models/DailySnapshot");

// Convert UTC to IST date string YYYY-MM-DD
function todayIST() {
  const now = new Date();
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return ist.toISOString().split("T")[0];
}

async function upsertDailySnapshot({ userId, analysis }) {
  const date = todayIST();

  const doc = {
    userId,
    date,
    burnoutRisk: analysis.burnoutRisk,
    totalCommits: analysis.totalCommits,
    lateNightPercentage: analysis.pattern.lateNightPercentage,
    weekendPercentage: analysis.pattern.weekendPercentage,
    confidence: analysis.pattern.confidence,
  };

  await DailySnapshot.updateOne(
    { userId, date },
    { $set: doc },
    { upsert: true }
  );
}

module.exports = { upsertDailySnapshot };
