import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/api-error";
import { unlockUser } from "../services/user.service";

const unlockUserSchema = z.object({
  justification: z.string().min(10).max(500),
});

export const unlockUserAccount = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const userId = req.params.userId;

    if (!userId || Array.isArray(userId)) {
      throw new ApiError(400, "Invalid user ID");
    }

    const parsed = unlockUserSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ApiError(
        400,
        "Invalid unlock payload",
        parsed.error.flatten()
      );
    }

    const result = await unlockUser({
      actor: req.user,
      targetUserId: userId,
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