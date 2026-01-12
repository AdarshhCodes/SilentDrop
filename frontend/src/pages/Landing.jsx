
import { useEffect } from "react";
import ThemeToggle from "../components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Landing() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/dashboard");
    }
  }, [isLoggedIn, navigate]);



  //LOad Spinner while connecting to github
  const Spinner = () => (
  <div className="w-5 h-5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
);


  // Start GitHub OAuth
const handleLogin = async () => {
  if (loading) return;
  setLoading(true);

  const oauthUrl =
    "https://silentdrop-backend.onrender.com/api/auth/github";

  try {
    // Try waking backend up to 3 times
    for (let i = 0; i < 3; i++) {
      const res = await fetch(
        "https://silentdrop-backend.onrender.com/health",
        { cache: "no-store" }
      );

      if (res.ok) break;

      // wait 1.5s before retry
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Final redirect
    window.location.href = oauthUrl;
  } catch (err) {
    // Always redirect as fallback
    window.location.href = oauthUrl;
  }
};



  return (
    <div className="min-h-screen bg-gray-200 dark:bg-black text-gray-900 dark:text-gray-100">
      <div className="
  bg-white dark:bg-gray-900
  border-b border-gray-200 dark:border-gray-800
  px-6 py-4
">

        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <h1 className="text-xl font-bold">SilentDrop</h1>
          <ThemeToggle />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen bg-white dark:bg-black flex flex-col justify-center">
        <div className="max-w-6xl mx-auto px-6 text-center fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black dark:text-white">
            Burnout doesn’t shout.
            <br />
            <span className="text-blue-600 dark:text-blue-400">
              It drops silently.
            </span>
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            A calm dashboard that reflects your GitHub work rhythm.
          </p>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
            SilentDrop analyzes your GitHub activity to gently detect burnout risk —
            without notifications, without pressure.
          </p>
<button
  onClick={handleLogin}
  disabled={loading}
  className="
    px-8 py-3 rounded-xl
    bg-black text-white
    dark:bg-white dark:text-black
    text-sm font-medium
    shadow-md
    hover:shadow-lg
    transition
    disabled:opacity-60
    disabled:cursor-not-allowed
  "
>
  {loading && <Spinner />}
  {loading ? "Connecting to GitHub…" : "Continue with GitHub"}
</button>




          <p className="text-xs text-gray-500 mt-4">
            Read-only GitHub access. No posts. No spam.
          </p>
        </div>

    

      </section>
<div className="bg-white dark:bg-black flex justify-center py-8">
  <p
    className="
      text-base md:text-lg
      text-gray-600 dark:text-gray-400
      animate-bounce
      select-none
    "
  >
    ↓ Scroll
  </p>
</div>

      {/* How It Works */}
      <section className="bg-white dark:bg-gray-900 py-14">
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
            <div className="
  bg-white dark:bg-gray-800 p-6 rounded-xl
  shadow transition-all duration-300 ease-out
  hover:scale-[1.03] hover:shadow-xl
">

              <h4 className="font-semibold mb-2">Privacy First</h4>
              <p className="text-gray-500">
                Read-only GitHub access. We never write, post, or modify anything.
              </p>
            </div>

            <div className="
  bg-white dark:bg-gray-800 p-6 rounded-xl
  shadow transition-all duration-300 ease-out
  hover:scale-[1.03] hover:shadow-xl
">

              <h4 className="font-semibold mb-2">No Burnout Alerts</h4>
              <p className="text-gray-500">
                Silent insights instead of anxiety-inducing notifications.
              </p>
            </div>

            <div className="
  bg-white dark:bg-gray-800 p-6 rounded-xl
  shadow transition-all duration-300 ease-out
  hover:scale-[1.03] hover:shadow-xl
">

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
