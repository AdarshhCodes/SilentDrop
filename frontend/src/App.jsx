import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import Patterns from "./pages/Patterns";
import Trends from "./pages/Trends";
import Reflection from "./pages/Reflection";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/patterns" element={<Patterns />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="/reflection" element={<Reflection />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

