const adminService = require("../services/admin.service");

async function createProblem(req, res, next) {
  try {
    const { title, statement } = req.body;
    if (!title || !statement) {
      return res.status(400).json({ status: "error", message: "Title and statement are required" });
    }
    const result = await adminService.createProblem(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

async function updateProblem(req, res, next) {
  try {
    const { id } = req.params;
    const result = await adminService.updateProblem(id, req.body);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

async function deleteProblem(req, res, next) {
  try {
    const { id } = req.params;
    const result = await adminService.deleteProblem(id);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

async function updateTestCases(req, res, next) {
  try {
    const { id } = req.params;
    const result = await adminService.upsertTestCases(id, req.body);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = { createProblem, updateProblem, deleteProblem, updateTestCases };
