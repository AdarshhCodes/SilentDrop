import { useEffect, useState } from "react";
import api from "../api";
import RiskMeter from "../components/RiskMeter";
import ThemeToggle from "../components/ThemeToggle";
import { NavLink, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const userRes = await api.get("/api/auth/me");
      const dashboardRes = await api.get("/api/dashboard");

      return {
        user: userRes.data.user,
        dashboard: dashboardRes.data,
      };
    },
    staleTime: 1000 * 60 * 5,
    retry: false, //stop infinite 401 retries
  });

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ["analysis"],
      queryFn: () =>
        api.get("/api/analysis").then((res) => res.data),
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
        Loading...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black text-red-500">
        {error?.message || "Failed to load dashboard"}
      </div>
    );
  }

  const { user, dashboard } = data;

  const getInsight = (risk) => {
    if (risk < 40) return "Your work rhythm looks healthy.";
    if (risk < 70) return "You've been pushing hard lately. Try slowing down.";
    return "High burnout risk detected. Prioritize rest and recovery.";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
      {/* Navbar */}
      <div className="bg-white dark:bg-gray-900 shadow-sm px-6 py-4">
        <div className="flex justify-between items-center">
          <h1
            onClick={() => navigate("/dashboard")}
            className="cursor-pointer text-xl font-bold"
          >
            SilentDrop · {user.githubUsername}
          </h1>

          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/patterns">Patterns</NavLink>
            <NavLink to="/trends">Trends</NavLink>
            <NavLink to="/reflection">Reflection</NavLink>
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

          <button
            className="md:hidden text-2xl"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden mt-4 space-y-4 border-t pt-4">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/patterns">Patterns</NavLink>
            <NavLink to="/trends">Trends</NavLink>
            <NavLink to="/reflection">Reflection</NavLink>
            <ThemeToggle />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-10 fade-in">
        <h2 className="text-2xl font-semibold mb-2">
          Your Work Rhythm Today
        </h2>

        <p className="text-sm text-gray-500 mb-8">
          A gental snapshot of how your coding day looked.

        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-8 text-center">
            <RiskMeter value={dashboard.burnoutRisk} />
            <p className="mt-4 text-sm text-gray-500">
              Sustained late-night and weekend work correlates with fatigue.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-8">
            <h3 className="text-lg font-semibold mb-3">
              Today's Insight
            </h3>
            <p className="mb-6">
              {getInsight(dashboard.burnoutRisk)}
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Total Commits</p>
                <p className="text-2xl font-bold">
                  {dashboard.todaysCommits}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-2xl font-bold">
                  {dashboard.burnoutRisk < 40
                    ? "Healthy Rhythm"
                    : dashboard.burnoutRisk < 70
                    ? "Pushing Hard"
                    : "High Strain"}
                </p>
              </div>
            </div>
          </div>
        </div>
<div className="text-center text-sm text-gray-400 mt-7"> More insights coming soon… </div>

      </div>
    </div>
  );
}

export default Dashboard;
