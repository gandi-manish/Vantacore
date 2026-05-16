import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/api-error";
import { containUserIp, lockUser, unlockUser } from "../services/user.service";

const justificationSchema = z.object({
  justification: z.string().min(10).max(500),
});

const containIpSchema = z.object({
  ipAddress: z.string().min(3).max(100),
  justification: z.string().min(10).max(500),
});

function getUserIdParam(req: Request): string {
  const userId = req.params.userId;

  if (!userId || Array.isArray(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  return userId;
}

export const lockUserAccount = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const targetUserId = getUserIdParam(req);
    const parsed = justificationSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ApiError(400, "Invalid lock payload", parsed.error.flatten());
    }

    const result = await lockUser({
      actor: req.user,
      targetUserId,
      justification: parsed.data.justification,
      correlationId: req.correlationId,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "User account locked successfully",
      data: result,
    });
  }
);

export const unlockUserAccount = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const targetUserId = getUserIdParam(req);
    const parsed = justificationSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ApiError(400, "Invalid unlock payload", parsed.error.flatten());
    }

    const result = await unlockUser({
      actor: req.user,
      targetUserId,
      justification: parsed.data.justification,
      correlationId: req.correlationId,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "User account unlocked successfully",
      data: result,
    });
  }
);

export const containUserIpAddress = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const targetUserId = getUserIdParam(req);
    const parsed = containIpSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ApiError(
        400,
        "Invalid IP containment payload",
        parsed.error.flatten()
      );
    }

    const result = await containUserIp({
      actor: req.user,
      targetUserId,
      targetIpAddress: parsed.data.ipAddress,
      justification: parsed.data.justification,
      correlationId: req.correlationId,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "IP containment executed successfully",
      data: result,
    });
  }
);