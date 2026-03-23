import { Router } from "express";
import * as userController from "../controllers/userController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.get("/balance", authMiddleware, userController.getBalance);
router.post("/deposit", authMiddleware, userController.deposit);
router.get("/tasks/status", authMiddleware, userController.getTaskStatus);
router.get("/tasks/activity", authMiddleware, userController.getTaskActivities);
router.post("/tasks/open", authMiddleware, userController.openTask);
router.post("/tasks/complete", authMiddleware, userController.completeTask);

export default router;
