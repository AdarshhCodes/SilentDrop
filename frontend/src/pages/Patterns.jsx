import { useEffect, useState } from "react";
import api from "../api";
import ThemeToggle from "../components/ThemeToggle";
import { NavLink } from "react-router-dom";



function formatHour(hour) {
  if (hour === null || hour === undefined) return "—";
  return `${hour.toString().padStart(2, "0")}:00`;
}
function getHeatColor(count, max) {
  if (max === 0) return "bg-gray-200 dark:bg-gray-800";

  const intensity = count / max;

  if (intensity > 0.75) return "bg-red-500";
  if (intensity > 0.5) return "bg-orange-400";
  if (intensity > 0.25) return "bg-yellow-300";
  if (intensity > 0) return "bg-green-300";

  return "bg-gray-200 dark:bg-gray-800";
}


function Patterns() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

 useEffect(() => {
  api
    .get("/api/analysis")
    .then((res) => {
      setData(res.data);
      setTimeout(() => setShowHeatmap(true), 100); // subtle delay
    })
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

  const pattern = data?.pattern || {
    mostActiveHour: null,
    lateNightPercentage: 0,
    weekendPercentage: 0,
    basedOnDays: 0,
    confidence: "Low",
    hourHistogram: Array(24).fill(0),
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
              pattern.lateNightPercentage < 20
                ? "Most of your work happens during the day, which supports natural recovery."
                : pattern.lateNightPercentage < 50
                ? "A noticeable part of your work happens late at night."
                : "Late-night work appears frequently in your recent activity."
            }
          />

          {/* Weekend */}
          <PatternInsight
            title="Weekend activity"
            text={
              pattern.weekendPercentage < 20
                ? "Your weekends appear mostly free from work."
                : pattern.weekendPercentage < 50
                ? "Some of your work spills into weekends."
                : "Weekends are often part of your working time."
            }
          />

          {/* Peak hour */}
          <PatternInsight
            title="Most active time"
            text={
               patter.mostActiveHour !== null

                ? `You tend to be most active around ${formatHour(pattern.mostActiveHour)}.`
                : "There isn’t enough data yet to find a consistent active time."
            }
            footer={
              pattern.basedOnDays
                ? `Based on last ${pattern.basedOnDays} days · ${pattern.confidence} confidence`
                : null
            }
          />
          {/* Hour heatmap */}
{Array.isArray(pattern.hourHistogram) && showHeatmap && (
  <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow">
    <h3 className="font-semibold mb-3">Hourly activity</h3>

    <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
      {pattern.hourHistogram.map((count, hour) => {
        const max = Math.max(...pattern.hourHistogram);

        return (
          <div
            key={hour}
            className={`h-8 rounded ${getHeatColor(count, max)} flex items-center justify-center text-xs text-gray-900`}
          >
            {hour.toString().padStart(2, "0")}
          </div>
        );
      })}
    </div>

    <p className="text-xs text-gray-400 mt-3">
      Darker blocks indicate higher activity
    </p>
  </div>
)}

        </div>

        <p className="text-xs text-gray-400 text-center mt-14 max-w-xl mx-auto">
          Patterns don’t mean something is wrong.
          They simply reflect what’s been happening lately.
        </p>
      </div>
    </div>
  );
}

function PatternInsight({ title, text, footer }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{text}</p>
      {footer && (
        <p className="text-xs text-gray-400 mt-2">{footer}</p>
      )}
    </div>
  );
}

export default Patterns;
