import { useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import { NavLink } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";

/* helpers unchanged */
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
  const { data, loading } = useAppData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        Loading patterns…
      </div>
    );
  }

  const pattern = data.pattern || {
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

          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/patterns" className="font-medium underline">
              Work Patterns
            </NavLink>
            <NavLink to="/trends">Work Trends</NavLink>
            <NavLink to="/reflection">Reflection</NavLink>
            <ThemeToggle />
          </div>

          <button className="md:hidden text-2xl" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-20 fade-in">
        <h2 className="text-2xl font-semibold mb-10">Work Patterns</h2>

        <div className="space-y-6">
          <PatternInsight
            title="Late-night work"
            text={
              pattern.lateNightPercentage < 20
                ? "Most of your work happens during the day."
                : pattern.lateNightPercentage < 50
                ? "Some of your work happens late at night."
                : "Late-night work appears frequently."
            }
          />

          <PatternInsight
            title="Weekend activity"
            text={
              pattern.weekendPercentage < 20
                ? "Your weekends appear mostly free."
                : pattern.weekendPercentage < 50
                ? "Some work spills into weekends."
                : "Weekends are often part of work."
            }
          />

          <PatternInsight
            title="Most active time"
            text={
              pattern.mostActiveHour !== null
                ? `You are most active around ${formatHour(pattern.mostActiveHour)}.`
                : "Not enough data yet."
            }
            footer={
              pattern.basedOnDays
                ? `Based on ${pattern.basedOnDays} days · ${pattern.confidence} confidence`
                : null
            }
          />

          {showHeatmap && (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow">
              <h3 className="font-semibold mb-3">Hourly activity</h3>

              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                {pattern.hourHistogram.map((count, hour) => {
                  const max = Math.max(...pattern.hourHistogram);
                  return (
                    <div
                      key={hour}
                      className={`h-8 rounded ${getHeatColor(count, max)} flex items-center justify-center text-xs`}
                    >
                      {hour.toString().padStart(2, "0")}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PatternInsight({ title, text, footer }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{text}</p>
      {footer && <p className="text-xs text-gray-400 mt-2">{footer}</p>}
    </div>
  );
}

export default Patterns;
