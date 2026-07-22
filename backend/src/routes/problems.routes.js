const express = require("express");
const problemsController = require("../controllers/problems.controller");

const router = express.Router();

router.get("/", problemsController.listProblems);
router.get("/:id", problemsController.getProblem);
router.get("/:id/testcases", problemsController.getTestCases);
router.post("/:id/vote", problemsController.voteProblem);
router.post("/:id/comments", problemsController.addComment);

module.exports = router;
