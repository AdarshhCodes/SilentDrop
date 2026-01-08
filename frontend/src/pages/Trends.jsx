import { useEffect, useState } from "react";
import api from "../api";
import ThemeToggle from "../components/ThemeToggle";
import {Link} from "react-router-dom";
function Trends() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api
      .get("/trends", { withCredentials: true })
      .then((res) => {
        setData(res.data.trend);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center
                      bg-gray-50 dark:bg-black
                      text-gray-900 dark:text-gray-100">
        Loading trends...
      </div>
    );
  }

  const latest = data[data.length - 1]?.risk || 0;
  const previous = data[data.length - 2]?.risk || latest;

  let direction = "Stable";
  if (latest > previous) direction = "Worsening";
  if (latest < previous) direction = "Improving";

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
      <Link to="/patterns"
         className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
        Patterns
      </Link>

      <Link to="/trends"
         className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
        Trends
      </Link>

      <Link to="/reflection"
         className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
        Reflection
      </Link>

      <ThemeToggle />
      <button
        onClick={() => {
          api.get("/api/auth/logout", { withCredentials: true }).then(() => {
            localStorage.clear();
            window.location.replace("/");
          });
        }}
        className="text-sm text-red-500 hover:underline"
      >
        Logout
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
        <Link to="/patterns" className="block text-sm">Patterns</Link>
           <Link to="/trends" className="block text-sm">Trends</Link>
           <Link to="/reflection" className="block text-sm">Reflection</Link>

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
        Logout
      </button>
    </div>
  )}
</div>


      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-10 fade-in">
        <h2 className="text-2xl font-semibold mb-8">
          Burnout Trends
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <TrendCard title="Latest Risk" value={`${latest}%`} />
          <TrendCard title="Previous Risk" value={`${previous}%`} />
          <TrendCard
            title="Direction"
            value={
              direction === "Improving"
                ? "🟢 Improving"
                : direction === "Worsening"
                ? "🔴 Worsening"
                : "🟡 Stable"
            }
          />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6">
          <h3 className="font-semibold mb-4">
            Recent History
          </h3>

          <ul className="space-y-3 text-sm">
            {data.map((item) => (
              <li
                key={item.date}
                className="flex justify-between border-b
                           border-gray-200 dark:border-gray-700 pb-2"
              >
                <span>{item.date}</span>
                <span className="font-medium">
                  {item.risk}%
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Trends are derived from recent coding behavior and activity timing.
        </p>
      </div>
    </div>
  );
}

function TrendCard({ title, value }) {
  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-xl shadow p-6
                 transition-all duration-300 hover:scale-[1.02]"
    >
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {title}
      </p>
      <p className="text-2xl font-bold mt-2">
        {value}
      </p>
    </div>
  );
}

export default Trends;
