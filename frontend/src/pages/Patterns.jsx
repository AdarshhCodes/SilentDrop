import { useEffect, useState } from "react";
import api from "../api";
import ThemeToggle from "../components/ThemeToggle";
import {NavLink} from "react-router-dom";

function Patterns() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api.get("/api/analysis", { withCredentials: true }).then((res) => {
      setData(res.data);
    })
    .catch((err) => {
    console.error("Patterns error", err);
  })
  .finally(() => {
    setLoading(false);
  });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center
                      bg-gray-50 dark:bg-black
                      text-gray-900 dark:text-gray-100">
        Loading patterns...
      </div>
    );
  }

  // ✅ correct key + safe fallback
  const patterns = data.patterns || {
    lateNightPercentage: 0,
    weekendPercentage: 0,
    peakHour: "—",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black
                    text-gray-900 dark:text-gray-100">
   {/* Navbar */}
<div className="bg-white dark:bg-gray-900 shadow-sm px-6 py-4">
  <div className="flex justify-between items-center">
    <h1 className="text-xl font-bold">
      SilentDrop
    </h1>

    {/* Desktop Nav */}
    <div className="hidden md:flex items-center gap-6">
      <NavLink to="/patterns"
         className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
        Patterns
      </NavLink>

      <NavLink to="/trends"
         className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
        Trends
      </NavLink>

      <NavLink to="/reflection"
         className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
        Reflection
      </NavLink>
      <NavLink
  to="/dashboard"
  className="text-sm text-gray-600 dark:text-gray-300 hover:underline"
>
  Dashboard
</NavLink>


      <ThemeToggle />

    
      <button
              onClick={() => {
                localStorage.removeItem("token");
                window.location.replace("/");
              }}

              className="text-sm text-red-500 hover:underline"
            >
              Sign out
            </button>
    </div>

    {/* Mobile Menu Button */}
    <button
      className="md:hidden text-2xl"
      onClick={() => setMenuOpen(!menuOpen)}
    >
      ☰
    </button>
  </div>

  {/* Mobile Menu */}
  {menuOpen && (
    <div className="md:hidden mt-4 space-y-4
                    border-t border-gray-200 dark:border-gray-700 pt-4">
      <NavLink to="/patterns" className="block text-sm">Patterns</NavLink>
      <NavLink to="/trends" className="block text-sm">Trends</NavLink>
      <NavLink to="/reflection" className="block text-sm">Reflection</NavLink>
      <NavLink to="/dashboard" className="block text-sm">
  Dashboard
</NavLink>


      <div className="pt-2">
        <ThemeToggle />
      </div>

      <button
        onClick={() => {
          api.get("/api/auth/logout", { withCredentials: true }).then(() => {
            localStorage.clear();
            window.location.replace("/");
          });
        }}
        className="block text-sm text-red-500"
      >
        Sign out
      </button>
    </div>
  )}
</div>


      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-10 fade-in">
        <h2 className="text-2xl font-semibold mb-8">
          Work Patterns
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <PatternCard
            title="Late-Night Coding"
            value={`${patterns.lateNightPercentage}%`}
            desc="Commits made between 11 PM – 4 AM"
          />

          <PatternCard
            title="Weekend Activity"
            value={`${patterns.weekendPercentage}%`}
            desc="Commits made on Saturdays & Sundays"
          />

          <PatternCard
            title="Peak Coding Hour"
            value={
              patterns.peakHour !== null && patterns.peakHour !== "—"
                ? `${patterns.peakHour}:00`
                : "Not enough data"
            }

            desc="Most frequent commit hour"
          />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 mt-10">
          <h3 className="font-semibold mb-2">
            Insight
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            These patterns help SilentDrop understand your work rhythm.
            Repeated late-night or weekend coding may increase burnout risk.
          </p>
        </div>
      </div>
    </div>
  );
}

function PatternCard({ title, value, desc }) {
  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-xl shadow p-6
                 transition-all duration-300 hover:scale-[1.02]"
    >
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {title}
      </p>
      <p className="text-3xl font-bold my-2">
        {value}
      </p>
      <p className="text-xs text-gray-400">
        {desc}
      </p>
    </div>
  );
}

export default Patterns;
