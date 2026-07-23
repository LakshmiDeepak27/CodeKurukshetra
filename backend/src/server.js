const http = require("http");
const { createApp } = require("./app");
const config = require("./config/env");
const { initSocketServer } = require("./socket");

const app = createApp();
const server = http.createServer(app);

initSocketServer(server);

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


