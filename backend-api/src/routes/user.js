import { Router } from "express";
import * as userController from "../controllers/userController.js";
import { authMiddleware, userOnly } from "../middleware/auth.js";

const router = Router();

router.get("/balance", authMiddleware, userOnly, userController.getBalance);
router.post("/deposit", authMiddleware, userOnly, userController.deposit);
router.get("/tasks/status", authMiddleware, userOnly, userController.getTaskStatus);
router.get("/tasks/activity", authMiddleware, userOnly, userController.getTaskActivities);
router.post("/tasks/open", authMiddleware, userOnly, userController.openTask);
router.post("/tasks/complete", authMiddleware, userOnly, userController.completeTask);

export default router;
