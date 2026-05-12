import { prisma } from "../config/db";
import { ApiError } from "../utils/api-error";
import { createAuditEvent } from "./audit.service";
import { JwtPayload } from "../types/auth.types";

export async function suspendUser(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { status: "suspended" },
  });
}

export async function unlockUser(params: {
  actor: JwtPayload;
  targetUserId: string;
  justification: string;
  correlationId?: string;
  ipAddress?: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.targetUserId },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await prisma.user.update({
    where: { id: params.targetUserId },
    data: { status: "active" },
  });

  await createAuditEvent({
    eventType: "USER_ACCOUNT_UNLOCKED",
    severity: "high",
    actorUserId: params.actor.userId,
    actorRole: params.actor.role,
    targetResourceType: "user",
    targetResourceId: params.targetUserId,
    department: params.actor.department,
    justification: params.justification,
    correlationId: params.correlationId,
    ipAddress: params.ipAddress,
  });

  return {
    id: user.id,
    email: user.email,
    status: "active",
  };
}