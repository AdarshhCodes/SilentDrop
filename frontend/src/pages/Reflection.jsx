import { useQuery } from "@tanstack/react-query";
import api from "../api";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 250, damping: 25 } }
};

export default function Reflection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analysis"],
    queryFn: async () => {
      return api.get("/api/analysis", { withCredentials: true }).then((res) => res.data);
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) return <div className="flex justify-center py-20 text-slate-500">Loading reflection metrics…</div>;
  if (isError || !data) return <div className="flex justify-center py-20 text-red-500">Failed to load reflection telemetry.</div>;

  /* ---------------------------
     Context-aware reflection
  ---------------------------- */
  const risk = data.burnoutRisk ?? 0;
  const message =
    risk < 40
      ? {
          title: "System Nominal",
          text: "Your telemetry looks balanced. High integrity detected.",
          prompt: "What habit has reinforced your baseline recently?",
        }
      : risk < 70
      ? {
          title: "Elevated Load",
          text: "You've sustained a high operational tempo. Awareness mitigates fatigue.",
          prompt: "What processes could you temporarily suspend to regain bandwidth?",
        }
      : {
          title: "Critical Threshold",
          text: "Metrics indicate compound stress. De-escalation and offline recovery are highly recommended.",
          prompt: "What does immediate offline recovery look like today?",
        };

  /* ---------------------------
     Gentle time awareness
  ---------------------------- */
  const hour = new Date().getHours();
  const timeNote =
    hour >= 22
      ? "It's late. Forced shutdown is more optimal for tomorrow's performance than continuing."
      : hour < 9
      ? "A calculated boot sequence sets the efficiency for the day."
      : "Not every task requires immediate processing. Queue the non-essentials.";

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl mx-auto w-full pt-10 pb-20">
      
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

      {/* Reflection Card */}
      <motion.div variants={itemAnim} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 md:p-10 relative overflow-hidden group hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors duration-500">
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

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

      <motion.div variants={itemAnim} className="mt-12 text-center space-y-4">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{timeNote}</p>
        <p className="text-xs text-slate-400/60 uppercase tracking-widest font-bold">
          SilentDrop does not judge. It only reflects.
        </p>
      </motion.div>

    </motion.div>
  );
}
