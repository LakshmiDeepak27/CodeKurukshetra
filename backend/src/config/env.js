require("dotenv").config();

const defaultSecret = "replace-this-development-secret-before-deploying";
const nodeEnv = process.env.NODE_ENV || "development";

if (nodeEnv === "production") {
  if (!process.env.AUTH_TOKEN_SECRET || process.env.AUTH_TOKEN_SECRET === defaultSecret || process.env.AUTH_TOKEN_SECRET.length < 32) {
    throw new Error("FATAL: AUTH_TOKEN_SECRET must be explicitly set to a strong secret (at least 32 characters) in production mode.");
  }
  if (!process.env.CORS_ORIGINS) {
    throw new Error("FATAL: CORS_ORIGINS must be explicitly configured in production mode.");
  }
}

const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv,
  authTokenSecret: process.env.AUTH_TOKEN_SECRET || defaultSecret,
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  judgeCommand: process.env.JUDGE_COMMAND || "",
  judgeArgs: (process.env.JUDGE_ARGS || "").split(" ").filter(Boolean),
  judgeWslDistro: process.env.JUDGE_WSL_DISTRO || "",
  judgeEngine: process.env.JUDGE_ENGINE || "judge0",
  judge0ApiUrl: process.env.JUDGE0_API_URL || "http://localhost:2358",
  judge0ApiKey: process.env.JUDGE0_API_KEY || "",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "code_kurukshetra",
    connectionLimit: Number(process.env.DB_POOL_SIZE) || 10,
  },
};

module.exports = config;
