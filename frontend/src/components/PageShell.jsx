import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api from "../api";
import ThemeToggle from "./ThemeToggle";
import SettingsModal from "./SettingsModal"; // We import settings here

export default function PageShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showBreathe, setShowBreathe] = useState(false);
  const location = useLocation();

  const links = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/patterns", label: "Patterns" },
    { path: "/trends", label: "Trends" },
    { path: "/reflection", label: "Reflection" }
  ];

  const { data: analysis } = useQuery({
    queryKey: ["analysis"],
    queryFn: async () => {
      const res = await api.get("/api/analysis");
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!localStorage.getItem("token"),
  });

  const risk = analysis?.burnoutRisk || 0;
  const isDigitalSunset = risk >= 75;
  const isExtremeSunset = risk >= 90;

  // Session-based breathe reminder
  useEffect(() => {
    if (risk >= 85 && !sessionStorage.getItem("breathed")) {
      const timer = setTimeout(() => {
        setShowBreathe(true);
        sessionStorage.setItem("breathed", "true");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [risk]);

  return (
    <div className={`min-h-screen font-sans selection:bg-indigo-500/30 transition-all duration-1000 ${
        isDigitalSunset 
          ? "bg-[#2b2722] text-[#e8dcc7] dark:bg-[#1a1612] dark:text-[#d3c5b0]" 
          : "bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
      }`}>

      {isDigitalSunset && (
        <div className={`fixed inset-0 pointer-events-none z-[60] mix-blend-multiply transition-all duration-3000 bg-amber-900/10 ${isExtremeSunset ? "opacity-30 bg-black/30 backdrop-grayscale-[50%]" : "opacity-10"}`} />
      )}

      {/* Global Mindful Overlay */}
      <AnimatePresence>
        {showBreathe && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center"
          >
             <motion.div 
                animate={{ scale: [1, 1.4, 1] }} 
                transition={{ duration: 6, repeat: 3, ease: "easeInOut" }}
                className="w-32 h-32 rounded-full border-4 border-indigo-500/30 bg-indigo-500/10 mb-10 flex items-center justify-center"
             >
                <div className="text-white font-light tracking-widest text-xs uppercase">Breathe</div>
             </motion.div>
             <h2 className="text-2xl font-light text-white mb-4">Focus check: How are you feeling?</h2>
             <p className="text-slate-400 mb-8 max-w-sm">Take a minute to disconnect. SilentDrop is here to protect your rhythm, not your output.</p>
             <button 
               onClick={() => setShowBreathe(false)} 
               className="px-6 py-2 rounded-full border border-white/20 text-white text-sm hover:bg-white/10 transition-colors"
             >
               Continue softly
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`sticky top-0 z-40 backdrop-blur-md px-6 py-4 border-b transition-colors duration-1000 ${
          isDigitalSunset 
            ? "bg-[#2b2722]/80 dark:bg-[#1a1612]/80 border-[#3e3731] dark:border-[#2d251e]"
            : "bg-white/80 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800"
        }`}
      >
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className={`text-xl font-extrabold tracking-tight transition-colors duration-1000 ${isDigitalSunset ? "text-[#d18445]" : "text-indigo-600 dark:text-indigo-400"}`}>
              SilentDrop <span className={`font-normal transition-colors duration-1000 ${isDigitalSunset ? "text-[#8c7a6b]" : "text-slate-400"}`}>| {location.pathname.substring(1) || 'App'}</span>
            </h1>
            {isDigitalSunset && (
               <motion.span 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                 className="text-[10px] uppercase tracking-widest text-[#d18445] font-bold"
               >
                 {isExtremeSunset ? "Critical Telemetry - Dimmed Phase" : "Digital Sunset Active"}
               </motion.span>
            )}
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <AnimatePresence>
              {links.map(link => (
                <NavLink 
                  key={link.path} 
                  to={link.path} 
                  className={({isActive}) => `relative text-sm font-medium transition-colors ${
                      isDigitalSunset 
                        ? (isActive ? 'text-[#e8dcc7]' : 'text-[#8c7a6b] hover:text-[#d18445]')
                        : (isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400')
                  }`}
                >
                  {({ isActive }) => (
                    <>
                      {link.label}
                      {isActive && (
                        <motion.div 
                          layoutId="underline"
                          className={`absolute left-0 bottom-[-4px] w-full h-[2px] transition-colors duration-1000 ${isDigitalSunset ? "bg-[#d18445]" : "bg-indigo-600 dark:bg-indigo-400"}`} 
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </AnimatePresence>
            
            <button 
              onClick={() => setIsSettingsOpen(true)} 
              className={`text-sm font-medium transition-colors ${isDigitalSunset ? "text-[#8c7a6b] hover:text-[#d18445]" : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"}`}
            >
              Settings
            </button>
            {!isDigitalSunset && <ThemeToggle />}
            <button
              onClick={() => {
                localStorage.removeItem("token");
                window.location.replace("/");
              }}
              className={`text-sm transition-colors ${isDigitalSunset ? "text-[#8c7a6b] hover:text-[#ba4f45]" : "text-slate-400 hover:text-red-500"}`}
            >
              Sign out
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={`md:hidden text-2xl transition-colors ${isDigitalSunset ? "text-[#e8dcc7]" : "text-slate-600 dark:text-slate-300"}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`md:hidden overflow-hidden mt-4 space-y-4 pt-4 border-t transition-colors duration-1000 ${isDigitalSunset ? "border-[#3e3731]" : "border-slate-200 dark:border-slate-800"}`}
            >
              {links.map(link => (
                <NavLink key={link.path} to={link.path} className={`block text-sm font-medium ${isDigitalSunset ? "hover:text-[#d18445]" : "hover:text-indigo-500"}`}>
                  {link.label}
                </NavLink>
              ))}
              <button 
                onClick={() => setIsSettingsOpen(true)} 
                className={`block text-sm font-medium ${isDigitalSunset ? "hover:text-[#d18445]" : "hover:text-indigo-500"}`}
              >
                Settings
              </button>
              {!isDigitalSunset && <ThemeToggle />}
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  window.location.replace("/");
                }}
                className="block text-sm text-red-500"
              >
                Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Page Content passed through Children */}
      <AnimatePresence mode="wait">
        <motion.main 
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="max-w-6xl mx-auto px-6 py-10"
        >
          {children}
        </motion.main>
      </AnimatePresence>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

