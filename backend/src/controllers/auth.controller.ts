import { Request, Response } from "express";
import { z } from "zod";
import {
  loginUser,
  logoutUser,
  refreshUserToken,
} from "../services/auth.service";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/api-error";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(10),
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(400, "Invalid login payload", parsed.error.flatten());
  }

  const result = await loginUser(parsed.data, {
    correlationId: req.correlationId,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const parsed = refreshSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(400, "Invalid refresh payload", parsed.error.flatten());
  }

  const result = await refreshUserToken(parsed.data, {
    correlationId: req.correlationId,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    message: "Tokens refreshed successfully",
    data: result,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const parsed = logoutSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(400, "Invalid logout payload", parsed.error.flatten());
  }

  await logoutUser(parsed.data, {
    correlationId: req.correlationId,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    message: "Logout successful. Session revoked.",
  });
});