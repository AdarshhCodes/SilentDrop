import { useEffect, useState } from "react";
import api from "../api";
import ThemeToggle from "../components/ThemeToggle";

function Reflection() {
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api.get("/analysis", { withCredentials: true }).then((res) => {
      setRisk(res.data.burnoutRisk);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center
                      bg-gray-50 dark:bg-black
                      text-gray-900 dark:text-gray-100">
        Loading reflection...
      </div>
    );
  }

  const message =
    risk < 40
      ? {
          title: "You’re doing well",
          text: "Your work rhythm looks balanced. Keep protecting your time and energy.",
          prompt: "What habit has helped you stay consistent recently?",
        }
      : risk < 70
      ? {
          title: "Pause and notice",
          text: "You’ve been pushing a bit lately. Awareness is the first step toward balance.",
          prompt: "Is there something you could slow down this week?",
        }
      : {
          title: "Be kind to yourself",
          text: "Your patterns suggest high strain. Rest is not a weakness — it’s maintenance.",
          prompt: "What would rest look like for you right now?",
        };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black
                    text-gray-900 dark:text-gray-100">
     {/* Navbar */}
<div className="bg-white dark:bg-gray-900 shadow-sm px-6 py-4">
  <div className="flex justify-between items-center">
    <h1 className="text-xl font-bold">
      SilentDrop
    </h1>

    {/* Desktop Nav */}
    <div className="hidden md:flex items-center gap-6">
      <a href="/patterns"
         className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
        Patterns
      </a>

      <a href="/trends"
         className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
        Trends
      </a>

      <a href="/reflection"
         className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
        Reflection
      </a>

      <ThemeToggle />

      <button
        onClick={() => {
          api.get("/auth/logout", { withCredentials: true }).then(() => {
            localStorage.clear();
            window.location.replace("/");
          });
        }}
        className="text-sm text-red-500 hover:underline"
      >
        Logout
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
      <a href="/patterns" className="block text-sm">Patterns</a>
      <a href="/trends" className="block text-sm">Trends</a>
      <a href="/reflection" className="block text-sm">Reflection</a>

      <div className="pt-2">
        <ThemeToggle />
      </div>

      <button
        onClick={() => {
          api.get("/auth/logout", { withCredentials: true }).then(() => {
            localStorage.clear();
            window.location.replace("/");
          });
        }}
        className="block text-sm text-red-500"
      >
        Logout
      </button>
    </div>
  )}
</div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-24 text-center fade-in">
        <h2 className="text-3xl font-semibold mb-6">
          {message.title}
        </h2>

        <p className="text-lg text-gray-600 dark:text-gray-400 mb-10">
          {message.text}
        </p>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow
                        p-8 text-left max-w-xl mx-auto">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Reflection prompt
          </p>

          <p className="text-base">
            {message.prompt}
          </p>
        </div>

        <p className="text-xs text-gray-400 mt-10">
          SilentDrop never judges. It only reflects.
        </p>
      </div>
    </div>
  );
}

export default Reflection;
