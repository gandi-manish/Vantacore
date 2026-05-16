import { Router } from "express";
import { getAdminOnly } from "../controllers/admin.controller";
import {
  containUserIpAddress,
  lockUserAccount,
  unlockUserAccount,
} from "../controllers/user-admin.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../policies/role.policy";

const router = Router();

router.use(requireAuth);
router.use(requireRole("admin", "security_analyst"));

router.get("/panel", getAdminOnly);

router.post("/users/:userId/lock", lockUserAccount);
router.post("/users/:userId/unlock", unlockUserAccount);
router.post("/users/:userId/contain-ip", containUserIpAddress);

export default router;