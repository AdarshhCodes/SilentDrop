import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import Patterns from "./pages/Patterns";
import Trends from "./pages/Trends";
import Reflection from "./pages/Reflection";
import AuthSuccess from "./pages/AuthSuccess";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

function App() {
    const location = useLocation();

  useEffect(() => {
    if (window.gtag) {
      window.gtag("config", "G-7SGRPSL90Y", {
        page_path: location.pathname,
      });
    }
  }, [location]);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patterns" element={<Patterns />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="/reflection" element={<Reflection />} />
        <Route path="/auth-success" element={<AuthSuccess />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;

