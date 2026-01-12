import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import RiskMeter from "../components/RiskMeter";
import ThemeToggle from "../components/ThemeToggle";
import { useAppData } from "../context/AppDataContext";

function Dashboard() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // 🔑 GLOBAL APP DATA
  const {
    user,
    data,
    loading,
    error,
    loadAppData,
  } = useAppData();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    // 🔑 Load ONCE for whole app
    loadAppData(navigate);
  }, []);

  if (loading || !data || !user) {
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
      <div className="min-h-screen flex items-center justify-center
                      bg-gray-50 dark:bg-black
                      text-gray-900 dark:text-gray-100">
        {error}
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
          <h1
            onClick={() => navigate("/dashboard")}
            className="cursor-pointer text-xl font-bold"
          >
            SilentDrop · {user?.githubUsername}
          </h1>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/patterns" className="text-sm hover:underline">
              Patterns
            </NavLink>
            <NavLink to="/trends" className="text-sm hover:underline">
              Trends
            </NavLink>
            <NavLink to="/reflection" className="text-sm hover:underline">
              Reflection
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
            <NavLink to="/dashboard" className="block text-sm">Dashboard</NavLink>
            <NavLink to="/patterns" className="block text-sm">Patterns</NavLink>
            <NavLink to="/trends" className="block text-sm">Trends</NavLink>
            <NavLink to="/reflection" className="block text-sm">Reflection</NavLink>

            <ThemeToggle />

            <button
              onClick={() => {
                localStorage.removeItem("token");
                window.location.replace("/");
              }}
              className="block text-sm text-red-500"
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-10 fade-in">
        <h2 className="text-2xl font-semibold mb-2">
          Your Work Rhythm Today
        </h2>

        <p className="text-sm text-gray-500 mb-8">
          A gentle snapshot of how your coding day looked.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Risk Meter */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-8
                          flex flex-col items-center justify-center text-center">
            <RiskMeter value={data?.burnoutRisk} />

            <p className="mt-4 text-sm text-gray-500 max-w-md opacity-0 animate-fadeIn">
              Sustained late-night and weekend work often correlates with reduced
              recovery and cognitive fatigue.
            </p>
          </div>

          {/* Insight */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-8">
            <h3 className="text-lg font-semibold mb-3">
              Today's Insight
            </h3>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {getInsight(data?.burnoutRisk)}
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Total Commits</p>
                <p className="text-2xl font-bold">{data.todaysCommits}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-2xl font-bold">
                  {data?.burnoutRisk < 40
                    ? "Healthy Rhythm"
                    : data?.burnoutRisk < 70
                    ? "Pushing Hard"
                    : "High Strain"}
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
