const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const { AbstractExecutionProvider } = require("./execution-provider.interface");
const config = require("../../config/env");

const MAX_CONCURRENT = Math.max(2, (os.cpus()?.length || 4) - 1);
let activeJobs = 0;
const jobQueue = [];

function processQueue() {
  if (activeJobs >= MAX_CONCURRENT || jobQueue.length === 0) {
    return;
  }
  const { payload, resolve, reject } = jobQueue.shift();
  activeJobs++;

  executeNativeSubprocess(payload)
    .then(resolve)
    .catch(reject)
    .finally(() => {
      activeJobs--;
      processQueue();
    });
}

function defaultJudgeCommand() {
  if (process.platform === "win32") {
    const workspacePath = path.resolve(__dirname, "..", "..", "..", "..");
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

  const judgePath = path.resolve(__dirname, "..", "..", "..", "..", "judge");
  return { command: judgePath, args: [] };
}

function executeNativeSubprocess(payload) {
  const configured = config.judgeCommand
    ? { command: config.judgeCommand, args: config.judgeArgs }
    : defaultJudgeCommand();

  return new Promise((resolve, reject) => {
    const judge = spawn(configured.command, configured.args, {
      stdio: ["pipe", "pipe", "pipe"],
      detached: process.platform !== "win32",
    });

    let stdout = "";
    let stderr = "";
    let completed = false;

    const timeLimitMs = (payload && payload.timeLimitMs) ? payload.timeLimitMs : 5000;
    const watchdogTimeoutMs = timeLimitMs + 5000;

    const watchdogTimer = setTimeout(() => {
      if (completed) return;
      completed = true;
      try {
        if (judge.pid && process.platform !== "win32") {
          process.kill(-judge.pid, "SIGKILL");
        } else {
          judge.kill("SIGKILL");
        }
      } catch {}
      reject(new Error("Judge execution timed out on the host server"));
    }, watchdogTimeoutMs);

    judge.on("error", (error) => {
      if (completed) return;
      completed = true;
      clearTimeout(watchdogTimer);

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
      if (completed) return;
      completed = true;
      clearTimeout(watchdogTimer);

      if (stdout.trim()) {
        try {
          const parsed = JSON.parse(stdout);
          return resolve(parsed);
        } catch {}
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

class NativeProvider extends AbstractExecutionProvider {
  constructor() {
    super("native");
  }

  async executeBatch(payload) {
    return new Promise((resolve, reject) => {
      jobQueue.push({ payload, resolve, reject });
      processQueue();
    });
  }
}

module.exports = { NativeProvider };
