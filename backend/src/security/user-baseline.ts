import { prisma } from "../config/db";

export interface UserBaseline {
  actorUserId: string;
  recentDownloadCount: number;
  recentLoginCount: number;
  recentIpAddresses: string[];
  recentDepartments: string[];
  hasMultipleIps: boolean;
  hasHighDownloadVolume: boolean;
}

export async function buildUserBaseline(params: {
  actorUserId: string;
  windowMinutes?: number;
}): Promise<UserBaseline> {
  const windowMinutes = params.windowMinutes ?? 60;
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);

  const recentEvents = await prisma.auditEvent.findMany({
    where: {
      actorUserId: params.actorUserId,
      createdAt: {
        gte: since,
      },
    },
    select: {
      eventType: true,
      ipAddress: true,
      department: true,
    },
  });

  const recentDownloadCount = recentEvents.filter((event) =>
    event.eventType.startsWith("FILE_DOWNLOAD")
  ).length;

  const recentLoginCount = recentEvents.filter(
    (event) => event.eventType === "LOGIN_SUCCESS"
  ).length;

  const recentIpAddresses = Array.from(
    new Set(
      recentEvents
        .map((event) => event.ipAddress)
        .filter((ip): ip is string => Boolean(ip))
    )
  );

  const recentDepartments = Array.from(
    new Set(
      recentEvents
        .map((event) => event.department)
        .filter((department): department is string => Boolean(department))
    )
  );

  return {
    actorUserId: params.actorUserId,
    recentDownloadCount,
    recentLoginCount,
    recentIpAddresses,
    recentDepartments,
    hasMultipleIps: recentIpAddresses.length > 1,
    hasHighDownloadVolume: recentDownloadCount >= 10,
  };
}