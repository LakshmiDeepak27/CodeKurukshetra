const http = require("http");
const { createApp } = require("./app");
const config = require("./config/env");
const { initSocketServer } = require("./socket");

const app = createApp();
const server = http.createServer(app);

initSocketServer(server);

// Process-level crash handlers (PDF Item 3.4)
process.on("uncaughtException", (error) => {
  console.error("FATAL: Uncaught Exception thrown:", error);
  // Allow pending logs/cleanup then exit so PM2/Docker can restart cleanly
  setTimeout(() => process.exit(1), 1000);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("FATAL: Unhandled Promise Rejection at:", promise, "reason:", reason);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${config.port} is already in use by another process.`);
    process.exit(1);
  } else {
    console.error("Server error:", err);
    process.exit(1);
  }
});

server.listen(config.port, () => {
  console.log(`Backend server active on http://localhost:${config.port}`);
});

function handleShutdown(signal) {
  server.close(() => {
    if (signal === "SIGUSR2") {
      process.kill(process.pid, "SIGUSR2");
    } else {
      process.exit(0);
    }
  });
}

process.once("SIGUSR2", () => handleShutdown("SIGUSR2"));
process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
