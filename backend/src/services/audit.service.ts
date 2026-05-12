import { prisma } from "../config/db";
import { logger } from "../config/logger";

interface AuditEventInput {
  eventType: string;
  severity: "low" | "medium" | "high" | "critical";
  actorUserId?: string;
  actorRole?: string;
  targetResourceType?: string;
  targetResourceId?: string;
  department?: string;
  justification?: string;
  correlationId?: string;
  ipAddress?: string;
}

export async function createAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        eventType: input.eventType,
        severity: input.severity,
        actorUserId: input.actorUserId,
        actorRole: input.actorRole,
        targetResourceType: input.targetResourceType,
        targetResourceId: input.targetResourceId,
        department: input.department,
        justification: input.justification,
        correlationId: input.correlationId || "system-generated",
        ipAddress: input.ipAddress,
      },
    });

    logger.info("Audit event created", {
      eventType: input.eventType,
      severity: input.severity,
      actorUserId: input.actorUserId,
      targetResourceType: input.targetResourceType,
      targetResourceId: input.targetResourceId,
    });
  } catch (error) {
    logger.error("Failed to create audit event", {
      error: error instanceof Error ? error.message : error,
      eventType: input.eventType,
    });
  }
}