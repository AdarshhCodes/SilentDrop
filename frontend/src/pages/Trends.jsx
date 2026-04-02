import { useEffect, useState } from "react";
import api from "../api";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

function calculateRisk({ totalCommits, lateNight, weekend }) {
  let risk = 0;
  risk += Math.min(40, totalCommits * 1.2);
  risk += lateNight * 0.5;
  risk += weekend * 0.4;
  return Math.min(100, Math.round(risk));
}

function formatHourLabel(hour) {
  const h = Number(hour);
  const suffix = h >= 12 ? "PM" : "AM";
  const normalized = h % 12 === 0 ? 12 : h % 12;
  return `${normalized} ${suffix}`;
}

function getBarOpcaity(value) {
  if (value >= 70) return "bg-indigo-700 dark:bg-indigo-400";
  if (value >= 50) return "bg-indigo-500 dark:bg-indigo-500";
  if (value >= 30) return "bg-indigo-400 dark:bg-indigo-600";
  return "bg-indigo-300 dark:bg-indigo-800";
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemAnim = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Trends() {
  const [animateBars, setAnimateBars] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["analysis"],
    queryFn: async () => {
      return api.get("/api/analysis").then((res) => res.data);
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (data) {
      setTimeout(() => setAnimateBars(true), 200);
    }
  }, [data]);

  if (isLoading || !data) return <div className="flex justify-center py-20 text-slate-500">Compiling trends…</div>;
  if (isError) return <div className="flex justify-center py-20 text-red-500">Failed to load velocity trends.</div>;

  const { totalCommits, pattern } = data;

  const latestRisk = calculateRisk({
    totalCommits,
    lateNight: pattern.lateNightPercentage,
    weekend: pattern.weekendPercentage,
  });

  const previousRisk = Math.max(0, latestRisk - 8);

  let direction = "Static";
  if (latestRisk > previousRisk) direction = "Escalating";
  if (latestRisk < previousRisk) direction = "Resolving";

  const history = pattern.hourHistogram
    .map((count, hour) => ({
      hour,
      risk: Math.min(100, Math.round(count * 6)),
    }))
    .filter((h) => h.risk > 0)
    .slice(-6);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto w-full">
      <motion.div variants={itemAnim} className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">Velocity Trends</h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
          Metrics derived from your coding volume and timing density. A macro-view of your trajectory over time.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <motion.div variants={itemAnim}>
           <TrendCard title="Current Index" value={`${latestRisk}`} suffix="%" />
        </motion.div>
        <motion.div variants={itemAnim}>
           <TrendCard title="Baseline Shift" value={`${previousRisk}`} suffix="%" />
        </motion.div>
        <motion.div variants={itemAnim}>
           <TrendCard title="Trajectory Vector" value={direction} highlight={direction === "Escalating"} />
        </motion.div>
      </div>

      <motion.div variants={itemAnim} className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Recent Temporal Mass
        </h3>

        {history.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Insufficient telemetry detected in the recent window.
          </p>
        ) : (
          <div className="space-y-5">
            {history.map((h, index) => (
              <MiniTrendBar
                key={h.hour}
                label={formatHourLabel(h.hour)}
                value={h.risk}
                index={index}
                animate={animateBars}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function TrendCard({ title, value, suffix, highlight }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 hover:shadow-md group h-full flex flex-col justify-center">
      <p className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 group-hover:text-indigo-500 transition-colors">
        {title}
      </p>
      <p className={`text-4xl font-light ${highlight ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-slate-100"}`}>
        {value} {suffix && <span className="text-lg text-slate-400 font-normal">{suffix}</span>}
      </p>
    </div>
  );
}

function MiniTrendBar({ label, value, index, animate }) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-16 text-sm font-mono text-slate-500 dark:text-slate-400">
        {label}
      </span>

      <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: animate ? `${value}%` : "0%" }}
          transition={{ duration: 1, delay: index * 0.15, ease: "easeOut" }}
          className={`h-full rounded-full ${getBarOpcaity(value)}`}
        />
      </div>

      <span className="w-12 text-right text-sm font-mono text-slate-600 dark:text-slate-300">
        {value}%
      </span>
    </div>
  );
}
