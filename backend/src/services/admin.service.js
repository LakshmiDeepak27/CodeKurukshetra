const { query } = require("../config/db");

async function createProblem({ id, title, statement, difficulty, sampleInput, sampleOutput, timeLimitMs, memoryLimitMb, tags, constraints, functionWrapper }) {
  const problemId = String(id || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")).trim();

  await query(
    `INSERT INTO problems (id, title, statement, difficulty, sample_input, sample_output, time_limit_ms, memory_limit_mb, is_active)
     VALUES (:problemId, :title, :statement, :difficulty, :sampleInput, :sampleOutput, :timeLimitMs, :memoryLimitMb, 1)`,
    {
      problemId,
      title: String(title).trim(),
      statement: String(statement).trim(),
      difficulty: difficulty || "Easy",
      sampleInput: sampleInput || null,
      sampleOutput: sampleOutput || null,
      timeLimitMs: Number(timeLimitMs) || 1000,
      memoryLimitMb: Number(memoryLimitMb) || 256,
    }
  );

  if (Array.isArray(tags)) {
    for (const tag of tags) {
      await query("INSERT IGNORE INTO problem_tags (problem_id, tag) VALUES (:problemId, :tag)", { problemId, tag });
    }
  }

  if (Array.isArray(constraints)) {
    for (let i = 0; i < constraints.length; i += 1) {
      await query(
        `INSERT INTO problem_constraints (problem_id, constraint_text, sort_order)
         VALUES (:problemId, :text, :sortOrder)`,
        { problemId, text: constraints[i], sortOrder: i }
      );
    }
  }

  if (functionWrapper) {
    await query(
      `INSERT INTO problem_function_metadata (problem_id, function_name, return_type, parameters_json, languages_json)
       VALUES (:problemId, :functionName, :returnType, :parameters, :languages)`,
      {
        problemId,
        functionName: functionWrapper.functionName,
        returnType: functionWrapper.returnType,
        parameters: JSON.stringify(functionWrapper.parameters),
        languages: JSON.stringify(functionWrapper.languages),
      }
    );
  }

  return { id: problemId, title };
}

async function updateProblem(problemId, { title, statement, difficulty, sampleInput, sampleOutput, timeLimitMs, memoryLimitMb, isActive }) {
  const fields = [];
  const params = { problemId };

  if (title !== undefined) { fields.push("title = :title"); params.title = String(title).trim(); }
  if (statement !== undefined) { fields.push("statement = :statement"); params.statement = String(statement).trim(); }
  if (difficulty !== undefined) { fields.push("difficulty = :difficulty"); params.difficulty = difficulty; }
  if (sampleInput !== undefined) { fields.push("sample_input = :sampleInput"); params.sampleInput = sampleInput; }
  if (sampleOutput !== undefined) { fields.push("sample_output = :sampleOutput"); params.sampleOutput = sampleOutput; }
  if (timeLimitMs !== undefined) { fields.push("time_limit_ms = :timeLimitMs"); params.timeLimitMs = Number(timeLimitMs); }
  if (memoryLimitMb !== undefined) { fields.push("memory_limit_mb = :memoryLimitMb"); params.memoryLimitMb = Number(memoryLimitMb); }
  if (isActive !== undefined) { fields.push("is_active = :isActive"); params.isActive = isActive ? 1 : 0; }

  if (fields.length > 0) {
    await query(`UPDATE problems SET ${fields.join(", ")} WHERE id = :problemId`, params);
  }

  return { id: problemId };
}

async function deleteProblem(problemId) {
  await query("UPDATE problems SET is_active = 0 WHERE id = :problemId", { problemId });
  return { status: "success", message: `Problem ${problemId} deactivated` };
}

async function upsertTestCases(problemId, { sample = [], hidden = [] }) {
  await query("DELETE FROM test_cases WHERE problem_id = :problemId", { problemId });

  let order = 0;
  for (const tc of sample) {
    await query(
      `INSERT INTO test_cases (problem_id, input_text, expected_output, is_sample, sort_order)
       VALUES (:problemId, :inputText, :expectedOutput, 1, :sortOrder)`,
      { problemId, inputText: tc.input, expectedOutput: tc.expected, sortOrder: order++ }
    );
  }

  for (const tc of hidden) {
    await query(
      `INSERT INTO test_cases (problem_id, input_text, expected_output, is_sample, sort_order)
       VALUES (:problemId, :inputText, :expectedOutput, 0, :sortOrder)`,
      { problemId, inputText: tc.input, expectedOutput: tc.expected, sortOrder: order++ }
    );
  }

  return { status: "success", sampleCount: sample.length, hiddenCount: hidden.length };
}

module.exports = {
  createProblem,
  updateProblem,
  deleteProblem,
  upsertTestCases,
};
