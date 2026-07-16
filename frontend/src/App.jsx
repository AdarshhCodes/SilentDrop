import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import Patterns from "./pages/Patterns";
import Trends from "./pages/Trends";
import Reflection from "./pages/Reflection";
import AuthSuccess from "./pages/AuthSuccess";
import PageShell from "./components/PageShell";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  const location = useLocation();

  // Google Analytics page tracking (correct)
  useEffect(() => {
    if (window.gtag) {
      window.gtag("config", "G-7SGRPSL90Y", {
        page_path: location.pathname,
      });
    }
  }, [location]);

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth-success" element={<AuthSuccess />} />
        <Route path="/*" element={
          <PageShell>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/patterns" element={<Patterns />} />
              <Route path="/trends" element={<Trends />} />
              <Route path="/reflection" element={<Reflection />} />
              <Route path="*" element={
                <div className="text-center py-20 text-slate-500 dark:text-slate-400">
                  <h3 className="text-2xl font-light mb-4">Diagnostic: Path Not Found</h3>
                  <p className="text-sm mb-6">The requested sequence does not map to any active telemetry.</p>
                  <a href="/dashboard" className="px-6 py-2 rounded-full border border-slate-300 dark:border-slate-700 text-sm hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                    Return to Dashboard
                  </a>
                </div>
              } />
            </Routes>
          </PageShell>
        } />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
