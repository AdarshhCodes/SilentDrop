import ThemeToggle from "../components/ThemeToggle";
import {useState} from "react";
function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const handleLogin = () => {
  window.location.href =
    import.meta.env.VITE_API_BASE_URL + "/api/auth/github";
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


      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center fade-in">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Burnout doesn’t shout.
          <br />
          <span className="text-blue-600 dark:text-blue-400">
            It drops silently.
          </span>
        </h2>

        <p className="text-lg text-gray-600 dark:text-gray-400
                      max-w-2xl mx-auto mb-10">
          SilentDrop analyzes your GitHub activity to gently detect burnout risk —
          without notifications, without pressure.
        </p>

        <button
          onClick={handleLogin}
          className="px-8 py-3 rounded-xl bg-black dark:bg-white
                     text-white dark:text-black
                     text-sm font-medium
                     transition hover:opacity-90"
        >
          Continue with GitHub
        </button>

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

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-2xl font-semibold text-center mb-12">
            Designed for Developer Well-Being
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard text="🧠 Burnout Risk Meter" />
            <FeatureCard text="🌙 Late-Night Coding Detection" />
            <FeatureCard text="📊 Weekly Trend Insights" />
            <FeatureCard text="🧘 Mental-Health Aware Design" />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="bg-gray-100 dark:bg-gray-900 py-16 text-center">
        <h4 className="text-xl font-semibold mb-4">
          Start understanding your work rhythm
        </h4>

        <button
          onClick={handleLogin}
          className="px-8 py-3 rounded-xl bg-blue-600
                     text-white text-sm font-medium
                     transition hover:opacity-90"
        >
          Login with GitHub
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          SilentDrop never writes to your GitHub account.
        </p>
      </footer>
    </div>
  );
}

function StepCard({ title, desc }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow p-6
                    transition-all duration-300 hover:scale-[1.02]">
      <h4 className="font-semibold mb-2">
        {title}
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {desc}
      </p>
    </div>
  );
}

function FeatureCard({ text }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6
                    text-center text-sm
                    transition-all duration-300 hover:scale-[1.02]">
      {text}
    </div>
  );
}

export default Landing;
