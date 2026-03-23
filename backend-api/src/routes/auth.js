import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { authMiddleware, attachUser } from "../middleware/auth.js";
import { createAuthRateLimiter } from "../middleware/rateLimitAuth.js";

const router = Router();
const loginLimit = createAuthRateLimiter({ keyPrefix: "login", max: 5, windowMs: 60_000 });
const registerLimit = createAuthRateLimiter({ keyPrefix: "register", max: 5, windowMs: 60_000 });
const refreshLimit = createAuthRateLimiter({ keyPrefix: "refresh", max: 30, windowMs: 60_000 });

router.post("/register", registerLimit, authController.register);
router.post("/register-admin", registerLimit, authController.registerAdmin);
router.post("/login", loginLimit, authController.login);
router.post("/refresh", refreshLimit, authController.refresh);
router.get("/me", authMiddleware, attachUser, authController.me);
router.post("/change-password", authMiddleware, attachUser, authController.changePassword);
router.post("/forgot-password", authController.forgotPassword);

export default router;
