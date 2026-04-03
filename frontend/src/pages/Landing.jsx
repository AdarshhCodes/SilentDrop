import { useEffect, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import { motion } from "framer-motion";

function Landing() {
  const [loading, setLoading] = useState(false);

  // Load Spinner while connecting to github
  const Spinner = () => (
    <svg className="h-5 w-5 animate-spin text-white dark:text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );

  const handleLogin = () => {
    if (loading) return;
    setLoading(true);

    const oauthUrl = "https://silentdrop-backend.onrender.com/api/auth/github";
    window.location.href = oauthUrl;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans relative overflow-hidden">
      
      {/* Ambient Background Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 -left-40 w-[30rem] h-[30rem] bg-indigo-400 rounded-full blur-[150px]" 
        />
      </div>

      <nav className="relative z-10 px-6 py-5 border-b border-white/5 dark:border-white/5 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <h1 className="text-xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">SilentDrop</h1>
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-[90vh] flex flex-col justify-center items-center">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto px-6 text-center"
        >
          <motion.h2 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-slate-900 dark:text-slate-50">
            Burnout doesn’t shout.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-indigo-700 dark:from-indigo-400 dark:to-indigo-600 inline-block mt-2">
              It drops silently.
            </span>
          </motion.h2>
          
          <motion.p variants={itemVariants} className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            SilentDrop analyzes your GitHub activity to gently detect burnout risk —
            without notifications, without pressure. Just quiet awareness.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogin}
              disabled={loading}
              className="px-8 py-4 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] hover:shadow-[0_0_60px_-15px_rgba(79,70,229,0.7)] transition-all disabled:opacity-70 flex items-center justify-center gap-3 w-full sm:w-auto"
            >
              {loading && <Spinner />}
              <span>{loading ? "Connecting to GitHub…" : "Continue with GitHub"}</span>
            </motion.button>
          </motion.div>

          <motion.p variants={itemVariants} className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-8">
            Read-only GitHub access. No posts. No spam.
          </motion.p>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 10, 0] }} 
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 text-slate-400 dark:text-slate-600 text-sm tracking-widest uppercase font-bold"
        >
          ↓ Scroll
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 bg-white/50 dark:bg-slate-900/50 py-32 backdrop-blur-md border-y border-white/5 dark:border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-16 text-slate-900 dark:text-slate-100"
          >
            How SilentDrop Works
          </motion.h3>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard title="1. Connect GitHub" desc="Secure OAuth login with read-only access. We only look at timestamps." delay={0.1} />
            <StepCard title="2. Analyze Patterns" desc="The engine assesses late-night commits and weekend work rhythms." delay={0.2} />
            <StepCard title="3. Silent Insights" desc="A calm dashboard reflects your state. No alerts, no pressure." delay={0.3} />
          </div>
        </div>
      </section>

      {/* About / Trust Section */}
      <footer className="relative z-10 py-24 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">Designed for Developers</h3>
          <p className="text-lg text-slate-500 dark:text-slate-400 mb-16 font-light">
            SilentDrop is a calm, data-driven tool that helps developers understand their work rhythm. No notifications. No productivity pressure. Just quiet awareness.
          </p>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            <TrustCard title="Privacy First" desc="Read-only GitHub access. We never write, post, or modify anything." delay={0.1}/>
            <TrustCard title="No Alerts" desc="Silent insights instead of anxiety-inducing notifications." delay={0.2}/>
            <TrustCard title="Built with Care" desc="Optimized with dark-mode, monochromatic calm styles, and Framer Motion." delay={0.3}/>
          </div>

          <p className="text-sm font-mono text-slate-400 mt-20">
            © {new Date().getFullYear()} SilentDrop · System online.
          </p>
        </div>
      </footer>
    </div>
  );
}

function StepCard({ title, desc, delay }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: delay, duration: 0.5 }}
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-slate-950 rounded-2xl shadow-xl shadow-slate-200/20 dark:shadow-none p-8 border border-white dark:border-slate-800"
    >
      <h4 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-3">{title}</h4>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-light">{desc}</p>
    </motion.div>
  );
}

function TrustCard({ title, desc, delay }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: delay, duration: 0.4 }}
      className="bg-slate-100 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800"
    >
      <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">{title}</h4>
      <p className="text-sm text-slate-500 font-light leading-relaxed">{desc}</p>
    </motion.div>
  );
}

export default Landing;
