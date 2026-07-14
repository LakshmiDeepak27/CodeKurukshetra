const express = require("express");
const submissionsController = require("../controllers/submissions.controller");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/", optionalAuthenticate, submissionsController.submit);
router.get("/me", authenticate, submissionsController.listMySubmissions);
router.get("/:id", authenticate, submissionsController.getSubmission);

module.exports = router;
