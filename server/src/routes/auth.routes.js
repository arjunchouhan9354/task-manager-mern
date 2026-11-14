const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const env = require("../config/env");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");
const { registerSchema, loginSchema } = require("../validation/schemas");
const {
  register,
  login,
  logout,
  getMe,
} = require("../controllers/auth.controller");

// Brute-force protection for login/register: 20 attempts per 15 minutes per IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skip: () => env.isTest,
  handler: (req, res) =>
    res
      .status(429)
      .json({
        error: true,
        status: 429,
        message: "Too many attempts. Please try again in a few minutes.",
      }),
});

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);

module.exports = router;
