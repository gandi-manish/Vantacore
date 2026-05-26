import { prisma } from "../config/db";
import { ApiError } from "../utils/api-error";

interface ValidateOverrideInput {
  incidentId?: string;
  fileId: string;
  analystUserId: string;
}

export const validateSecurityOverride = async ({
  incidentId,
  fileId,
  analystUserId,
}: ValidateOverrideInput) => {
  if (!incidentId) {
    throw new ApiError(403, "Security override denied: incidentId is required");
  }

  const incident = await prisma.socIncident.findUnique({
    where: { id: incidentId },
  });

  if (!incident) {
    throw new ApiError(403, "Security override denied: incident not found");
  }

  if (incident.status === "resolved" || incident.status === "false_positive") {
    throw new ApiError(403, "Security override denied: incident is closed");
  }

  if (incident.assignedAnalystId !== analystUserId) {
    throw new ApiError(
      403,
      "Security override denied: incident not assigned to analyst"
    );
  }

  if (incident.targetResourceId !== fileId) {
    throw new ApiError(
      403,
      "Security override denied: incident does not match requested file"
    );
  }

  return incident;
};