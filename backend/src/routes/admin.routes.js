const express = require("express");
const adminController = require("../controllers/admin.controller");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, requireAdmin);

router.post("/problems", adminController.createProblem);
router.put("/problems/:id", adminController.updateProblem);
router.delete("/problems/:id", adminController.deleteProblem);
router.post("/problems/:id/testcases", adminController.updateTestCases);

module.exports = router;
