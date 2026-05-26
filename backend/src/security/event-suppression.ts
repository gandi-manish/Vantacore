import { prisma } from "../config/db";

export function buildEventFingerprint(params: {
  eventType: string;
  actorUserId?: string | null;
  targetResourceType?: string | null;
  targetResourceId?: string | null;
  ipAddress?: string | null;
}) {
  return [
    params.eventType,
    params.actorUserId || "unknown_actor",
    params.targetResourceType || "unknown_resource_type",
    params.targetResourceId || "unknown_resource",
    params.ipAddress || "unknown_ip",
  ].join(":");
}

export async function shouldSuppressEvent(params: {
  eventType: string;
  actorUserId?: string | null;
  targetResourceType?: string | null;
  targetResourceId?: string | null;
  ipAddress?: string | null;
  windowMinutes?: number;
}) {
  const windowMinutes = params.windowMinutes ?? 5;
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);

  const duplicate = await prisma.auditEvent.findFirst({
    where: {
      eventType: params.eventType,
      actorUserId: params.actorUserId || undefined,
      targetResourceType: params.targetResourceType || undefined,
      targetResourceId: params.targetResourceId || undefined,
      ipAddress: params.ipAddress || undefined,
      createdAt: {
        gte: since,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return Boolean(duplicate);
}