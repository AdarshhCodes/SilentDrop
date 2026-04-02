import { useEffect, useState } from "react";
import api from "../api";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

function formatHour(hour) {
  if (hour === null || hour === undefined) return "—";
  return `${hour.toString().padStart(2, "0")}:00`;
}

function getHeatColor(count, max) {
  if (max === 0) return "bg-slate-100 dark:bg-slate-800/50";
  const intensity = count / max;

  // Monochromatic Indigo scale
  if (intensity > 0.8) return "bg-indigo-800 dark:bg-indigo-400";
  if (intensity > 0.6) return "bg-indigo-600 dark:bg-indigo-500";
  if (intensity > 0.4) return "bg-indigo-400 dark:bg-indigo-600";
  if (intensity > 0.2) return "bg-indigo-300 dark:bg-indigo-800";
  if (intensity > 0) return "bg-indigo-100 dark:bg-indigo-950";

  return "bg-slate-100 dark:bg-slate-800/50";
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemAnim = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Patterns() {
  const [showHeatmap, setShowHeatmap] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["analysis"],
    queryFn: async () => {
      return api.get("/api/analysis").then((res) => res.data);
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (data) {
      setTimeout(() => setShowHeatmap(true), 100);
    }
  }, [data]);

  if (isLoading) return <div className="flex justify-center py-20 text-slate-500">Loading patterns…</div>;
  if (isError || !data) return <div className="flex justify-center py-20 text-red-500">Failed to load patterns.</div>;

  const pattern = data?.pattern || {
    mostActiveHour: null,
    lateNightPercentage: 0,
    weekendPercentage: 0,
    basedOnDays: 0,
    confidence: "Low",
    hourHistogram: Array(24).fill(0),
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto w-full">
      <motion.div variants={itemAnim} className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">Work Patterns</h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
          This limits focus on <em>when</em> you usually work — not how much.
          Consistent boundaries reflect sustainability.
        </p>
      </motion.div>

      <div className="space-y-6">
        <motion.div variants={itemAnim} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PatternInsight
            title="Late-night Context"
            text={
              pattern.lateNightPercentage < 20
                ? "Excellent boundary maintenance. Minimal late night disruptions."
                : pattern.lateNightPercentage < 50
                ? "Noticing friction. Some work is spilling out of standard boundaries."
                : "High disruption. Late-night context switching is frequent."
            }
          />
          <PatternInsight
            title="Weekend Integrity"
            text={
              pattern.weekendPercentage < 20
                ? "Strong recovery phases. Weekends are cleanly protected."
                : pattern.weekendPercentage < 50
                ? "Partial recovery. Work is interrupting baseline rest."
                : "Boundary failure. Weekends are routinely compromised."
            }
          />
        </motion.div>

        <motion.div variants={itemAnim}>
          <PatternInsight
            title="Peak Active State"
            text={
              pattern.mostActiveHour !== null
                ? `You enter flow state consistently around ${formatHour(pattern.mostActiveHour)}.`
                : "Awaiting more history to determine your peak hour."
            }
            footer={pattern.basedOnDays ? `Modeled via ${pattern.basedOnDays} day array · ${pattern.confidence} confidence vector` : null}
            fullWidth
          />
        </motion.div>

        {Array.isArray(pattern.hourHistogram) && showHeatmap && (
          <motion.div variants={itemAnim} className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Chronological Density
              </h3>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
              {pattern.hourHistogram.map((count, hour) => {
                const max = Math.max(...pattern.hourHistogram);
                return (
                  <div
                    key={hour}
                    className={`h-12 w-full rounded ${getHeatColor(count, max)} flex items-center justify-center text-xs font-medium text-slate-700 dark:text-slate-300 opacity-90 hover:opacity-100 transition-opacity`}
                    title={`${count} commits at ${hour}:00`}
                  >
                    {hour.toString().padStart(2, "0")}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-4 px-1">
              <span>00:00 (Midnight)</span>
              <span>12:00 (Noon)</span>
              <span>23:00 (Night)</span>
            </div>
          </motion.div>
        )}
      </div>

      <motion.p variants={itemAnim} className="text-xs text-slate-400 text-center mt-12 max-w-xl mx-auto uppercase tracking-widest font-medium">
        Analyzed · Computed · Resolved
      </motion.p>
    </motion.div>
  );
}

function PatternInsight({ title, text, footer, fullWidth = false }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group ${fullWidth ? 'h-full flex flex-col justify-center' : ''}`}>
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 group-hover:text-indigo-500 transition-colors">{title}</h3>
      <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed">{text}</p>
      {footer && (
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/50">
          <p className="text-xs text-slate-400 font-mono">{footer}</p>
        </div>
      )}
    </div>
  );
}
