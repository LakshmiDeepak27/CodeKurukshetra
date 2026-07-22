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

const problemStatsStore = {};

function getStats(problemId) {
  if (!problemStatsStore[problemId]) {
    problemStatsStore[problemId] = {
      likes: 14,
      dislikes: 2,
      comments: [
        { author: "CompetitiveCoder", text: "Great problem! Boundary check is crucial here." },
        { author: "AlgoMaster", text: "Linear pass handles all test scenarios nicely." }
      ]
    };
  }
  return problemStatsStore[problemId];
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
  const stats = getStats(problem.id);

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
    likes: stats.likes,
    dislikes: stats.dislikes,
    commentsCount: stats.comments.length,
    comments: stats.comments,
  };
}

async function voteProblem(problemId, type) {
  const stats = getStats(problemId);
  if (type === "like") stats.likes += 1;
  else if (type === "unlike") stats.likes = Math.max(0, stats.likes - 1);
  else if (type === "dislike") stats.dislikes += 1;
  else if (type === "undislike") stats.dislikes = Math.max(0, stats.dislikes - 1);
  return stats;
}

async function addComment(problemId, author, text) {
  const stats = getStats(problemId);
  stats.comments.push({ author: author || "You", text, createdAt: new Date() });
  return stats;
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
  voteProblem,
  addComment,
};
