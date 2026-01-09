
import { useEffect } from "react";
import ThemeToggle from "../components/ThemeToggle";
import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/dashboard");
    }
  }, [isLoggedIn, navigate]);

  // Start GitHub OAuth
  const handleLogin = () => {
    window.location.href =
      "https://silentdrop-backend.onrender.com/api/auth/github";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
      {/* Navbar */}
      <div className="bg-white dark:bg-gray-900 shadow-sm px-6 py-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <h1 className="text-xl font-bold">SilentDrop</h1>
          <ThemeToggle />
        </div>
      </div>

      {/* Hero Section */}
   <section className="min-h-screen bg-black flex items-center">
  <div className="max-w-6xl mx-auto px-6 text-center fade-in">
    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
      Burnout doesn’t shout.
      <br />
      <span className="text-blue-600 dark:text-blue-400">
        It drops silently.
      </span>
    </h2>

    <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
      SilentDrop analyzes your GitHub activity to gently detect burnout risk —
      without notifications, without pressure.
    </p>

    <button
      onClick={handleLogin}
      className="px-8 py-3 rounded-xl bg-white
                 text-black text-sm font-medium
                 transition hover:opacity-90"
    >
      Continue with GitHub
    </button>

    <p className="text-xs text-gray-500 mt-4">
      Read-only GitHub access. No posts. No spam.
    </p>
  </div>
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

      {/* About / Trust Section */}
      <footer className="bg-gray-100 dark:bg-gray-900 py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-semibold mb-4">
            What is SilentDrop?
          </h3>

          <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10">
            SilentDrop is a calm, data-driven tool that helps developers
            understand their work rhythm using GitHub activity.
            No notifications. No productivity pressure.
            Just quiet awareness.
          </p>

          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
              <h4 className="font-semibold mb-2">Privacy First</h4>
              <p className="text-gray-500">
                Read-only GitHub access. We never write, post, or modify anything.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
              <h4 className="font-semibold mb-2">No Burnout Alerts</h4>
              <p className="text-gray-500">
                Silent insights instead of anxiety-inducing notifications.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
              <h4 className="font-semibold mb-2">Built for Developers</h4>
              <p className="text-gray-500">
                Designed with empathy for real developer workflows.
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-12">
            © {new Date().getFullYear()} SilentDrop · Built with care
          </p>
        </div>
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
