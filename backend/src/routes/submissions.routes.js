const express = require("express");
const submissionsController = require("../controllers/submissions.controller");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");
const { createRateLimiter } = require("../middleware/security");

const router = express.Router();

router.post(
  "/",
  createRateLimiter({ windowMs: 60 * 1000, max: 12, message: "Too many submissions. Please wait a minute." }),
  optionalAuthenticate,
  submissionsController.submit
);
router.post(
  "/custom-run",
  createRateLimiter({ windowMs: 60 * 1000, max: 12, message: "Too many custom runs. Please wait a minute." }),
  optionalAuthenticate,
  submissionsController.runCustom
);
router.get("/me", authenticate, submissionsController.listMySubmissions);
router.get("/:id", authenticate, submissionsController.getSubmission);

module.exports = router;
