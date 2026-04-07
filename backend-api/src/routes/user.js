import { Router } from "express";
import * as userController from "../controllers/userController.js";
import { authMiddleware, userOnly } from "../middleware/auth.js";

const router = Router();

router.get("/balance", authMiddleware, userOnly, userController.getBalance);
router.get("/credit-score", authMiddleware, userOnly, userController.getCreditScore);
router.post("/deposit", authMiddleware, userOnly, userController.deposit);
router.get("/tasks/status", authMiddleware, userOnly, userController.getTaskStatus);
router.get("/tasks/activity", authMiddleware, userOnly, userController.getTaskActivities);
router.post("/activity-log", authMiddleware, userOnly, userController.postActivityLog);
router.post("/tasks/open", authMiddleware, userOnly, userController.openTask);
router.post("/tasks/complete", authMiddleware, userOnly, userController.completeTask);
router.get("/wallet-card", authMiddleware, userOnly, userController.getWalletCard);
router.post("/wallet-card", authMiddleware, userOnly, userController.upsertWalletCard);
router.post("/wallet-card/unlink", authMiddleware, userOnly, userController.unlinkWalletCard);
router.get("/withdrawal", authMiddleware, userOnly, userController.getWithdrawalState);
router.post("/withdrawal", authMiddleware, userOnly, userController.requestWithdrawal);
router.post("/withdrawal/ack", authMiddleware, userOnly, userController.acknowledgeWithdrawal);

export default router;
