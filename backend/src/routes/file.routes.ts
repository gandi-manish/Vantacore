import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import {
  completeUpload,
  downloadFile,
  initiateUpload,
  flagFile,
  restrictFile,
} from "../controllers/file.controller";


const router = Router();

router.post("/upload/initiate", requireAuth, initiateUpload);
router.post("/upload/complete", requireAuth, completeUpload);
router.post("/download", requireAuth, downloadFile);
router.post("/:fileId/flag", requireAuth, requireRole("admin", "security_analyst"), flagFile);
router.post("/:fileId/restrict", requireAuth, requireRole("admin", "security_analyst"), restrictFile);

export default router;