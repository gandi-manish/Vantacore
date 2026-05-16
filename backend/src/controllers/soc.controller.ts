import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/api-error";
import {
  getContainmentActions,
  getRecentAlerts,
  getRiskyFiles,
  getSocIncidents,
  getSocSummary,
  getSuspendedUsers,
  getTopRiskUsers,
  getUserTimeline,
} from "../services/soc.service";

const userIdParamSchema = z.object({
  userId: z.string().uuid(),
});

export const socSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await getSocSummary();

  res.status(200).json({
    success: true,
    message: "SOC summary fetched successfully",
    data: summary,
  });
});

export const recentAlerts = asyncHandler(async (_req: Request, res: Response) => {
  const alerts = await getRecentAlerts();

  res.status(200).json({
    success: true,
    message: "Recent SOC alerts fetched successfully",
    data: alerts,
  });
});

export const suspendedUsers = asyncHandler(
  async (_req: Request, res: Response) => {
    const users = await getSuspendedUsers();

    res.status(200).json({
      success: true,
      message: "Suspended users fetched successfully",
      data: users,
    });
  }
);

export const userTimeline = asyncHandler(async (req: Request, res: Response) => {
  const parsed = userIdParamSchema.safeParse(req.params);

  if (!parsed.success) {
    throw new ApiError(400, "Invalid user ID", parsed.error.flatten());
  }

  const timeline = await getUserTimeline(parsed.data.userId);

  res.status(200).json({
    success: true,
    message: "User security timeline fetched successfully",
    data: timeline,
  });
});

export const containmentActions = asyncHandler(
  async (_req: Request, res: Response) => {
    const actions = await getContainmentActions();

    res.status(200).json({
      success: true,
      message: "SOC containment actions fetched successfully",
      data: actions,
    });
  }
);

export const riskyFiles = asyncHandler(async (_req: Request, res: Response) => {
  const files = await getRiskyFiles();

  res.status(200).json({
    success: true,
    message: "Risky files fetched successfully",
    data: files,
  });
});

export const socIncidents = asyncHandler(async (_req: Request, res: Response) => {
  const incidents = await getSocIncidents();

  res.status(200).json({
    success: true,
    message: "SOC incidents fetched successfully",
    data: incidents,
  });
});

export const topRiskUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await getTopRiskUsers(5);

  res.status(200).json({
    success: true,
    message: "Top risk users fetched successfully",
    data: users,
  });
});