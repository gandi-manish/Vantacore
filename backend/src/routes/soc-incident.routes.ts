import { Router } from "express";
import {
  assignIncidentHandler,
  updateIncidentStatusHandler,
} from "../controllers/soc-incident.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.post(
  "/:incidentId/assign",
  requireAuth,
  requireRole("admin", "security_analyst"),
  assignIncidentHandler
);

router.patch(
  "/:incidentId/status",
  requireAuth,
  requireRole("admin", "security_analyst"),
  updateIncidentStatusHandler
);

export default router;