import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import Patterns from "./pages/Patterns";
import Trends from "./pages/Trends";
import Reflection from "./pages/Reflection";
import AuthSuccess from "./pages/AuthSuccess";

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
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/patterns" element={<Patterns />} />
      <Route path="/trends" element={<Trends />} />
      <Route path="/reflection" element={<Reflection />} />
      <Route path="/auth-success" element={<AuthSuccess />} />
    </Routes>
  );
}

export default App;
