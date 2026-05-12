import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  completeUpload,
  downloadFile,
  initiateUpload,
} from "../controllers/file.controller";

const router = Router();

router.post("/upload/initiate", requireAuth, initiateUpload);
router.post("/upload/complete", requireAuth, completeUpload);
router.post("/download", requireAuth, downloadFile);

export default router;