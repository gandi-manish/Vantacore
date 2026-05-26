import { prisma } from "../config/db";
import { logger } from "../config/logger";
import { shouldSuppressEvent } from "../security/event-suppression";

interface AuditEventInput {
  eventType: string;
  severity: "low" | "medium" | "high" | "critical";
  actorUserId?: string | null;
  actorRole?: string | null;
  targetResourceType?: string | null;
  targetResourceId?: string | null;
  department?: string | null;
  justification?: string | null;
  correlationId?: string | null;
  ipAddress?: string | null;
}

const SUPPRESSIBLE_EVENTS = new Set([
  "FILE_DOWNLOAD_DENIED",
  "FILE_DOWNLOAD_DENIED_RESTRICTED",
  "SECURITY_ALERT_TRIGGERED",
  "RISK_SCORE_EVALUATED",
  "IP_BASED_CONTAINMENT_TRIGGERED",
  "AUTOMATED_CONTAINMENT_TRIGGERED",
  "TARGETED_CONTAINMENT_TRIGGERED",
]);

export async function createAuditEvent(
  input: AuditEventInput
): Promise<void> {
  try {
    if (SUPPRESSIBLE_EVENTS.has(input.eventType)) {
      const shouldSuppress = await shouldSuppressEvent({
        eventType: input.eventType,
        actorUserId: input.actorUserId,
        targetResourceType: input.targetResourceType,
        targetResourceId: input.targetResourceId,
        ipAddress: input.ipAddress,
        windowMinutes: 5,
      });

      if (shouldSuppress) {
        logger.info("Audit event suppressed", {
          eventType: input.eventType,
          actorUserId: input.actorUserId,
          targetResourceType: input.targetResourceType,
          targetResourceId: input.targetResourceId,
          ipAddress: input.ipAddress,
        });

        return;
      }
    }

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