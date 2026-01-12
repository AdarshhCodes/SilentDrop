import { useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import { NavLink } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";

function calculateRisk({ totalCommits, lateNight, weekend }) {
  let risk = 0;
  risk += Math.min(40, totalCommits * 1.2);
  risk += lateNight * 0.5;
  risk += weekend * 0.4;
  return Math.min(100, Math.round(risk));
}

function Trends() {
  const { data, loading } = useAppData();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        Loading trends…
      </div>
    );
  }

  const { todaysCommits, pattern } = data;

  const latestRisk = calculateRisk({
    totalCommits: todaysCommits,
    lateNight: pattern.lateNightPercentage,
    weekend: pattern.weekendPercentage,
  });

  const previousRisk = Math.max(0, latestRisk - 8);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-100">
      <div className="bg-gray-900 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">SilentDrop</h1>
        <div className="hidden md:flex gap-6 items-center">
          <NavLink to="/patterns">Patterns</NavLink>
          <NavLink to="/trends" className="font-semibold">Trends</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-semibold mb-8">Burnout Trends</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <TrendCard title="Latest Risk" value={`${latestRisk}%`} />
          <TrendCard title="Previous Risk" value={`${previousRisk}%`} />
          <TrendCard title="Direction" value={latestRisk > previousRisk ? "Worsening" : "Stable"} />
        </div>
      </div>
    </div>
  );
}

function TrendCard({ title, value }) {
  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}

export default Trends;
