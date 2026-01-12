import { createContext, useContext, useState } from "react";
import api from "../api";

const AppDataContext = createContext();

export const AppDataProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAppData = async (navigate) => {
    if (data && user) return; // 🔑 already loaded

    try {
      setLoading(true);

      // parallel requests (BIG WIN)
      const [userRes, analysisRes] = await Promise.all([
        api.get("/api/auth/me"),
        api.get("/api/dashboard"),
      ]);

      setUser(userRes.data.user);
      setData(analysisRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/");
      } else {
        setError("Something went wrong. Please refresh.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppDataContext.Provider
      value={{ user, data, loading, error, loadAppData }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => useContext(AppDataContext);

