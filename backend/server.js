const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const pinoHttp = require("pino-http");

const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");

require("./config/passport");

const analysisRoutes = require("./routes/analysis");
const auth = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard.routes");
const userRoutes = require("./routes/user.routes");
const reflectionRoutes = require("./routes/reflection.routes");

const app = express();
app.set("trust proxy", 1);

// ─── Request / response logging (pino-http) ───────────────────────────────────
// Attaches req.id (uuid) and req.log (child logger) to every request so that
// downstream middleware and controllers can log with the request ID automatically.
app.use(
  pinoHttp({
    logger,
    // Redact Authorization header so tokens never appear in access logs.
    redact: ["req.headers.authorization", "req.headers.cookie"],
    // Customise the log level per status code.
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    // Keep access logs terse — route + status + response time.
    serializers: {
      req(req) {
        return { method: req.method, url: req.url, id: req.id };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "https://silent-drop.vercel.app",
  "https://silentdrop-frontend.onrender.com",
  process.env.FRONTEND_URL || "http://localhost:5173",
];
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// ─── Health endpoint ───────────────────────────────────────────────────────────
// Returns 200 { status: "ok", db: "connected", uptime } when healthy.
// Returns 503 { status: "degraded", db: "disconnected", uptime } when the
// MongoDB connection is not in the "connected" state (readyState !== 1).
app.get("/health", (_req, res) => {
  // mongoose.connection.readyState: 0=disconnected 1=connected 2=connecting 3=disconnecting
  const dbConnected = mongoose.connection.readyState === 1;
  const payload = {
    status: dbConnected ? "ok" : "degraded",
    db: dbConnected ? "connected" : "disconnected",
    uptime: Math.floor(process.uptime()),
  };
  res.status(dbConnected ? 200 : 503).json(payload);
});

// ─── Passport ─────────────────────────────────────────────────────────────────
app.use(passport.initialize());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", auth);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/user", userRoutes);
app.use("/api/reflections", reflectionRoutes);

app.get("/", (_req, res) => {
  res.send("SilentDrop backend is running");
});

// ─── Centralised error handler (must be last middleware) ───────────────────────
app.use(errorHandler);

// ─── MongoDB connection ────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info("MongoDB connected");
    // Start the nightly telemetry cron after DB is confirmed ready.
    require('./cron');
  })
  .catch((err) => {
    logger.error({ err }, "MongoDB connection error");
    process.exit(1);
  });


// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info({ port: PORT }, "Server running");
});
