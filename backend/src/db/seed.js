const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const { pool } = require("../config/db");

function loadJson(relativePath) {
  const fullPath = path.join(__dirname, "..", "..", relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

async function seedProblemFromFiles(problemId) {
  const problem = loadJson(`problems/${problemId}/problem.json`);
  const testcases = loadJson(`problems/${problemId}/testcases.json`);
  const config = loadJson(`problems/${problemId}/config.json`);

  if (!problem || !testcases || !config) {
    console.warn(`Skipping ${problemId}: missing problem files`);
    return;
  }

  const cases = Array.isArray(testcases) ? testcases : [...(testcases.sample || []), ...(testcases.hidden || [])];
  const sampleCount = Array.isArray(testcases) ? testcases.length : (testcases.sample || []).length;

  await pool.execute(
    `INSERT INTO problems (id, title, statement, difficulty, sample_input, sample_output, time_limit_ms)
     VALUES (:id, :title, :statement, :difficulty, :sampleInput, :sampleOutput, :timeLimitMs)
     ON DUPLICATE KEY UPDATE
       title = VALUES(title),
       statement = VALUES(statement),
       difficulty = VALUES(difficulty),
       sample_input = VALUES(sample_input),
       sample_output = VALUES(sample_output),
       time_limit_ms = VALUES(time_limit_ms)`,
    {
      id: problem.id || problemId,
      title: problem.title,
      statement: problem.statement,
      difficulty: problem.difficulty || "Easy",
      sampleInput: problem.sampleInput || null,
      sampleOutput: problem.sampleOutput || null,
      timeLimitMs: config.timeLimitMs || 1000,
    }
  );

  const tags = problem.tags || ["Array"];
  for (const tag of tags) {
    await pool.execute(
      "INSERT IGNORE INTO problem_tags (problem_id, tag) VALUES (:problemId, :tag)",
      { problemId: problem.id || problemId, tag }
    );
  }

  if (Array.isArray(problem.constraints)) {
    await pool.execute("DELETE FROM problem_constraints WHERE problem_id = :problemId", {
      problemId: problem.id || problemId,
    });
    for (let i = 0; i < problem.constraints.length; i += 1) {
      await pool.execute(
        `INSERT INTO problem_constraints (problem_id, constraint_text, sort_order)
         VALUES (:problemId, :text, :sortOrder)`,
        { problemId: problem.id || problemId, text: problem.constraints[i], sortOrder: i }
      );
    }
  }

  await pool.execute("DELETE FROM test_cases WHERE problem_id = :problemId", {
    problemId: problem.id || problemId,
  });

  for (let i = 0; i < cases.length; i += 1) {
    await pool.execute(
      `INSERT INTO test_cases (problem_id, input_text, expected_output, is_sample, sort_order)
       VALUES (:problemId, :inputText, :expectedOutput, :isSample, :sortOrder)`,
      {
        problemId: problem.id || problemId,
        inputText: cases[i].input,
        expectedOutput: cases[i].expected,
        isSample: i < sampleCount ? 1 : 0,
        sortOrder: i,
      }
    );
  }

  console.log(`Seeded problem "${problemId}"`);
}

async function seed() {
  const problemsDir = path.join(__dirname, "..", "..", "problems");
  if (fs.existsSync(problemsDir)) {
    const problemIds = fs
      .readdirSync(problemsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const problemId of problemIds) {
      await seedProblemFromFiles(problemId);
    }
  }

  const demoEmail = "demo@codekurukshetra.local";
  const [existing] = await pool.execute("SELECT id FROM users WHERE email = :email LIMIT 1", { email: demoEmail });
  if (existing.length === 0) {
    const { hashPassword } = require("../utils/crypto");
    await pool.execute(
      `INSERT INTO users (id, name, email, password_hash, provider)
       VALUES (:id, :name, :email, :passwordHash, 'password')`,
      {
        id: crypto.randomUUID(),
        name: "Demo Coder",
        email: demoEmail,
        passwordHash: hashPassword("demo12345"),
      }
    );
    console.log(`Created demo user ${demoEmail} / demo12345`);
  }

  await pool.end();
  console.log("Seed complete");
}

seed().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
