const submissionsService = require("../services/submissions.service");

async function submit(req, res, next) {
  try {
    const { problemId, code, language = "cpp", mode = "submit" } = req.body;

    const supportedLanguages = new Set(["cpp", "python", "java", "js"]);
    const supportedModes = new Set(["run", "submit"]);

    if (!problemId || typeof code !== "string") {
      return res.status(400).json({
        status: "error",
        message: "problemId and code are required",
      });
    }

    if (!/^[a-z0-9-]{1,64}$/.test(problemId)) {
      return res.status(400).json({ status: "error", message: "Invalid problemId" });
    }
    if (code.trim().length === 0 || code.length > 100_000) {
      return res.status(400).json({ status: "error", message: "Code must contain at most 100,000 characters" });
    }
    if (!supportedLanguages.has(language) || !supportedModes.has(mode)) {
      return res.status(400).json({ status: "error", message: "Unsupported language or submission mode" });
    }

    const result = await submissionsService.submitCode({
      userId: req.user?.id,
      problemId,
      code,
      language,
      mode,
    });

    return res.json(result);
  } catch (error) {
    if (error.status) return next(error);
    return res.status(500).json({
      status: "error",
      message: error.message || "Judge execution failed",
    });
  }
}

async function runCustom(req, res, next) {
  try {
    const { problemId, code, language = "cpp", testCases } = req.body;
    const supportedLanguages = new Set(["cpp", "python", "java", "js"]);

    if (!problemId || typeof code !== "string" || !Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({ status: "error", message: "problemId, code, and at least one custom testcase are required" });
    }
    if (!/^[a-z0-9-]{1,64}$/.test(problemId) || code.trim().length === 0 || code.length > 100_000 || !supportedLanguages.has(language)) {
      return res.status(400).json({ status: "error", message: "Invalid custom run request" });
    }
    if (testCases.length > 10 || testCases.some((testCase) => typeof testCase.input !== "string" || typeof testCase.expected !== "string" || testCase.input.length > 20_000 || testCase.expected.length > 20_000)) {
      return res.status(400).json({ status: "error", message: "Use at most 10 custom testcases with input and expected output under 20,000 characters" });
    }

    const result = await submissionsService.runCustomCode({ problemId, code, language, testCases });
    return res.json(result);
  } catch (error) {
    if (error.status) return next(error);
    return res.status(500).json({ status: "error", message: error.message || "Custom run failed" });
  }
}

async function getSubmission(req, res, next) {
  try {
    const submission = await submissionsService.getSubmissionById(req.params.id, req.user.id);
    if (!submission) {
      return res.status(404).json({ status: "error", message: "Submission not found" });
    }
    return res.json(submission);
  } catch (error) {
    return next(error);
  }
}

async function listMySubmissions(req, res, next) {
  try {
    const submissions = await submissionsService.listUserSubmissions(req.user.id, {
      problemId: req.query.problemId,
      limit: req.query.limit,
    });
    return res.json({ submissions });
  } catch (error) {
    return next(error);
  }
}

module.exports = { submit, runCustom, getSubmission, listMySubmissions };
