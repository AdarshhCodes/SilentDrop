import { useEffect, useState } from "react";
import api from "../api";
import ThemeToggle from "../components/ThemeToggle";
import { NavLink } from "react-router-dom";

function Reflection() {
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api
      .get("/api/analysis", { withCredentials: true })
      .then((res) => {
        setRisk(res.data.burnoutRisk ?? 0);
      })
      .catch((err) => {
        console.error("Reflection error", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
        Loading reflection…
      </div>
    );
  }

  /* ---------------------------
     Context-aware reflection
  ---------------------------- */
  const message =
    risk < 40
      ? {
          title: "You’re doing well",
          text: "Your work rhythm looks balanced. Protect what’s working.",
          prompt: "What habit has helped you stay steady recently?",
        }
      : risk < 70
      ? {
          title: "Pause and notice",
          text: "You’ve been carrying a steady load lately. Awareness is care.",
          prompt: "Is there something you could ease this week?",
        }
      : {
          title: "Be kind to yourself",
          text: "Your patterns suggest high strain. Rest is not a weakness — it’s maintenance.",
          prompt: "What would rest look like for you right now?",
        };

  /* ---------------------------
     Gentle time awareness
  ---------------------------- */
  const hour = new Date().getHours();
  const timeNote =
    hour >= 22
      ? "It’s late. Rest now supports tomorrow more than one more push."
      : hour < 9
      ? "A calm start sets the tone for the day."
      : "You don’t have to do everything today.";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
      {/* Navbar */}
      <div className="bg-white dark:bg-gray-900 shadow-sm px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">SilentDrop</h1>

          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/patterns" className="text-sm hover:underline">
              Patterns
            </NavLink>
            <NavLink to="/trends" className="text-sm hover:underline">
              Trends
            </NavLink>
            <NavLink
              to="/reflection"
              className="text-sm font-medium underline"
            >
              Reflection
            </NavLink>
            <NavLink to="/dashboard" className="text-sm hover:underline">
              Dashboard
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

          <button
            className="md:hidden text-2xl"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden mt-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <NavLink to="/patterns" className="block text-sm">
              Patterns
            </NavLink>
            <NavLink to="/trends" className="block text-sm">
              Trends
            </NavLink>
            <NavLink
              to="/reflection"
              className="block text-sm font-medium"
            >
              Reflection
            </NavLink>
            <NavLink to="/dashboard" className="block text-sm">
              Dashboard
            </NavLink>

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

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-24 text-center fade-in">
        <h2 className="text-3xl font-semibold mb-3">
          {message.title}
        </h2>

        <p className="text-sm text-gray-500 mb-8">
          Take a quiet moment to reflect on your day.
        </p>

        <p className="text-lg text-gray-600 dark:text-gray-400 mb-10">
          {message.text}
        </p>

        {/* Reflection Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-8 text-left max-w-xl mx-auto border border-gray-100 dark:border-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
            Reflection prompt
          </p>

          <p className="text-base mb-4">{message.prompt}</p>

          <textarea
            placeholder="You can write here — nothing is saved."
            rows={4}
            className="w-full p-3 rounded-lg bg-gray-50 dark:bg-black
                       border border-gray-200 dark:border-gray-700
                       text-sm text-gray-700 dark:text-gray-300
                       focus:outline-none focus:border-gray-400 dark:focus:border-gray-500"
          />
        </div>

        {/* Time whisper */}
        <p className="text-xs text-gray-500 mt-8">{timeNote}</p>

        <p className="text-xs text-gray-400 mt-10">
          SilentDrop never judges. It only reflects.
        </p>
      </div>
    </div>
  );
}

export default Reflection;
