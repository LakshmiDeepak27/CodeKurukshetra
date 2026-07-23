const express = require("express");
const cors = require("cors");
const config = require("./config/env");
const { ping } = require("./config/db");
const { runJudge } = require("./services/judge.service");
const authRoutes = require("./routes/auth.routes");
const problemsRoutes = require("./routes/problems.routes");
const submissionsRoutes = require("./routes/submissions.routes");
const adminRoutes = require("./routes/admin.routes");
const leaderboardRoutes = require("./routes/leaderboard.routes");
const battlesRoutes = require("./routes/battles.routes");
const submissionsController = require("./controllers/submissions.controller");
const { optionalAuthenticate } = require("./middleware/auth");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { securityHeaders, createRateLimiter } = require("./middleware/security");

function createApp() {
  const app = express();
  app.disable("x-powered-by");

  app.use(
    cors({
      origin: config.corsOrigins,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(securityHeaders);
  app.use(createRateLimiter({
    windowMs: 60 * 1000,
    max: 120,
    message: "Too many API requests. Please try again shortly.",
  }));

  // Extended /health endpoint testing both MySQL database and Judge engine roundtrip (PDF Item 3.5)
  app.get("/health", async (_req, res) => {
    let dbStatus = "disconnected";
    let judgeStatus = "unknown";

    try {
      await ping();
      dbStatus = "connected";
    } catch {
      dbStatus = "disconnected";
    }

    try {
      const pingPayload = {
        code: "int main(){return 0;}",
        language: "cpp",
        timeLimitMs: 2000,
        memoryLimitMb: 256,
        testCases: [{ input: "", expected: "" }],
      };
      await runJudge(pingPayload);
      judgeStatus = "ok";
    } catch (err) {
      judgeStatus = err.message || "degraded";
    }

    const isHealthy = dbStatus === "connected" && judgeStatus === "ok";
    return res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? "ok" : "degraded",
      database: dbStatus,
      judge: judgeStatus,
    });
  });

  app.use("/auth", authRoutes);
  app.use("/problems", problemsRoutes);
  app.use("/submissions", submissionsRoutes);
  app.use("/admin", adminRoutes);
  app.use("/leaderboard", leaderboardRoutes);
  app.use("/battles", battlesRoutes);

  // Backward-compatible alias used by the Editor frontend
  app.post(
    "/submit",
    createRateLimiter({ windowMs: 60 * 1000, max: 12, message: "Too many submissions. Please wait a minute." }),
    optionalAuthenticate,
    submissionsController.submit
  );

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
