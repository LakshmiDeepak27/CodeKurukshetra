const submissionsService = require("../services/submissions.service");

async function submit(req, res, next) {
  try {
    const { problemId, code, language = "cpp", mode = "submit" } = req.body;

    if (!problemId || typeof code !== "string") {
      return res.status(400).json({
        status: "error",
        message: "problemId and code are required",
      });
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

module.exports = { submit, getSubmission, listMySubmissions };
