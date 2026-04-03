import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import { authMiddleware, adminOnly, superAdminOnly, requireAdminPermission } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware, adminOnly);

router.get("/stats", adminController.getStats);
router.get("/users", adminController.getUsers);
router.get("/pending", adminController.getPendingUsers);
router.patch("/users/:id/approve", requireAdminPermission("approve_only"), adminController.approveUser);
router.patch("/users/:id/reject", requireAdminPermission("approve_only"), adminController.rejectUser);
router.patch("/users/:id/balance", requireAdminPermission("balance_only"), adminController.updateUserBalance);
router.patch("/users/:id/tasks/assign", requireAdminPermission("balance_only"), adminController.assignUserTasks);
router.patch(
  "/users/:id/tasks/assign-with-prime",
  requireAdminPermission("balance_only"),
  adminController.assignTasksWithPrime,
);
router.patch("/users/:id/tasks/prime", requireAdminPermission("balance_only"), adminController.assignPrimeOrders);
router.post("/users/:id/assign-prime-order", requireAdminPermission("balance_only"), adminController.assignSinglePrimeOrder);
router.delete("/users/:id", requireAdminPermission("balance_only"), adminController.deleteUser);

// Super admin only routes for managing admin accounts and roles.
router.get("/admins", superAdminOnly, adminController.getAdmins);
router.post("/admins", superAdminOnly, adminController.createAdmin);
router.patch("/admins/:id", superAdminOnly, adminController.updateAdmin);

export default router;
