const express = require("express");
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth");
const { createRateLimiter } = require("../middleware/security");

const router = express.Router();

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many authentication attempts. Please try again in a few minutes.",
});

router.post("/signup", authLimiter, authController.signup);
router.post("/signin", authLimiter, authController.signin);
router.post("/google", authLimiter, authController.googleAuth);
router.get("/me", authenticate, authController.me);

module.exports = router;
