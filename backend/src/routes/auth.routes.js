const express = require("express");
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/signin", authController.signin);
router.post("/google", authController.googleAuth);
router.get("/me", authenticate, authController.me);

module.exports = router;
