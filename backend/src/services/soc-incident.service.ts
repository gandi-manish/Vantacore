import { prisma } from "../config/db";

type IncidentSeverity = "low" | "medium" | "high" | "critical";

function buildIncidentFingerprint(params: {
  actorUserId?: string | null;
  targetResourceId?: string | null;
  ipAddress?: string | null;
  threatPattern?: string | null;
}) {
  return [
    params.actorUserId || "unknown_actor",
    params.targetResourceId || "unknown_target",
    params.ipAddress || "unknown_ip",
    params.threatPattern || "unknown_pattern",
  ].join(":");
}

export async function upsertSocIncident(params: {
  title: string;
  severity: IncidentSeverity;
  status?: string;
  actorUserId?: string | null;
  actorRole?: string | null;
  department?: string | null;
  targetResourceId?: string | null;
  targetResourceType?: string | null;
  ipAddress?: string | null;
  threatPattern?: string | null;
  confidence?: number | null;
  summary?: string | null;
  windowMinutes?: number;
}) {
  const windowMinutes = params.windowMinutes ?? 10;
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);

  const existingIncident = await prisma.socIncident.findFirst({
  where: {
    actorUserId: params.actorUserId || undefined,
    targetResourceId: params.targetResourceId || undefined,
    ipAddress: params.ipAddress || undefined,
    threatPattern: params.threatPattern || undefined,
    status: {
      in: ["open", "investigating", "contained"],
    },
    lastSeen: {
      gte: since,
    },
  },
  orderBy: {
    lastSeen: "desc",
  },
});

  if (existingIncident) {
    return prisma.socIncident.update({
      where: {
        id: existingIncident.id,
      },
      data: {
        severity:
          existingIncident.severity === "critical"
            ? existingIncident.severity
            : params.severity,
        status: params.status || existingIncident.status,
        eventCount: {
          increment: 1,
        },
        lastSeen: new Date(),
        summary: params.summary || existingIncident.summary,
        confidence: params.confidence ?? existingIncident.confidence,
      },
    });
  }

  return prisma.socIncident.create({
    data: {
      title: params.title,
      severity: params.severity,
      status: params.status || "open",
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      department: params.department,
      targetResourceId: params.targetResourceId,
      targetResourceType: params.targetResourceType,
      ipAddress: params.ipAddress,
      threatPattern: params.threatPattern,
      confidence: params.confidence,
      summary: params.summary,
      firstSeen: new Date(),
      lastSeen: new Date(),
    },
  });
}