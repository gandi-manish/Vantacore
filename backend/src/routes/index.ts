import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import adminRoutes from "./admin.routes";
import fileRoutes from "./file.routes";
import socRoutes from "./soc.routes";
import socIncidentRoutes from "./soc-incident.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);
router.use("/files", fileRoutes);
router.use("/soc", socRoutes);
router.use("/soc/incidents", socIncidentRoutes);

export default router;