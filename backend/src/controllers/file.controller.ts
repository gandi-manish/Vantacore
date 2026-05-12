import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/api-error";
import {
  completeFileUpload,
  initiateFileUpload,
  requestFileDownload,
} from "../services/file.service";

const initiateUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(255),
  sizeBytes: z.number().positive(),
  sensitivityLevel: z.string().min(1).max(50).optional(),
});

const completeUploadSchema = z.object({
  fileId: z.string().uuid(),
});

const downloadFileSchema = z.object({
  fileId: z.string().uuid(),
  justification: z.string().min(10).max(500).optional(),
});

export const initiateUpload = asyncHandler(async (req: Request, res: Response) => {
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
});

export const completeUpload = asyncHandler(async (req: Request, res: Response) => {
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
});

export const downloadFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  const parsed = downloadFileSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(
      400,
      "Invalid download payload",
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
});