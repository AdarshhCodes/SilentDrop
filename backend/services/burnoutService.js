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

module.exports = { calculateBurnoutScore };
