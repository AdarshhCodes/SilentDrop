import { useEffect } from "react";
import api from "../api";
import RiskMeter from "../components/RiskMeter";
import DailyReflectionCard from "../components/DailyReflectionCard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const userRes = await api.get("/api/auth/me");
      const dashboardRes = await api.get("/api/dashboard");
      return { user: userRes.data.user, dashboard: dashboardRes.data };
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ["analysis"],
      queryFn: () => api.get("/api/analysis").then((res) => res.data),
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient]);

  if (isLoading) return <div className="flex justify-center py-20 text-slate-500">Loading your space...</div>;
  if (isError) return <div className="flex justify-center py-20 text-red-500">{error?.message || "Failed to load"}</div>;

  const { user, dashboard } = data;

  const getInsight = (risk) => {
    if (risk < 40) return "Your rhythm is steady. Protected focus time is paying off.";
    if (risk < 70) return "Elevated strain detected. Consider stepping away soon.";
    return "High burnout risk. Rest is required for sustainable output.";
  };

  // Mocked deep work calculation (this would ideally come from backend logic)
  const deepWorkHours = Math.max(0, Math.round(dashboard.todaysCommits * 0.4)); // Roughly 40% of commits represent deep work hours

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="w-full">
      <motion.div variants={item} className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Welcome back, {user.username || user.githubUsername}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
          Here is a gentle snapshot of your work rhythm today.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Risk & Insight */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <motion.div variants={item} className="group bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Strain Analysis
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1 w-full">
                <RiskMeter value={dashboard.burnoutRisk} />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-3 leading-snug">
                  {getInsight(dashboard.burnoutRisk)}
                </p>
                <div className="w-12 h-1 bg-indigo-500/20 rounded-full my-4"></div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Calculated using weekend activity density and late-night context boundaries.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-500/20">
                <p className="text-indigo-600 dark:text-indigo-400 text-sm font-medium uppercase tracking-wider mb-1">Focus Metric</p>
                <p className="text-4xl font-light text-indigo-900 dark:text-indigo-100">
                  ~{deepWorkHours} <span className="text-lg text-indigo-500 dark:text-indigo-400">hrs</span>
                </p>
                <p className="text-sm text-indigo-700/70 dark:text-indigo-300/70 mt-2">Estimated deep work flow</p>
             </div>
             <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Activity Volume</p>
                <p className="text-4xl font-light text-slate-900 dark:text-slate-100">
                  {dashboard.todaysCommits} <span className="text-lg text-slate-400">commits</span>
                </p>
                <p className="text-sm text-slate-500 mt-2">Logged today</p>
             </div>
          </motion.div>
        </div>

        {/* Right Column: Reflection */}
        <motion.div variants={item} className="h-full">
          <DailyReflectionCard />
        </motion.div>
      </div>
    </motion.div>
  );
}
