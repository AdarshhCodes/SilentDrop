import { useEffect, useState } from "react";
import api from "../api";
import ThemeToggle from "../components/ThemeToggle";
import { NavLink } from "react-router-dom";

function Patterns() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api
      .get("/api/analysis")
      .then((res) => setData(res.data))
      .catch((err) => console.error("Patterns error", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        Loading patterns…
      </div>
    );
  }

  // safe fallback
  const patterns = data.pattern || {
    lateNightPercentage: 0,
    weekendPercentage: 0,
    peakHour: null,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
      {/* Navbar */}
      <div className="bg-white dark:bg-gray-900 shadow-sm px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">SilentDrop</h1>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/dashboard" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
              Dashboard
            </NavLink>
            <NavLink to="/patterns" className="text-sm font-medium underline">
              Work Patterns
            </NavLink>
            <NavLink to="/trends" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
              Work Trends
            </NavLink>
            <NavLink to="/reflection" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
              Reflection
            </NavLink>

            <ThemeToggle />

            <button
              onClick={() => {
                localStorage.clear();
                window.location.replace("/");
              }}
              className="text-sm text-red-500 hover:underline"
            >
              Sign out
            </button>
          </div>

          {/* Mobile Menu */}
          <button className="md:hidden text-2xl" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden mt-4 space-y-4 border-t pt-4">
            <NavLink to="/dashboard" className="block text-sm">Dashboard</NavLink>
            <NavLink to="/patterns" className="block text-sm font-medium">Work Patterns</NavLink>
            <NavLink to="/trends" className="block text-sm">Work Trends</NavLink>
            <NavLink to="/reflection" className="block text-sm">Reflection</NavLink>

            <ThemeToggle />

            <button
              onClick={() => {
                localStorage.clear();
                window.location.replace("/");
              }}
              className="block text-sm text-red-500"
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-20 fade-in">
        <h2 className="text-2xl font-semibold mb-2">Work Patterns</h2>

        <p className="text-sm text-gray-500 mb-10">
          This page looks at <em>when</em> you usually work — not how much.
          Patterns can gently reveal strain before it becomes obvious.
        </p>

        <div className="space-y-6">
          {/* Late night */}
          <PatternInsight
            title="Late-night work"
            text={
              patterns.lateNightPercentage < 20
                ? "Most of your work happens during the day, which supports natural recovery."
                : patterns.lateNightPercentage < 50
                ? "A noticeable part of your work happens late at night."
                : "Late-night work appears frequently in your recent activity."
            }
          />

          {/* Weekend */}
          <PatternInsight
            title="Weekend activity"
            text={
              patterns.weekendPercentage < 20
                ? "Your weekends appear mostly free from work."
                : patterns.weekendPercentage < 50
                ? "Some of your work spills into weekends."
                : "Weekends are often part of your working time."
            }
          />

          {/* Peak hour */}
          <PatternInsight
            title="Most active time"
            text={
              patterns.peakHour !== null
                ? `You tend to be most active around ${patterns.peakHour}:00.`
                : "There isn’t enough data yet to find a consistent active time."
            }
          />
        </div>

        <p className="text-xs text-gray-400 text-center mt-14 max-w-xl mx-auto">
          Patterns don’t mean something is wrong.
          They simply reflect what’s been happening lately.
        </p>
      </div>
    </div>
  );
}

function PatternInsight({ title, text }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}

export default Patterns;

