const crypto = require("crypto");
const { query } = require("../config/db");
const problemsService = require("./problems.service");
const judgeService = require("./judge.service");

async function createSubmission({ userId, problemId, code, language, mode }) {
  const id = crypto.randomUUID();
  await query(
    `INSERT INTO submissions (id, user_id, problem_id, code, language, mode, status)
     VALUES (:id, :userId, :problemId, :code, :language, :mode, 'pending')`,
    { id, userId: userId || null, problemId, code, language, mode }
  );
  return id;
}

async function completeSubmission(submissionId, { verdict, sampleResults, hiddenSummary, errorMessage }) {
  await query(
    `UPDATE submissions
     SET verdict = :verdict, status = :status, error_message = :errorMessage
     WHERE id = :submissionId`,
    {
      submissionId,
      verdict: verdict || null,
      status: errorMessage ? "failed" : "completed",
      errorMessage: errorMessage || null,
    }
  );

  const results = sampleResults || [];
  for (let i = 0; i < results.length; i += 1) {
    const result = results[i];
    await query(
      `INSERT INTO submission_results
       (submission_id, case_index, status, input_text, expected_output, actual_output, runtime_ms)
       VALUES (:submissionId, :caseIndex, :status, :inputText, :expectedOutput, :actualOutput, :runtimeMs)`,
      {
        submissionId,
        caseIndex: i,
        status: result.status,
        inputText: result.input || null,
        expectedOutput: result.expected || null,
        actualOutput: result.output || null,
        runtimeMs: result.runtimeMs || null,
      }
    );
  }

  return { verdict, sampleResults, hiddenSummary };
}

async function submitCode({ userId, problemId, code, language = "cpp", mode = "submit" }) {
  const config = await problemsService.getProblemJudgeConfig(problemId);
  if (!config) {
    const error = new Error("Problem configuration not found");
    error.status = 404;
    throw error;
  }

  const hiddenCases = mode === "run" ? [] : config.testCases.hidden;
  const payload = {
    language,
    code,
    timeLimitMs: config.problem.timeLimitMs,
    mode,
    testCases: {
      sample: config.testCases.sample,
      hidden: hiddenCases,
    },
  };

  const submissionId = await createSubmission({ userId, problemId, code, language, mode });

  try {
    const result = await judgeService.runJudge(payload);
    await completeSubmission(submissionId, {
      verdict: result.verdict,
      sampleResults: result.sampleResults || [],
      hiddenSummary: result.hiddenSummary || { passed: false },
    });

    return {
      status: "success",
      submissionId,
      verdict: result.verdict,
      sampleResults: result.sampleResults || [],
      hiddenSummary: result.hiddenSummary || { passed: false },
    };
  } catch (error) {
    await completeSubmission(submissionId, {
      verdict: null,
      sampleResults: [],
      hiddenSummary: { passed: false },
      errorMessage: error.message,
    });
    throw error;
  }
}

async function getSubmissionById(submissionId, userId) {
  const rows = await query(
    `SELECT s.*, p.title AS problem_title
     FROM submissions s
     JOIN problems p ON p.id = s.problem_id
     WHERE s.id = :submissionId
     LIMIT 1`,
    { submissionId }
  );
  const submission = rows[0];
  if (!submission) return null;
  if (userId && submission.user_id && submission.user_id !== userId) return null;

  const results = await query(
    `SELECT case_index, status, input_text, expected_output, actual_output, runtime_ms
     FROM submission_results
     WHERE submission_id = :submissionId
     ORDER BY case_index`,
    { submissionId }
  );

  return {
    id: submission.id,
    problemId: submission.problem_id,
    problemTitle: submission.problem_title,
    language: submission.language,
    mode: submission.mode,
    verdict: submission.verdict,
    status: submission.status,
    errorMessage: submission.error_message,
    createdAt: submission.created_at,
    results: results.map((row) => ({
      caseIndex: row.case_index,
      status: row.status,
      input: row.input_text,
      expected: row.expected_output,
      output: row.actual_output,
      runtimeMs: row.runtime_ms,
    })),
  };
}

async function listUserSubmissions(userId, { problemId, limit = 20 } = {}) {
  const params = { userId };
  const safeLimit = Math.min(Number(limit) || 20, 100);
  let sql = `
    SELECT s.id, s.problem_id, s.language, s.mode, s.verdict, s.status, s.created_at, p.title AS problem_title
    FROM submissions s
    JOIN problems p ON p.id = s.problem_id
    WHERE s.user_id = :userId
  `;
  if (problemId) {
    sql += " AND s.problem_id = :problemId";
    params.problemId = problemId;
  }
  sql += ` ORDER BY s.created_at DESC LIMIT ${safeLimit}`;

  return query(sql, params);
}

module.exports = {
  submitCode,
  getSubmissionById,
  listUserSubmissions,
};
