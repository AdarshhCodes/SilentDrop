import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 250, damping: 25 } },
};

// ─── Export helper ────────────────────────────────────────────────────────────
// Uses a direct fetch (not <a href>) because the JWT must be in the
// Authorization header — plain anchor tags cannot set custom headers.
async function downloadExport(format, range, setExportState) {
  setExportState({ loading: true, error: null });
  try {
    const token = localStorage.getItem("token");
    const baseUrl =
      import.meta.env.VITE_API_URL ||
      (window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "https://silentdrop-backend.onrender.com");

    const res = await fetch(
      `${baseUrl}/api/reflections/export?format=${format}&range=${range}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Export failed (${res.status})`);
    }

    // Derive filename from Content-Disposition header if present
    const disposition = res.headers.get("content-disposition") || "";
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match ? match[1] : `reflections.${format}`;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setExportState({ loading: false, error: null });
  } catch (err) {
    setExportState({ loading: false, error: err.message });
  }
}

// ─── Export panel ─────────────────────────────────────────────────────────────
function ExportPanel() {
  const [format, setFormat] = useState("csv");
  const [range, setRange]   = useState("30");
  const [exportState, setExportState] = useState({ loading: false, error: null });

  const handleExport = () => downloadExport(format, range, setExportState);

  return (
    <motion.div
      variants={itemAnim}
      className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 md:p-10"
    >
      <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-5">
        Export History
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Format toggle */}
        <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          {["csv", "pdf"].map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                format === f
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Range selector */}
        <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          {[["30", "30 days"], ["90", "90 days"], ["all", "All"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setRange(val)}
              className={`px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                range === val
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Download button */}
        <button
          onClick={handleExport}
          disabled={exportState.loading}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {exportState.loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {format === "pdf" ? "Generating PDF…" : "Preparing…"}
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              Download
            </>
          )}
        </button>
      </div>

      {/* Error state */}
      <AnimatePresence>
        {exportState.error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-red-500 dark:text-red-400"
          >
            {exportState.error}
          </motion.p>
        )}
      </AnimatePresence>

      <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">
        Limited to 5 exports per hour. Note content is exported as-is — handle with care.
      </p>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Reflection() {
  const { data: dashboardData, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/api/dashboard").then((res) => res.data),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return <div className="flex justify-center py-20 text-slate-500">Loading reflection metrics…</div>;
  }
  if (isError || !dashboardData) {
    return <div className="flex justify-center py-20 text-red-500">Failed to load reflection telemetry.</div>;
  }

  const risk = dashboardData.burnoutRisk ?? 0;
  const message =
    risk < 40
      ? {
          title:  "System Nominal",
          text:   "Your telemetry looks balanced. High integrity detected.",
          prompt: "What habit has reinforced your baseline recently?",
        }
      : risk < 70
      ? {
          title:  "Elevated Load",
          text:   "You've sustained a high operational tempo. Awareness mitigates fatigue.",
          prompt: "What processes could you temporarily suspend to regain bandwidth?",
        }
      : {
          title:  "Critical Threshold",
          text:   "Metrics indicate compound stress. De-escalation and offline recovery are highly recommended.",
          prompt: "What does immediate offline recovery look like today?",
        };

  const hour = new Date().getHours();
  const timeNote =
    hour >= 22
      ? "It's late. Forced shutdown is more optimal for tomorrow's performance than continuing."
      : hour < 9
      ? "A calculated boot sequence sets the efficiency for the day."
      : "Not every task requires immediate processing. Queue the non-essentials.";

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl mx-auto w-full pt-10 pb-20">

      {/* Page header — unchanged */}
      <motion.div variants={itemAnim} className="text-center mb-12">
        <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6">
          Diagnostic Module
        </div>
        <h2 className="text-4xl font-light tracking-tight text-slate-900 dark:text-slate-100 mb-4">
          {message.title}
        </h2>
        <p className="text-xl text-slate-500 dark:text-slate-400 font-light max-w-lg mx-auto leading-relaxed">
          {message.text}
        </p>
      </motion.div>

      {/* Reflection prompt card — unchanged */}
      <motion.div
        variants={itemAnim}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 md:p-10 relative overflow-hidden group hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors duration-500 mb-8"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-4">
          Interactive Prompt
        </p>

        <p className="text-lg text-slate-800 dark:text-slate-200 mb-6 font-medium">
          {message.prompt}
        </p>

        <textarea
          placeholder="Jot down a fleeting thought here... (Ephemeral, not persisted to DB)"
          rows={5}
          className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none font-mono"
        />
      </motion.div>

      {/* Export panel — new */}
      <ExportPanel />

      {/* Footer note — unchanged */}
      <motion.div variants={itemAnim} className="mt-12 text-center space-y-4">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{timeNote}</p>
        <p className="text-xs text-slate-400/60 uppercase tracking-widest font-bold">
          SilentDrop does not judge. It only reflects.
        </p>
      </motion.div>

    </motion.div>
  );
}
