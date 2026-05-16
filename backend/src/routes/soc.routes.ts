import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../policies/role.policy";
import {
  containmentActions,
  recentAlerts,
  riskyFiles,
  socIncidents,
  socSummary,
  suspendedUsers,
  topRiskUsers,
  userTimeline,
} from "../controllers/soc.controller";

const router = Router();

router.use(requireAuth);
router.use(requireRole("admin", "security_analyst", "auditor"));

router.get("/summary", socSummary);
router.get("/alerts", recentAlerts);
router.get("/incidents", socIncidents);
router.get("/containment-actions", containmentActions);
router.get("/files/risky", riskyFiles);
router.get("/users/risk", topRiskUsers);
router.get("/users/suspended", suspendedUsers);
router.get("/users/:userId/timeline", userTimeline);

export default router;