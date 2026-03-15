const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

const JUDGE_PATH = path.resolve(__dirname, "..", "judge.exe");

function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function problemDir(problemId) {
  return path.join(__dirname, "problems", problemId);
}

function normalizeTestCases(testcases) {
  if (!testcases) return { sample: [], hidden: [] };
  return {
    sample: Array.isArray(testcases) ? testcases : (testcases.sample || []),
    hidden: Array.isArray(testcases) ? [] : (testcases.hidden || []),
  };
}

app.get("/problems/:id", (req, res) => {
  const problem = loadJSON(
    path.join(problemDir(req.params.id), "problem.json")
  );

  if (!problem) {
    return res.status(404).json({ status: "error", message: "Problem not found" });
  }

  res.json(problem);
});

app.get("/problems/:id/testcases", (req, res) => {
  const testcases = loadJSON(
    path.join(problemDir(req.params.id), "testcases.json")
  );
  if (!testcases) {
    return res.status(404).json({ status: "error", message: "Test cases not found" });
  }
  const { sample } = normalizeTestCases(testcases);
  res.json({ sample });
});

app.post("/submit", (req, res) => {
  const { problemId, code, language = "cpp", mode = "submit" } = req.body;

  if (!problemId || typeof code !== "string") {
    return res.status(400).json({
      status: "error",
      message: "problemId and code are required",
    });
  }

  const dir = problemDir(problemId);
  const testcases = loadJSON(path.join(dir, "testcases.json"));
  const config = loadJSON(path.join(dir, "config.json"));

  if (!testcases || !config) {
    return res.status(404).json({
      status: "error",
      message: "Problem configuration not found",
    });
  }

  const { sample: sampleCases, hidden: rawHidden } = normalizeTestCases(testcases);
  const hiddenCases = mode === "run" ? [] : rawHidden;

  const payload = {
    language,
    code,
    timeLimitMs: config.timeLimitMs,
    mode,
    testCases: { sample: sampleCases, hidden: hiddenCases },
  };

const judge = spawn("wsl.exe", [
  "bash",
  "-lc",
  "cd /mnt/e/Projects/CodeKurukshetra && ./judge"
], {
  stdio: ["pipe", "pipe", "pipe"],
});
judge.on("error", (err) => {
  console.error("Judge spawn error:", err);
});
  let stdout = "";
  let stderr = "";

  judge.stdin.write(JSON.stringify(payload));
  judge.stdin.end();

  judge.stdout.on("data", d => (stdout += d.toString()));
  judge.stderr.on("data", d => (stderr += d.toString()));

  judge.on("close", code => {
    if (code !== 0 || stderr) {
      return res.status(500).json({
        status: "error",
        message: "Judge execution failed",
        stderr,
      });
    }

    if (!stdout.trim()) {
      return res.status(500).json({
        status: "error",
        message: "Judge returned empty output",
      });
    }

    try {
      const result = JSON.parse(stdout);
      res.json({
        status: "success",
        verdict: result.verdict,
        sampleResults: result.sampleResults || [],
        hiddenSummary: result.hiddenSummary || { passed: false },
      });
    } catch {
      res.status(500).json({
        status: "error",
        message: "Invalid judge response",
        raw: stdout,
      });
    }
  });
});

app.get("/health", (_, res) => res.json({ status: "ok" }));

app.listen(3000, () =>
  console.log("Backend running on http://localhost:3000")
);
