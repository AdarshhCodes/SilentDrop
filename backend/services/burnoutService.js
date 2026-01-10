const calculateBurnoutScore = (commitsByDate) => {
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
// 🔹 Daily burnout (used for dashboard & trends)
const calculateTodayBurnout = (totalCommits) => {
   if (totalCommits === 0) return 0;

  // Very light work
  if (totalCommits <= 4) return 10;
  if (totoalCommits <= 7) return 18;

  // Normal productive day
  if (totalCommits <= 10) return 25;
  if (totalCommits <= 14) return 32;
  if (totalCommits <= 17) return 40;

  // Heavy focus
  if (totalCommits <= 20) return 48;
  if (totalCommits <= 22) return 56;
  if (totalCommits <= 25) return 64;

  // Intense workload
  if (totalCommits <= 28) return 72;
  if (totalCommits <= 34) return 80;

  // Very high strain
  if (totalCommits <= 40) return 88;
  if (totalCommits <= 50) return 94;

  // Extreme / unhealthy
  return 100;
};

module.exports = { calculateBurnoutScore, calculateTodayBurnout};
