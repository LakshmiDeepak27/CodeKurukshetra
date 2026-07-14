const { query } = require("../config/db");

async function listProblems() {
  const rows = await query(
    `SELECT p.id, p.title, p.difficulty, p.sample_input, p.sample_output,
            GROUP_CONCAT(DISTINCT pt.tag ORDER BY pt.tag SEPARATOR ',') AS tags
     FROM problems p
     LEFT JOIN problem_tags pt ON pt.problem_id = p.id
     WHERE p.is_active = 1
     GROUP BY p.id
     ORDER BY p.created_at ASC`
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    difficulty: row.difficulty,
    sampleInput: row.sample_input,
    sampleOutput: row.sample_output,
    tags: row.tags ? row.tags.split(",") : [],
  }));
}

async function getProblemById(problemId) {
  const rows = await query(
    `SELECT id, title, statement, difficulty, sample_input, sample_output, time_limit_ms, memory_limit_mb
     FROM problems
     WHERE id = :problemId AND is_active = 1
     LIMIT 1`,
    { problemId }
  );
  if (!rows[0]) return null;

  const tags = await query("SELECT tag FROM problem_tags WHERE problem_id = :problemId ORDER BY tag", { problemId });
  const constraints = await query(
    "SELECT constraint_text FROM problem_constraints WHERE problem_id = :problemId ORDER BY sort_order",
    { problemId }
  );

  const problem = rows[0];
  return {
    id: problem.id,
    title: problem.title,
    statement: problem.statement,
    difficulty: problem.difficulty,
    sampleInput: problem.sample_input,
    sampleOutput: problem.sample_output,
    timeLimitMs: problem.time_limit_ms,
    memoryLimitMb: problem.memory_limit_mb,
    tags: tags.map((row) => row.tag),
    constraints: constraints.map((row) => row.constraint_text),
  };
}

async function getSampleTestCases(problemId) {
  return query(
    `SELECT input_text AS input, expected_output AS expected
     FROM test_cases
     WHERE problem_id = :problemId AND is_sample = 1
     ORDER BY sort_order`,
    { problemId }
  );
}

async function getProblemJudgeConfig(problemId) {
  const problem = await getProblemById(problemId);
  if (!problem) return null;

  const sample = await query(
    `SELECT input_text AS input, expected_output AS expected
     FROM test_cases
     WHERE problem_id = :problemId AND is_sample = 1
     ORDER BY sort_order`,
    { problemId }
  );

  const hidden = await query(
    `SELECT input_text AS input, expected_output AS expected
     FROM test_cases
     WHERE problem_id = :problemId AND is_sample = 0
     ORDER BY sort_order`,
    { problemId }
  );

  return {
    problem,
    testCases: { sample, hidden },
  };
}

module.exports = {
  listProblems,
  getProblemById,
  getSampleTestCases,
  getProblemJudgeConfig,
};
