const problemsService = require("../services/problems.service");

async function listProblems(_req, res, next) {
  try {
    const problems = await problemsService.listProblems();
    return res.json({ problems });
  } catch (error) {
    return next(error);
  }
}

async function getProblem(req, res, next) {
  try {
    const problem = await problemsService.getProblemById(req.params.id);
    if (!problem) {
      return res.status(404).json({ status: "error", message: "Problem not found" });
    }
    return res.json(problem);
  } catch (error) {
    return next(error);
  }
}

async function getTestCases(req, res, next) {
  try {
    const problem = await problemsService.getProblemById(req.params.id);
    if (!problem) {
      return res.status(404).json({ status: "error", message: "Test cases not found" });
    }
    const sample = await problemsService.getSampleTestCases(req.params.id);
    return res.json({ sample });
  } catch (error) {
    return next(error);
  }
}

async function voteProblem(req, res, next) {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const stats = await problemsService.voteProblem(id, type);
    return res.json(stats);
  } catch (error) {
    return next(error);
  }
}

async function addComment(req, res, next) {
  try {
    const { id } = req.params;
    const { author, text } = req.body;
    const stats = await problemsService.addComment(id, author, text);
    return res.json(stats);
  } catch (error) {
    return next(error);
  }
}

module.exports = { listProblems, getProblem, getTestCases, voteProblem, addComment };
