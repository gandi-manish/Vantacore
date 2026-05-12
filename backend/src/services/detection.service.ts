import { prisma } from "../config/db";

export async function detectDownloadSpike(params: {
  userId: string;
  windowMinutes?: number;
  threshold?: number;
}): Promise<{ isSpike: boolean; count: number }> {
  const { userId, windowMinutes = 1, threshold = 5 } = params;

  const since = new Date(Date.now() - windowMinutes * 60 * 1000);

  const count = await prisma.auditEvent.count({
    where: {
      actorUserId: userId,
      eventType: {
        in: [
          "FILE_DOWNLOAD_REQUESTED",
          "FILE_DOWNLOAD_SECURITY_OVERRIDE",
        ],
      },
      createdAt: { gte: since },
    },
  });

  return { isSpike: count >= threshold, count };
}

export async function detectEscalationRisk(params: {
  userId: string;
  windowMinutes?: number;
  threshold?: number;
}): Promise<{ shouldLock: boolean; count: number }> {
  const { userId, windowMinutes = 10, threshold = 3 } = params;

  const since = new Date(Date.now() - windowMinutes * 60 * 1000);

  const count = await prisma.auditEvent.count({
    where: {
      actorUserId: userId,
      severity: {
        in: ["high", "critical"],
      },
      createdAt: { gte: since },
    },
  });

  return {
    shouldLock: count >= threshold,
    count,
  };
}