import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "../config/db";
import { ApiError } from "../utils/api-error";
import {
  CompleteUploadInput,
  CompleteUploadResponse,
  DownloadFileInput,
  DownloadFileResponse,
  InitiateUploadInput,
  InitiateUploadResponse,
} from "../types/file.types";
import {
  createPresignedDownloadUrl,
  createPresignedUploadUrl,
  getS3ObjectMetadata,
} from "./s3.service";
import { createAuditEvent } from "./audit.service";
import { JwtPayload } from "../types/auth.types";
import { canDownloadFile } from "../policies/file.policy";
import { detectDownloadSpike } from "./detection.service";
import {
  revokeAllUserSessions,
  revokeUserSessionsByIp,
} from "./session.service";
import { suspendUser } from "./user.service";
import { assessRisk, RiskSignal } from "./risk.service";

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function validateUploadInput(input: InitiateUploadInput): void {
  if (!input.fileName || input.fileName.trim().length < 1) {
    throw new ApiError(400, "File name is required");
  }

  if (!input.contentType || input.contentType.trim().length < 1) {
    throw new ApiError(400, "Content type is required");
  }

  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0) {
    throw new ApiError(400, "File size must be greater than zero");
  }

  if (input.sizeBytes > 10 * 1024 * 1024) {
    throw new ApiError(400, "File size exceeds the 10 MB V1 upload limit");
  }
}

function buildS3Key(user: JwtPayload, fileName: string): string {
  const safeName = sanitizeFileName(path.basename(fileName));
  const uniquePart = randomUUID();

  return `${user.department}/${user.userId}/${uniquePart}-${safeName}`;
}

async function isFileRestricted(fileId: string): Promise<boolean> {
  const restrictedEvent = await prisma.auditEvent.findFirst({
    where: {
      targetResourceType: "file",
      targetResourceId: fileId,
      eventType: "FILE_ACCESS_RESTRICTED",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return Boolean(restrictedEvent);
}

export async function initiateFileUpload(params: {
  user: JwtPayload;
  input: InitiateUploadInput;
  correlationId?: string;
  ipAddress?: string;
}): Promise<InitiateUploadResponse> {
  const { user, input, correlationId, ipAddress } = params;

  validateUploadInput(input);

  const s3Key = buildS3Key(user, input.fileName);

  const fileRecord = await prisma.file.create({
    data: {
      ownerUserId: user.userId,
      fileName: input.fileName,
      s3Key,
      department: user.department,
      sensitivityLevel: input.sensitivityLevel || "internal",
      uploadStatus: "initiated",
    },
  });

  const { uploadUrl, expiresInSeconds } = await createPresignedUploadUrl({
    key: s3Key,
    contentType: input.contentType,
  });

  await createAuditEvent({
    eventType: "FILE_UPLOAD_INITIATED",
    severity: "low",
    actorUserId: user.userId,
    actorRole: user.role,
    targetResourceType: "file",
    targetResourceId: fileRecord.id,
    department: user.department,
    correlationId,
    ipAddress,
  });

  return {
    fileId: fileRecord.id,
    s3Key,
    uploadUrl,
    expiresInSeconds,
  };
}

export async function completeFileUpload(params: {
  user: JwtPayload;
  input: CompleteUploadInput;
  correlationId?: string;
  ipAddress?: string;
}): Promise<CompleteUploadResponse> {
  const { user, input, correlationId, ipAddress } = params;

  const fileRecord = await prisma.file.findUnique({
    where: { id: input.fileId },
  });

  if (!fileRecord) {
    throw new ApiError(404, "File record not found");
  }

  if (fileRecord.ownerUserId !== user.userId) {
    await createAuditEvent({
      eventType: "FILE_UPLOAD_COMPLETE_DENIED",
      severity: "high",
      actorUserId: user.userId,
      actorRole: user.role,
      targetResourceType: "file",
      targetResourceId: fileRecord.id,
      department: user.department,
      correlationId,
      ipAddress,
    });

    throw new ApiError(403, "You are not allowed to complete this upload");
  }

  if (fileRecord.uploadStatus === "completed") {
    throw new ApiError(400, "File upload is already completed");
  }

  const s3Metadata = await getS3ObjectMetadata(fileRecord.s3Key);

  const updatedFile = await prisma.file.update({
    where: { id: fileRecord.id },
    data: {
      uploadStatus: "completed",
    },
  });

  await createAuditEvent({
    eventType: "FILE_UPLOAD_COMPLETED",
    severity: "low",
    actorUserId: user.userId,
    actorRole: user.role,
    targetResourceType: "file",
    targetResourceId: updatedFile.id,
    department: user.department,
    correlationId,
    ipAddress,
  });

  return {
    fileId: updatedFile.id,
    uploadStatus: updatedFile.uploadStatus,
    sizeBytes: s3Metadata.sizeBytes,
    contentType: s3Metadata.contentType,
  };
}

export async function requestFileDownload(params: {
  user: JwtPayload;
  input: DownloadFileInput;
  correlationId?: string;
  ipAddress?: string;
}): Promise<DownloadFileResponse> {
  const { user, input, correlationId, ipAddress } = params;

  const fileRecord = await prisma.file.findUnique({
    where: { id: input.fileId },
  });

  if (!fileRecord) {
    throw new ApiError(404, "File not found");
  }

  const fileRestricted = await isFileRestricted(fileRecord.id);

  if (fileRestricted && user.role !== "security_analyst") {
    await createAuditEvent({
      eventType: "FILE_DOWNLOAD_DENIED_RESTRICTED",
      severity: "high",
      actorUserId: user.userId,
      actorRole: user.role,
      targetResourceType: "file",
      targetResourceId: fileRecord.id,
      department: user.department,
      justification: "Download denied because file access is restricted",
      correlationId,
      ipAddress,
    });

    throw new ApiError(403, "File access is currently restricted");
  }

  if (fileRecord.uploadStatus !== "completed") {
    throw new ApiError(400, "File upload is not completed");
  }

  const decision = canDownloadFile({
    user,
    file: {
      ownerUserId: fileRecord.ownerUserId,
      department: fileRecord.department,
      sensitivityLevel: fileRecord.sensitivityLevel,
    },
    justification: input.justification,
  });

  if (!decision.allowed) {
    await createAuditEvent({
      eventType: "FILE_DOWNLOAD_DENIED",
      severity: decision.severity,
      actorUserId: user.userId,
      actorRole: user.role,
      targetResourceType: "file",
      targetResourceId: fileRecord.id,
      department: user.department,
      justification: input.justification,
      correlationId,
      ipAddress,
    });

    throw new ApiError(403, "You are not allowed to download this file");
  }

  const { downloadUrl, expiresInSeconds } = await createPresignedDownloadUrl({
    key: fileRecord.s3Key,
  });

  await createAuditEvent({
    eventType:
      decision.reason === "security_override_with_justification"
        ? "FILE_DOWNLOAD_SECURITY_OVERRIDE"
        : "FILE_DOWNLOAD_REQUESTED",
    severity: decision.severity,
    actorUserId: user.userId,
    actorRole: user.role,
    targetResourceType: "file",
    targetResourceId: fileRecord.id,
    department: user.department,
    justification: input.justification,
    correlationId,
    ipAddress,
  });

  const spikeCheck = await detectDownloadSpike({
    userId: user.userId,
    windowMinutes: 1,
    threshold: 5,
  });

  if (spikeCheck.isSpike) {
    const riskSignals: RiskSignal[] = ["DOWNLOAD_SPIKE"];

    if (fileRecord.sensitivityLevel === "sensitive") {
      riskSignals.push("SENSITIVE_FILE_ACCESS");
    }

    if (decision.reason === "security_override_with_justification") {
      riskSignals.push("SECURITY_OVERRIDE");
    }

    const risk = assessRisk({
      signals: riskSignals,
    });

    await createAuditEvent({
      eventType: "RISK_SCORE_EVALUATED",
      severity: risk.level,
      actorUserId: user.userId,
      actorRole: user.role,
      targetResourceType: "file",
      targetResourceId: fileRecord.id,
      department: user.department,
      justification: `Risk score ${risk.score}/100. Action: ${risk.recommendedAction}. Reasons: ${risk.reasons.join(", ")}`,
      correlationId,
      ipAddress,
    });

    if (risk.recommendedAction === "ALERT") {
      await createAuditEvent({
        eventType: "SECURITY_ALERT_TRIGGERED",
        severity: risk.level,
        actorUserId: user.userId,
        actorRole: user.role,
        targetResourceType: "user",
        targetResourceId: user.userId,
        department: user.department,
        justification: `Security alert triggered. Risk score ${risk.score}. Reasons: ${risk.reasons.join(", ")}`,
        correlationId,
        ipAddress,
      });
    }

    if (risk.recommendedAction === "CONTAIN_SESSION_OR_IP") {
      const revokedByIpCount = await revokeUserSessionsByIp({
        userId: user.userId,
        ipAddress,
      });

      await createAuditEvent({
        eventType: "IP_BASED_CONTAINMENT_TRIGGERED",
        severity: risk.level,
        actorUserId: user.userId,
        actorRole: user.role,
        targetResourceType: "ip_address",
        targetResourceId: ipAddress || "unknown",
        department: user.department,
        justification: `Risk-based containment triggered. Risk score ${risk.score}. Revoked ${revokedByIpCount} active session(s) from IP ${ipAddress}. Reasons: ${risk.reasons.join(", ")}`,
        correlationId,
        ipAddress,
      });
    }

    if (risk.recommendedAction === "LOCK_USER") {
      await suspendUser(user.userId);
      const revokedCount = await revokeAllUserSessions(user.userId);

      await createAuditEvent({
        eventType: "USER_ACCOUNT_LOCKED",
        severity: risk.level,
        actorUserId: user.userId,
        actorRole: user.role,
        targetResourceType: "user",
        targetResourceId: user.userId,
        department: user.department,
        justification: `Risk-based account lock. Risk score ${risk.score}. Revoked ${revokedCount} active session(s). Reasons: ${risk.reasons.join(", ")}`,
        correlationId,
        ipAddress,
      });
    }
  }

  return {
    fileId: fileRecord.id,
    fileName: fileRecord.fileName,
    downloadUrl,
    expiresInSeconds,
  };
}

export async function flagFileForInvestigation(params: {
  user: JwtPayload;
  fileId: string;
  justification: string;
  correlationId?: string;
  ipAddress?: string;
}) {
  const file = await prisma.file.findUnique({
    where: { id: params.fileId },
  });

  if (!file) {
    throw new ApiError(404, "File not found");
  }

  await createAuditEvent({
    eventType: "FILE_FLAGGED_FOR_INVESTIGATION",
    severity: "high",
    actorUserId: params.user.userId,
    actorRole: params.user.role,
    targetResourceType: "file",
    targetResourceId: file.id,
    department: params.user.department,
    justification: params.justification,
    correlationId: params.correlationId,
    ipAddress: params.ipAddress,
  });

  return {
    fileId: file.id,
    fileName: file.fileName,
    action: "flagged_for_investigation",
  };
}

export async function restrictFileAccess(params: {
  user: JwtPayload;
  fileId: string;
  justification: string;
  correlationId?: string;
  ipAddress?: string;
}) {
  const file = await prisma.file.findUnique({
    where: { id: params.fileId },
  });

  if (!file) {
    throw new ApiError(404, "File not found");
  }

  await createAuditEvent({
    eventType: "FILE_ACCESS_RESTRICTED",
    severity: "critical",
    actorUserId: params.user.userId,
    actorRole: params.user.role,
    targetResourceType: "file",
    targetResourceId: file.id,
    department: params.user.department,
    justification: params.justification,
    correlationId: params.correlationId,
    ipAddress: params.ipAddress,
  });

  return {
    fileId: file.id,
    fileName: file.fileName,
    action: "access_restricted",
  };
}