import { useEffect, useState } from "react";
import api from "../api";
import RiskMeter from "../components/RiskMeter";
import ThemeToggle from "../components/ThemeToggle";
import {Link} from "react-router-dom";
function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

 useEffect(() => {
  const loadDashboard = async () => {
    try {
      const userRes = await api.get("/api/auth/me");
      setUser(userRes.data);

      const analysisRes = await api.get("/api/analysis");
      setData(analysisRes.data);
    } catch (err) {
      setError("Session expired. Please login again.");
    } finally {
      setLoading(false);
    }
  };

  loadDashboard();
}, []);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center
                      bg-gray-50 dark:bg-black
                      text-gray-900 dark:text-gray-100">
        Loading...
      </div>
    );
  }
  if (error) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      Session expired. Please log in again.
    </div>
  );
}




  const getInsight = (risk) => {
    if (risk < 40) return "Your work rhythm looks healthy.";
    if (risk < 70) return "You've been pushing hard lately. Try slowing down.";
    return "High burnout risk detected. Prioritize rest and recovery.";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black
                    text-gray-900 dark:text-gray-100">

      {/* Navbar */}
      <div className="bg-white dark:bg-gray-900 shadow-sm px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">
            SilentDrop{user ? ` · ${user.username}` : ""}
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
                    border-t border-gray-200 dark:border-gray-700 pt- transition-all duration-300
">
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


      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-10 fade-in">
        <h2 className="text-2xl font-semibold mb-8">
          Dashboard
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Risk Meter */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-8
                          flex items-center justify-center
                          transition-all duration-300 hover:scale-[1.02]">
            <RiskMeter value={data.burnoutRisk} />
          </div>

          {/* Insight */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-8
                          flex flex-col justify-center
                          transition-all duration-300 hover:scale-[1.02]">
            <h3 className="text-lg font-semibold mb-3">
              Today’s Insight
            </h3>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {getInsight(data.burnoutRisk)}
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Commits
                </p>
                <p className="text-2xl font-bold">
                  {data.totalCommits}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Status
                </p>
                <p className="text-2xl font-bold">
                  {data.burnoutRisk < 40
                    ? "🟢 Healthy"
                    : data.burnoutRisk < 70
                      ? "🟡 At Risk"
                      : "🔴 Burnout Likely"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-400">
          More insights coming soon…
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

