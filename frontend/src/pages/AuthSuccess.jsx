import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function AuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token        = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");

    if (token) {
      localStorage.setItem("token", token);

      // Store the refresh token if present (dual-token flow).
      // Backward-compatible: if refreshToken is absent (e.g. old link), we just
      // continue with the access token only — existing behaviour is preserved.
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      // Remove both tokens from the visible URL immediately after reading them.
      // This prevents the tokens from sitting in the browser's visible history
      // once the user navigates away.  The tokens may still exist in Render's
      // server access logs (see the comment in auth.js /github/callback) — that
      // residual risk is documented there, not silenced here.
      window.history.replaceState({}, document.title, window.location.pathname);

      navigate("/dashboard");
    } else {
      navigate("/");
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Logging you in...
    </div>
  );
}

export default AuthSuccess;