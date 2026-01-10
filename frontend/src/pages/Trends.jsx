import { useEffect, useState } from "react";
import api from "../api";
import ThemeToggle from "../components/ThemeToggle";
import { NavLink } from "react-router-dom";

/* ------------------ helpers ------------------ */

function calculateRisk({ totalCommits, lateNight, weekend }) {
  let risk = 0;
  risk += Math.min(40, totalCommits * 1.2);
  risk += lateNight * 0.5;
  risk += weekend * 0.4;
  return Math.min(100, Math.round(risk));
}

function formatHourLabel(hour) {
  const h = Number(hour);
  const suffix = h >= 12 ? "PM" : "AM";
  const normalized = h % 12 === 0 ? 12 : h % 12;
  return `${normalized} ${suffix}`;
}

function getBarColor(value) {
  if (value >= 70) return "bg-red-500";
  if (value >= 50) return "bg-orange-400";
  if (value >= 30) return "bg-yellow-400";
  return "bg-green-400";
}

/* ------------------ UI components ------------------ */

function TrendCard({ title, value }) {
  return (
    <div className="bg-gray-900 rounded-xl p-6 transition-all duration-300 hover:scale-[1.02]">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}

function MiniTrendBar({ label, value, index, animate }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 text-xs text-gray-400">{label}</span>

      <div className="flex-1 h-2 bg-gray-800 rounded overflow-hidden">
        <div
          className={`h-full ${getBarColor(value)}
                      transition-all duration-700 ease-out`}
          style={{
            width: animate ? `${value}%` : "0%",
            transitionDelay: `${index * 90}ms`,
          }}
        />
      </div>

      <span className="w-10 text-right text-xs text-gray-300">
        {value}%
      </span>
    </div>
  );
}

/* ------------------ page ------------------ */

function Trends() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    api.get("/api/analysis")
      .then((res) => {
        setAnalysis(res.data);
        requestAnimationFrame(() => setAnimateBars(true));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        Loading trends…
      </div>
    );
  }

  const { totalCommits, pattern } = analysis;

  const latestRisk = calculateRisk({
    totalCommits,
    lateNight: pattern.lateNightPercentage,
    weekend: pattern.weekendPercentage,
  });

  const previousRisk = Math.max(0, latestRisk - 8);

  let direction = "Stable";
  if (latestRisk > previousRisk) direction = "Worsening";
  if (latestRisk < previousRisk) direction = "Improving";

  const history = pattern.hourHistogram
    .map((count, hour) => ({
      hour,
      risk: Math.min(100, Math.round(count * 6)),
    }))
    .filter((h) => h.risk > 0)
    .slice(-6);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-100">
      {/* Navbar */}
      <div className="bg-gray-900 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">SilentDrop</h1>

        <div className="hidden md:flex gap-6 items-center">
          <NavLink to="/patterns">Patterns</NavLink>
          <NavLink to="/trends" className="font-semibold">Trends</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <ThemeToggle />
        </div>

        <button
          className="md:hidden text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-gray-900 px-6 py-4 space-y-3">
          <NavLink to="/patterns" className="block">Patterns</NavLink>
          <NavLink to="/trends" className="block">Trends</NavLink>
          <NavLink to="/dashboard" className="block">Dashboard</NavLink>
          <ThemeToggle />
        </div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-semibold mb-8">Burnout Trends</h2>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <TrendCard title="Latest Risk" value={`${latestRisk}%`} />
          <TrendCard title="Previous Risk" value={`${previousRisk}%`} />
          <TrendCard title="Direction" value={direction} />
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-900 rounded-xl p-6 md:p-8">
          <h3 className="font-semibold mb-4">Recent Activity Pattern</h3>

          {history.length === 0 ? (
            <p className="text-gray-400 text-sm">
              Not enough recent activity to show a trend.
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((h, index) => (
                <MiniTrendBar
                  key={h.hour}
                  label={formatHourLabel(h.hour)}
                  value={h.risk}
                  index={index}
                  animate={animateBars}
                />
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Trends are derived from your recent coding patterns and activity timing.
        </p>
      </div>
    </div>
  );
}

export default Trends;
