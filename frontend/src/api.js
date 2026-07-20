import axios from "axios";

const getBackendUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");
  return isLocal
    ? "http://localhost:5000"
    : "https://silentdrop-backend.onrender.com";
};

const api = axios.create({
  baseURL: getBackendUrl(),
});

// ─── Request interceptor — attach access token ────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — silent token refresh on 401 ──────────────────────
// When the 15-minute access token expires, the server returns 401.
// This interceptor attempts one silent refresh using the 7-day refresh token.
// If refresh succeeds: stores the new pair and retries the original request.
// If refresh fails (refresh token expired or revoked): clears both tokens and
//   redirects to "/" so the user is prompted to log in again.
// The `_retry` flag prevents infinite loops if /api/auth/refresh itself 401s.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const is401 = error.response?.status === 401;
    const isRefreshEndpoint = originalRequest?.url?.includes("/api/auth/refresh");

    if (is401 && !originalRequest._retry && !isRefreshEndpoint) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        // No refresh token stored — nothing to try, send user to login.
        localStorage.removeItem("token");
        window.location.href = "/";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${getBackendUrl()}/api/auth/refresh`,
          { refreshToken }
        );

        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);

        // Retry the original request with the new access token
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);

      } catch {
        // Refresh failed — clear everything and redirect to landing
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
