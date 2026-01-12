import { useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import { NavLink } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";

function Reflection() {
  const { data, loading } = useAppData();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        Loading reflection…
      </div>
    );
  }

  const risk = data.burnoutRisk ?? 0;

  const message =
    risk < 40
      ? { title: "You’re doing well", text: "Your rhythm looks balanced.", prompt: "What helped today?" }
      : risk < 70
      ? { title: "Pause and notice", text: "You’ve been carrying a steady load.", prompt: "What could you ease?" }
      : { title: "Be kind to yourself", text: "High strain detected.", prompt: "What would rest look like?" };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
      {/* Navbar */}
      <div className="bg-white dark:bg-gray-900 shadow-sm px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">SilentDrop</h1>

          <div className="hidden md:flex gap-6 items-center">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/patterns">Patterns</NavLink>
            <NavLink to="/trends">Trends</NavLink>
            <NavLink to="/reflection" className="underline">Reflection</NavLink>
            <ThemeToggle />
          </div>

          <button className="md:hidden text-2xl" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-24 text-center fade-in">
        <h2 className="text-3xl font-semibold mb-3">{message.title}</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-10">
          {message.text}
        </p>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-8 max-w-xl mx-auto">
          <p className="text-sm mb-4">{message.prompt}</p>
          <textarea
            placeholder="Write freely — nothing is saved."
            rows={4}
            className="w-full p-3 rounded-lg bg-gray-50 dark:bg-black border text-sm"
          />
        </div>
      </div>
    </div>
  );
}

export default Reflection;
