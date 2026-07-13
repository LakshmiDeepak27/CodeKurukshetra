const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const app = express();

const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, "data", "users.json");
const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || "replace-this-development-secret-before-deploying";

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "1mb" }));

function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function saveUsers(users) {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, provider: user.provider };
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

function passwordMatches(password, stored) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function issueToken(user) {
  const payload = base64Url(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }));
  const signature = crypto.createHmac("sha256", TOKEN_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Authentication required" });
  const [payload, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", TOKEN_SECRET).update(payload || "").digest("base64url");
  const signatureBuffer = Buffer.from(signature || "");
  const expectedBuffer = Buffer.from(expected);
  if (!payload || !signature || signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return res.status(401).json({ message: "Invalid session" });
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.sub || data.exp < Math.floor(Date.now() / 1000)) throw new Error("Expired session");
    const user = readUsers().find((candidate) => candidate.id === data.sub);
    if (!user) throw new Error("Unknown user");
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid session" });
  }
}

function authResponse(user) {
  return { token: issueToken(user), user: publicUser(user) };
}

app.post("/auth/signup", (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return res.status(400).json({ message: "Enter a name, valid email, and password of at least 8 characters" });
  }
  const users = readUsers();
  if (users.some((user) => user.email === email)) return res.status(409).json({ message: "An account with this email already exists" });
  const user = { id: crypto.randomUUID(), name, email, passwordHash: hashPassword(password), provider: "password", createdAt: new Date().toISOString() };
  users.push(user);
  saveUsers(users);
  return res.status(201).json(authResponse(user));
});

app.post("/auth/signin", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const user = readUsers().find((candidate) => candidate.email === email);
  if (!user || !user.passwordHash || !passwordMatches(password, user.passwordHash)) {
    return res.status(401).json({ message: "Incorrect email or password" });
  }
  return res.json(authResponse(user));
});

app.post("/auth/google", async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ message: "Google authentication has not been configured" });
  const credential = String(req.body.credential || "");
  if (!credential) return res.status(400).json({ message: "Google credential is required" });
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    const profile = await response.json();
    if (!response.ok || profile.aud !== process.env.GOOGLE_CLIENT_ID || profile.email_verified !== "true") throw new Error("Invalid Google credential");
    const users = readUsers();
    let user = users.find((candidate) => candidate.email === profile.email.toLowerCase());
    if (!user) {
      user = { id: crypto.randomUUID(), name: profile.name || profile.email.split("@")[0], email: profile.email.toLowerCase(), provider: "google", createdAt: new Date().toISOString() };
      users.push(user);
      saveUsers(users);
    }
    return res.json(authResponse(user));
  } catch {
    return res.status(401).json({ message: "Google sign-in could not be verified" });
  }
});

app.get("/auth/me", authenticate, (req, res) => res.json({ user: publicUser(req.user) }));

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

app.listen(PORT, () =>
  console.log(`Backend running on http://localhost:${PORT}`)
);
