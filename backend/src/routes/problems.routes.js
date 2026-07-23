const express = require("express");
const problemsController = require("../controllers/problems.controller");
const { authenticate } = require("../middleware/auth");
const { createRateLimiter } = require("../middleware/security");

const voteLimiter = createRateLimiter({ windowMs: 60_000, max: 20, message: "Slow down." });
const commentLimiter = createRateLimiter({ windowMs: 60_000, max: 5, message: "Slow down." });

const router = express.Router();

router.get("/", problemsController.listProblems);
router.get("/:id", problemsController.getProblem);
router.get("/:id/testcases", problemsController.getTestCases);
router.post("/:id/vote", authenticate, voteLimiter, problemsController.voteProblem);
router.post("/:id/comments", authenticate, commentLimiter, problemsController.addComment);

module.exports = router;
