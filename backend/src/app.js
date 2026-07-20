const express = require("express");
const cors = require("cors");
const config = require("./config/env");
const { ping } = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const problemsRoutes = require("./routes/problems.routes");
const submissionsRoutes = require("./routes/submissions.routes");
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
      methods: ["GET", "POST"],
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

  app.get("/health", async (_req, res) => {
    try {
      await ping();
      return res.json({ status: "ok", database: "connected" });
    } catch {
      return res.status(503).json({ status: "degraded", database: "disconnected" });
    }
  });

  app.use("/auth", authRoutes);
  app.use("/problems", problemsRoutes);
  app.use("/submissions", submissionsRoutes);

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
