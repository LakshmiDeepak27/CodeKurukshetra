const fs = require("fs");
const path = require("path");
const { query } = require("../config/db");

async function listProblems(options = {}) {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
  const offset = (page - 1) * limit;

  const whereClauses = ["p.is_active = 1"];
  const params = {};

  if (options.difficulty) {
    whereClauses.push("p.difficulty = :difficulty");
    params.difficulty = options.difficulty;
  }

  if (options.search || options.q) {
    whereClauses.push("(p.title LIKE :search OR p.statement LIKE :search)");
    params.search = `%${String(options.search || options.q).trim()}%`;
  }

  if (options.tag) {
    whereClauses.push("EXISTS (SELECT 1 FROM problem_tags pt2 WHERE pt2.problem_id = p.id AND pt2.tag = :tag)");
    params.tag = options.tag;
  }

  const whereSql = whereClauses.join(" AND ");

  const countRows = await query(
    `SELECT COUNT(DISTINCT p.id) AS total FROM problems p WHERE ${whereSql}`,
    params
  );
  const total = Number(countRows[0]?.total || 0);

  const rows = await query(
    `SELECT p.id, p.title, p.difficulty, p.sample_input, p.sample_output,
            GROUP_CONCAT(DISTINCT pt.tag ORDER BY pt.tag SEPARATOR ',') AS tags
     FROM problems p
     LEFT JOIN problem_tags pt ON pt.problem_id = p.id
     WHERE ${whereSql}
     GROUP BY p.id
     ORDER BY p.created_at ASC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  const problems = rows.map((row) => ({
    id: row.id,
    title: row.title,
    difficulty: row.difficulty,
    sampleInput: row.sample_input,
    sampleOutput: row.sample_output,
    tags: row.tags ? row.tags.split(",") : [],
  }));

  return {
    problems,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getStats(problemId) {
  const votes = await query(
    `SELECT
       COUNT(CASE WHEN vote_type = 'like' THEN 1 END) AS likes,
       COUNT(CASE WHEN vote_type = 'dislike' THEN 1 END) AS dislikes
     FROM problem_votes
     WHERE problem_id = :problemId`,
    { problemId }
  );

  const comments = await query(
    `SELECT c.id, c.text, c.created_at AS createdAt, u.name AS author
     FROM problem_comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.problem_id = :problemId
     ORDER BY c.created_at ASC`,
    { problemId }
  );

  return {
    likes: Number(votes[0]?.likes || 0),
    dislikes: Number(votes[0]?.dislikes || 0),
    comments,
  };
}

function getDiskProblemMetadata(problemId) {
  try {
    const fullPath = path.join(__dirname, "..", "..", "problems", problemId, "problem.json");
    if (fs.existsSync(fullPath)) {
      return JSON.parse(fs.readFileSync(fullPath, "utf8"));
    }
  } catch { }
  return {};
}

const { parsePythonStarterCode } = require("../utils/starter-code-generator");

function getDefaultFunctionWrapper(problemId, title) {
  const funcName = title
    ? title.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase()).replace(/[^a-zA-Z0-9]/g, "")
    : "solve";
  const validFuncName = funcName.length ? funcName : "solve";

  return parsePythonStarterCode(`class Solution:\n    def ${validFuncName}(self, nums: List[int]) -> int:\n        pass\n`, `Solution.${validFuncName}`);
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
  const wrapperRows = await query(
    `SELECT function_name, return_type, parameters_json, languages_json
     FROM problem_function_metadata WHERE problem_id = :problemId LIMIT 1`,
    { problemId }
  );

  const problem = rows[0];
  const stats = await getStats(problem.id);
  const diskData = getDiskProblemMetadata(problem.id);

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
    hints: diskData.hints || ["Break down the problem by examining boundary inputs.", "Consider optimal data structures for lookup."],
    editorial: diskData.editorial || "### Algorithmic Breakdown\n\nAnalyze constraints and sequence properties to implement an efficient solution.",
    solutions: diskData.solutions || {},
    companies: diskData.companies || [],
    likes: stats.likes,
    dislikes: stats.dislikes,
    commentsCount: stats.comments.length,
    comments: stats.comments,
    functionWrapper: wrapperRows[0] ? {
      functionName: wrapperRows[0].function_name,
      returnType: wrapperRows[0].return_type,
      parameters: typeof wrapperRows[0].parameters_json === "string" ? JSON.parse(wrapperRows[0].parameters_json) : wrapperRows[0].parameters_json,
      languages: typeof wrapperRows[0].languages_json === "string" ? JSON.parse(wrapperRows[0].languages_json) : wrapperRows[0].languages_json,
    } : getDefaultFunctionWrapper(problem.id, problem.title),
  };
}

async function voteProblem(problemId, userId, type) {
  if (type === "like" || type === "dislike") {
    await query(
      `INSERT INTO problem_votes (problem_id, user_id, vote_type)
       VALUES (:problemId, :userId, :type)
       ON DUPLICATE KEY UPDATE vote_type = VALUES(vote_type)`,
      { problemId, userId, type }
    );
  } else if (type === "unlike" || type === "undislike") {
    await query(
      `DELETE FROM problem_votes WHERE problem_id = :problemId AND user_id = :userId`,
      { problemId, userId }
    );
  }
  return getStats(problemId);
}

async function addComment(problemId, author, userId, text) {
  await query(
    `INSERT INTO problem_comments (problem_id, user_id, text)
     VALUES (:problemId, :userId, :text)`,
    { problemId, userId, text }
  );
  return getStats(problemId);
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
    functionWrapper: problem.functionWrapper,
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
