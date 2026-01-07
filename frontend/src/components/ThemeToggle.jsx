import { useEffect, useState } from "react";

function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (typeof document === "undefined") return;

    const html = document.documentElement;
    const body = document.body;

    if (dark) {
      html.classList.add("dark");
      body.style.backgroundColor = "#000000"; // FORCE base bg
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      body.style.backgroundColor = "#f9fafb"; // light bg
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((prev) => !prev)}
      className="text-sm px-3 py-1 rounded-lg border
                 border-gray-300 dark:border-gray-600
                 text-gray-700 dark:text-gray-200
                 bg-white dark:bg-gray-800
                 transition"
    >
      {dark ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}

export default ThemeToggle;
