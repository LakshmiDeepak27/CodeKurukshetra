const { spawn } = require("child_process");
const path = require("path");
const config = require("../config/env");

function defaultJudgeCommand() {
  if (process.platform === "win32") {
    return {
      command: "wsl.exe",
      args: [
        "bash",
        "-lc",
        `cd ${path.resolve(__dirname, "..", "..", "..").replace(/\\/g, "/").replace(/^([A-Za-z]):/, (_, drive) => `/mnt/${drive.toLowerCase()}`)} && ./judge`,
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

    judge.on("error", reject);
    judge.stdin.write(JSON.stringify(payload));
    judge.stdin.end();
    judge.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    judge.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    judge.on("close", (code) => {
      if (code !== 0 || stderr) {
        reject(new Error(stderr || "Judge execution failed"));
        return;
      }
      if (!stdout.trim()) {
        reject(new Error("Judge returned empty output"));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error("Invalid judge response"));
      }
    });
  });
}

module.exports = { runJudge };
