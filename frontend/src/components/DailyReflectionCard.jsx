import { useState, useEffect } from "react";
import api from "../api";

function DailyReflectionCard() {
  const [reflection, setReflection] = useState({ mood: "none", note: "" });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showNote, setShowNote] = useState(false);

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD localish

  useEffect(() => {
    async function fetchReflection() {
      try {
        const res = await api.get(`/api/reflections/${today}`);
        if (res.data) {
          setReflection({ mood: res.data.mood || "none", note: res.data.note || "" });
          if (res.data.note) setShowNote(true);
        }
      } catch (error) {
        console.error("Failed to load reflection", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReflection();
  }, [today]);

  const updateReflection = async (newMood, newNote = reflection.note) => {
    setIsSaving(true);
    // Optimistic UI
    setReflection({ mood: newMood, note: newNote });
    try {
      await api.post("/api/reflections", { date: today, mood: newMood, note: newNote });
    } catch (error) {
      console.error("Failed to save reflection", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-800">
      <h3 className="text-lg font-semibold mb-2">How did you feel today?</h3>
      <p className="text-sm text-gray-500 mb-4">Tracking your mood helps contextualize your commits.</p>
      
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => { updateReflection('flow'); setShowNote(true); }}
          className={`px-4 py-2 rounded-full transition-colors text-sm font-medium ${reflection.mood === 'flow' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
        >
          😌 Flow State
        </button>
        <button
          onClick={() => { updateReflection('okay'); setShowNote(true); }}
          className={`px-4 py-2 rounded-full transition-colors text-sm font-medium ${reflection.mood === 'okay' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
        >
          😐 Okay
        </button>
        <button
          onClick={() => { updateReflection('stressed'); setShowNote(true); }}
          className={`px-4 py-2 rounded-full transition-colors text-sm font-medium ${reflection.mood === 'stressed' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
        >
          😫 Stressed
        </button>
      </div>

      {showNote && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <input
            type="text"
            placeholder="Add an optional note about today..."
            className="w-full text-sm p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
            value={reflection.note}
            onChange={(e) => setReflection({ ...reflection, note: e.target.value })}
            onBlur={() => updateReflection(reflection.mood, reflection.note)}
          />
          {isSaving && <span className="text-xs text-indigo-500 mt-2 block animate-pulse">Saving telemetry...</span>}
        </div>
      )}
    </div>
  );
}

export default DailyReflectionCard;
