import { Router } from "express";
import { getAdminOnly } from "../controllers/admin.controller";
import { unlockUserAccount } from "../controllers/user-admin.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../policies/role.policy";

const router = Router();

router.get("/panel", requireAuth, requireRole("admin"), getAdminOnly);

router.post(
  "/users/:userId/unlock",
  requireAuth,
  requireRole("admin", "security_analyst"),
  unlockUserAccount
);

export default router;