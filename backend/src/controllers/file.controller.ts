import { Request, Response } from "express";
import { prisma } from "../config/db";
import { z } from "zod";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/api-error";
import {
  completeFileUpload,
  flagFileForInvestigation,
  initiateFileUpload,
  requestFileDownload,
  restrictFileAccess,
} from "../services/file.service";

const initiateUploadSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes: z.number().positive(),
  sensitivityLevel: z.string().optional(),
});

const completeUploadSchema = z.object({
  fileId: z.string().uuid(),
});

const downloadFileSchema = z.object({
  fileId: z.string().uuid(),
  justification: z.string().optional(),
  incidentId: z.string().uuid().optional(),
});

const fileActionSchema = z.object({
  justification: z.string().min(10).max(500),
});

function getFileIdParam(req: Request): string {
  const fileId = req.params.fileId;

  if (!fileId || Array.isArray(fileId)) {
    throw new ApiError(400, "Invalid file ID");
  }

  return fileId;
}

export const initiateUpload = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const parsed = initiateUploadSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ApiError(
        400,
        "Invalid upload initiation payload",
        parsed.error.flatten()
      );
    }

    const result = await initiateFileUpload({
      user: req.user,
      input: parsed.data,
      correlationId: req.correlationId,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "File upload initiated successfully",
      data: result,
    });
  }
);

export const completeUpload = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const parsed = completeUploadSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ApiError(
        400,
        "Invalid upload completion payload",
        parsed.error.flatten()
      );
    }

    const result = await completeFileUpload({
      user: req.user,
      input: parsed.data,
      correlationId: req.correlationId,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "File upload completed successfully",
      data: result,
    });
  }
);

export const downloadFile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const parsed = downloadFileSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ApiError(
        400,
        "Invalid file download payload",
        parsed.error.flatten()
      );
    }

    const result = await requestFileDownload({
      user: req.user,
      input: parsed.data,
      correlationId: req.correlationId,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "File download URL generated successfully",
      data: result,
    });
  }
);

export const flagFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  const parsed = fileActionSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(400, "Invalid flag payload", parsed.error.flatten());
  }

  const result = await flagFileForInvestigation({
    user: req.user,
    fileId: getFileIdParam(req),
    justification: parsed.data.justification,
    correlationId: req.correlationId,
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: "File flagged for investigation successfully",
    data: result,
  });
});

export const restrictFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  const parsed = fileActionSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(400, "Invalid restrict payload", parsed.error.flatten());
  }

  const result = await restrictFileAccess({
    user: req.user,
    fileId: getFileIdParam(req),
    justification: parsed.data.justification,
    correlationId: req.correlationId,
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: "File access restricted successfully",
    data: result,
  });
});
export const listFiles = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  const files = await prisma.file.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  res.status(200).json({
    success: true,
    message: "Files retrieved successfully",
    data: files,
  });
});