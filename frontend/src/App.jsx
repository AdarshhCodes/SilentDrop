import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import api from "./api";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import Patterns from "./pages/Patterns";
import Trends from "./pages/Trends";
import Reflection from "./pages/Reflection";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get("/auth/user")
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  const loginWithGithub = () => {
    window.location.assign("http://localhost:5000/auth/github");
  };

  return (
    <BrowserRouter>
      <Routes>

        {/* Landing Page */}
        <Route
          path="/"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
              <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 shadow-xl text-center">
                <h1 className="text-3xl font-bold mb-2">SilentDrop</h1>

                <p className="text-gray-400 mb-6">
                  Secure • Anonymous • Developer-friendly
                </p>

                {user ? (
                  <>
                    <p className="mb-4">
                      Welcome,{" "}
                      <span className="font-semibold">
                        {user.username}
                      </span>
                    </p>

                    <a
                      href="/dashboard"
                      className="block w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-200 transition"
                    >
                      Go to Dashboard
                    </a>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={loginWithGithub}
                    className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-200 transition"
                  >
                    Continue with GitHub
                  </button>
                )}

                <p className="text-xs text-gray-500 mt-6">
                  No spam. No tracking. Just files.
                </p>
              </div>
            </div>
          }
        />
       <Route path="/" element={<Landing />} />
       <Route path = "/patterns" element ={<Patterns />} />
       <Route path = "/trends" element={<Trends/>} />
       <Route path = "/reflection" element ={<Reflection />} />
        {/* Dashboard Route */}
        <Route path="/dashboard" element={<Dashboard />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
