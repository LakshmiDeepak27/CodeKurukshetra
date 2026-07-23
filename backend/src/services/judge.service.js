const { spawn } = require("child_process");
const path = require("path");
const config = require("../config/env");

function defaultJudgeCommand() {
  if (process.platform === "win32") {
    const workspacePath = path.resolve(__dirname, "..", "..", "..");
    const linuxPath = workspacePath.replace(/\\/g, "/").replace(/^([A-Za-z]):/, (_, drive) => `/mnt/${drive.toLowerCase()}`);
    return {
      command: "wsl.exe",
      args: [
        ...(config.judgeWslDistro ? ["-d", config.judgeWslDistro] : []),
        "bash",
        "-lc",
        `cd '${linuxPath}' && ./judge`,
      ],
    };
  }

  const judgePath = path.resolve(__dirname, "..", "..", "..", "judge");
  return { command: judgePath, args: [] };
}

function runJudge(payload) {
  const configured = config.judgeCommand
    ? { command: config.judgeCommand, args: config.judgeArgs }
    : defaultJudgeCommand();

  return new Promise((resolve, reject) => {
    const judge = spawn(configured.command, configured.args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    judge.on("error", (error) => {
      if (process.platform === "win32" && error.code === "UNKNOWN") {
        reject(new Error("The bundled Windows judge is incompatible. Install or register a WSL Linux distribution, then restart the backend."));
        return;
      }
      reject(error);
    });
    judge.stdin.write(JSON.stringify(payload));
    judge.stdin.end();

    judge.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    judge.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    judge.on("close", (code) => {
      if (stdout.trim()) {
        try {
          const parsed = JSON.parse(stdout);
          return resolve(parsed);
        } catch { }
      }
      if (code !== 0 || stderr) {
        const missingDistro = /no installed distributions|no distributions are installed/i.test(stderr);
        return reject(new Error(missingDistro
          ? "No WSL Linux distribution is registered for this Windows user. Install or import Ubuntu/Debian, then restart the backend."
          : stderr || "Judge execution failed"));
      }
      return reject(new Error("Judge returned empty output"));
    });
  });
}

module.exports = { runJudge };
