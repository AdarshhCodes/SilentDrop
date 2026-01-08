import { useState, useEffect } from "react";
import api from "../api";
import ThemeToggle from "../components/ThemeToggle";
import { Link} from "react-router-dom";
function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check login state
  useEffect(() => {
    api
      .get("/api/auth/me")
      .then((res) => {
  if (res.data && res.data.username) {
    setUser(res.data);
  } else {
    setUser(null);
  }
  setLoading(false);
})

      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  // Start GitHub OAuth
const handleLogin = () => {
  window.location.href =
    "https://silentdrop-backend.onrender.com/api/auth/github";
};


  // Logout
  const handleLogout = () => {
    api
      .get("/api/auth/logout",)
      .then(() => window.location.replace("/"));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
      {/* Navbar */}
      <div className="bg-white dark:bg-gray-900 shadow-sm px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">SilentDrop</h1>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
             <Link to="/patterns"
         className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
        Patterns
      </Link>

      <Link to="/trends"
         className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
        Trends
      </Link>

      <Link to="/reflection"
         className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
        Reflection
      </Link>
            <ThemeToggle />

            {user && (
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 hover:underline"
              >
                Logout
              </button>
            )}
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
          <div className="md:hidden mt-4 space-y-4 border-t pt-4">
                  <Link to="/patterns" className="block text-sm">Patterns</Link>
                   <Link to="/trends" className="block text-sm">Trends</Link>
                   <Link to="/reflection" className="block text-sm">Reflection</Link>
 
            <ThemeToggle />

            {user && (
              <button
                onClick={handleLogout}
                className="block text-sm text-red-500"
              >
                Logout
              </button>
            )}
          </div>
        )}
      </div>

      {/* Hero / Login Section */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center fade-in">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Burnout doesn’t shout.
          <br />
          <span className="text-blue-600 dark:text-blue-400">
            It drops silently.
          </span>
        </h2>

        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
          SilentDrop analyzes your GitHub activity to gently detect burnout risk —
          without notifications, without pressure.
        </p>

        {!user ? (
          <button
            onClick={handleLogin}
            className="px-8 py-3 rounded-xl bg-black dark:bg-white
                       text-white dark:text-black
                       text-sm font-medium
                       transition hover:opacity-90"
          >
            Continue with GitHub
          </button>
        ) : (
          <a
            href="/dashboard"
            className="inline-block px-8 py-3 rounded-xl bg-blue-600
                       text-white text-sm font-medium
                       transition hover:opacity-90"
          >
            Go to Dashboard
          </a>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Read-only GitHub access. No posts. No spam.
        </p>
      </section>

      {/* How It Works */}
      <section className="bg-white dark:bg-gray-900 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-2xl font-semibold text-center mb-12">
            How SilentDrop Works
          </h3>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <StepCard
              title="Connect GitHub"
              desc="Secure OAuth login with read-only access."
            />
            <StepCard
              title="Analyze Patterns"
              desc="Late-night work, weekends, and work rhythm."
            />
            <StepCard
              title="Silent Insights"
              desc="A calm dashboard — no alerts, no pressure."
            />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="bg-gray-100 dark:bg-gray-900 py-16 text-center">
        <h4 className="text-xl font-semibold mb-4">
          Start understanding your work rhythm
        </h4>

        {!user ? (
          <button
            onClick={handleLogin}
            className="px-8 py-3 rounded-xl bg-blue-600
                       text-white text-sm font-medium
                       transition hover:opacity-90"
          >
            Login with GitHub
          </button>
        ) : (
          <a
            href="/dashboard"
            className="inline-block px-8 py-3 rounded-xl bg-blue-600
                       text-white text-sm font-medium
                       transition hover:opacity-90"
          >
            Open Dashboard
          </a>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          SilentDrop never writes to your GitHub account.
        </p>
      </footer>
    </div>
  );
}

function StepCard({ title, desc }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow p-6 transition-all hover:scale-[1.02]">
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
    </div>
  );
}

export default Landing;
