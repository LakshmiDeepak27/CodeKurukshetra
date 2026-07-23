require("dotenv").config();

const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  authTokenSecret: process.env.AUTH_TOKEN_SECRET || "replace-this-development-secret-before-deploying",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  judgeCommand: process.env.JUDGE_COMMAND || "",
  judgeArgs: (process.env.JUDGE_ARGS || "").split(" ").filter(Boolean),
  judgeWslDistro: process.env.JUDGE_WSL_DISTRO || "",
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
