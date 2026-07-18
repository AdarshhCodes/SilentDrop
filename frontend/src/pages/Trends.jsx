import { useEffect, useState } from "react";
import api from "../api";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHourLabel(hour) {
  const h = Number(hour);
  const suffix = h >= 12 ? "PM" : "AM";
  const normalized = h % 12 === 0 ? 12 : h % 12;
  return `${normalized} ${suffix}`;
}

function formatDateLabel(dateStr) {
  // dateStr: 'YYYY-MM-DD'
  const [, month, day] = dateStr.split("-");
  return `${parseInt(month, 10)}/${parseInt(day, 10)}`;
}

function getBarColor(value) {
  if (value >= 70) return "bg-indigo-700 dark:bg-indigo-400";
  if (value >= 50) return "bg-indigo-500 dark:bg-indigo-500";
  if (value >= 30) return "bg-indigo-400 dark:bg-indigo-600";
  return "bg-indigo-300 dark:bg-indigo-800";
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemAnim = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

// ─────────────────────────────────────────────────────────────────────────────

export default function Trends() {
  const [animateBars, setAnimateBars] = useState(false);

  // Existing query — feeds the hourly distribution chart (unchanged)
  const { data: patternData, isLoading: patternLoading, isError: patternError } = useQuery({
    queryKey: ["analysis"],
    queryFn: () => api.get("/api/analysis").then((res) => res.data),
    staleTime: 1000 * 60 * 5,
  });

  // New query — real stored DailyMetric history
  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyError,
  } = useQuery({
    queryKey: ["analysis", "history"],
    queryFn: () => api.get("/api/analysis/history?days=30").then((res) => res.data),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (patternData) {
      setTimeout(() => setAnimateBars(true), 200);
    }
  }, [patternData]);

  const isLoading = patternLoading || historyLoading;
  if (isLoading) {
    return <div className="flex justify-center py-20 text-slate-500">Compiling trends…</div>;
  }
  if (patternError || historyError) {
    return <div className="flex justify-center py-20 text-red-500">Failed to load velocity trends.</div>;
  }

  // ─── History-derived metrics ────────────────────────────────────────────────
  const days = historyData?.days ?? [];
  const hasEnoughHistory = days.length >= 2;

  const latestRisk   = hasEnoughHistory ? days[days.length - 1].burnoutRisk : null;
  const previousRisk = hasEnoughHistory ? days[days.length - 2].burnoutRisk : null;

  let direction = "Static";
  if (latestRisk !== null && previousRisk !== null) {
    if (latestRisk > previousRisk) direction = "Escalating";
    if (latestRisk < previousRisk) direction = "Resolving";
  }

  const avgRisk = hasEnoughHistory
    ? Math.round(days.reduce((sum, d) => sum + d.burnoutRisk, 0) / days.length)
    : null;

  // ─── Hourly distribution (unchanged source) ─────────────────────────────────
  const { pattern } = patternData ?? { pattern: { hourHistogram: [] } };
  const hourHistory = (pattern?.hourHistogram ?? [])
    .map((count, hour) => ({ hour, risk: Math.min(100, Math.round(count * 6)) }))
    .filter((h) => h.risk > 0)
    .slice(-6);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto w-full">

      {/* Page header */}
      <motion.div variants={itemAnim} className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
          Velocity Trends
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
          Metrics derived from your coding volume and timing density. A macro-view of your trajectory over time.
        </p>
      </motion.div>

      {/* ── Summary cards — real history ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <motion.div variants={itemAnim}>
          <TrendCard
            title="Current Risk"
            value={latestRisk !== null ? `${latestRisk}` : "—"}
            suffix={latestRisk !== null ? "%" : undefined}
          />
        </motion.div>
        <motion.div variants={itemAnim}>
          <TrendCard
            title="7-day Average"
            value={avgRisk !== null ? `${avgRisk}` : "—"}
            suffix={avgRisk !== null ? "%" : undefined}
          />
        </motion.div>
        <motion.div variants={itemAnim}>
          <TrendCard
            title="Trajectory Vector"
            value={hasEnoughHistory ? direction : "—"}
            highlight={direction === "Escalating" && hasEnoughHistory}
          />
        </motion.div>
      </div>

      {/* ── Daily burnout risk trend (real DailyMetric history) ──────────────── */}
      <motion.div
        variants={itemAnim}
        className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm mb-8"
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          Daily Risk History
        </h3>

        {!hasEnoughHistory ? (
          /* Empty state — fewer than 2 days of stored DailyMetric records */
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <span className="text-3xl">🌱</span>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center max-w-xs">
              Your trend history is building — check back tomorrow.
            </p>
            <p className="text-slate-400 dark:text-slate-600 text-xs text-center max-w-xs">
              Daily snapshots are captured automatically each night.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {days.map((d, index) => (
              <MiniTrendBar
                key={d.date}
                label={formatDateLabel(d.date)}
                value={d.burnoutRisk}
                index={index}
                animate={animateBars}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Hourly distribution (unchanged — existing content preserved) ─────── */}
      <motion.div
        variants={itemAnim}
        className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          Recent Temporal Mass
        </h3>

        {hourHistory.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Insufficient telemetry detected in the recent window.
          </p>
        ) : (
          <div className="space-y-5">
            {hourHistory.map((h, index) => (
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

// ─── Sub-components ───────────────────────────────────────────────────────────

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
      <span className="w-16 text-sm font-mono text-slate-500 dark:text-slate-400 shrink-0">
        {label}
      </span>

      <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: animate ? `${value}%` : "0%" }}
          transition={{ duration: 1, delay: index * 0.08, ease: "easeOut" }}
          className={`h-full rounded-full ${getBarColor(value)}`}
        />
      </div>

      <span className="w-12 text-right text-sm font-mono text-slate-600 dark:text-slate-300 shrink-0">
        {value}%
      </span>
    </div>
  );
}
