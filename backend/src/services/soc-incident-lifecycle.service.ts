import { prisma } from "../config/db";
import { ApiError } from "../utils/api-error";
import { createAuditEvent } from "./audit.service";
import { JwtPayload } from "../types/auth.types";

type IncidentStatus =
  | "open"
  | "investigating"
  | "contained"
  | "resolved"
  | "false_positive"
  | "escalated";

const ALLOWED_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  open: ["investigating", "escalated", "false_positive"],
  investigating: ["contained", "resolved", "escalated", "false_positive"],
  contained: ["resolved", "escalated"],
  escalated: ["investigating", "contained", "resolved"],
  resolved: [],
  false_positive: [],
};

function isIncidentStatus(value: string): value is IncidentStatus {
  return [
    "open",
    "investigating",
    "contained",
    "resolved",
    "false_positive",
    "escalated",
  ].includes(value);
}

function assertAllowedTransition(
  currentStatus: string,
  nextStatus: IncidentStatus
) {
  if (!isIncidentStatus(currentStatus)) {
    throw new ApiError(400, "Invalid current incident status");
  }

  const allowed = ALLOWED_TRANSITIONS[currentStatus];

  if (!allowed.includes(nextStatus)) {
    throw new ApiError(
      400,
      `Invalid incident transition: ${currentStatus} -> ${nextStatus}`
    );
  }
}

export async function assignIncident(params: {
  user: JwtPayload;
  incidentId: string;
  analystUserId: string;
  correlationId?: string;
  ipAddress?: string;
}) {
  const incident = await prisma.socIncident.findUnique({
    where: { id: params.incidentId },
  });

  if (!incident) {
    throw new ApiError(404, "SOC incident not found");
  }

  if (incident.status === "resolved" || incident.status === "false_positive") {
    throw new ApiError(400, "Closed incidents cannot be assigned");
  }

  const updatedIncident = await prisma.socIncident.update({
    where: { id: params.incidentId },
    data: {
      assignedAnalystId: params.analystUserId,
      status: incident.status === "open" ? "investigating" : incident.status,
      lastUpdatedBy: params.user.userId,
      lastSeen: new Date(),
    },
  });

  await createAuditEvent({
    eventType: "INCIDENT_ASSIGNED",
    severity: "medium",
    actorUserId: params.user.userId,
    actorRole: params.user.role,
    targetResourceType: "soc_incident",
    targetResourceId: params.incidentId,
    department: params.user.department,
    justification: `Incident assigned to analyst ${params.analystUserId}`,
    correlationId: params.correlationId,
    ipAddress: params.ipAddress,
  });

  return updatedIncident;
}

export async function updateIncidentStatus(params: {
  user: JwtPayload;
  incidentId: string;
  status: IncidentStatus;
  note?: string;
  correlationId?: string;
  ipAddress?: string;
}) {
  const incident = await prisma.socIncident.findUnique({
    where: { id: params.incidentId },
  });

  if (!incident) {
    throw new ApiError(404, "SOC incident not found");
  }

  assertAllowedTransition(incident.status, params.status);

  if (params.status === "investigating" && !incident.assignedAnalystId) {
    throw new ApiError(
      400,
      "Incident must be assigned before moving to investigating"
    );
  }

  const updatedIncident = await prisma.socIncident.update({
    where: { id: params.incidentId },
    data: {
      status: params.status,
      lastUpdatedBy: params.user.userId,
      lastSeen: new Date(),
      resolvedAt:
        params.status === "resolved" || params.status === "false_positive"
          ? new Date()
          : incident.resolvedAt,
      resolutionNotes:
        params.status === "resolved" || params.status === "false_positive"
          ? params.note || incident.resolutionNotes
          : incident.resolutionNotes,
    },
  });

  await createAuditEvent({
    eventType: "INCIDENT_STATUS_UPDATED",
    severity:
      params.status === "resolved" || params.status === "false_positive"
        ? "medium"
        : "high",
    actorUserId: params.user.userId,
    actorRole: params.user.role,
    targetResourceType: "soc_incident",
    targetResourceId: params.incidentId,
    department: params.user.department,
    justification: `Incident status changed from ${incident.status} to ${params.status}. ${
      params.note || ""
    }`,
    correlationId: params.correlationId,
    ipAddress: params.ipAddress,
  });

  return updatedIncident;
}