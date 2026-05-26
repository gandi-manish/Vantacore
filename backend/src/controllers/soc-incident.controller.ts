import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/api-error";
import {
  assignIncident,
  updateIncidentStatus,
} from "../services/soc-incident-lifecycle.service";

function getIncidentId(req: Request): string {
  const incidentId = req.params.incidentId;

  if (!incidentId || Array.isArray(incidentId)) {
    throw new ApiError(400, "Valid incident ID is required");
  }

  return incidentId;
}

function requireRequestUser(req: Request) {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  return req.user;
}

export const assignIncidentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const user = requireRequestUser(req);
    const incidentId = getIncidentId(req);

    if (!req.body.analystUserId) {
      throw new ApiError(400, "analystUserId is required");
    }

    const incident = await assignIncident({
      user,
      incidentId,
      analystUserId: req.body.analystUserId,
      correlationId: req.correlationId,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      data: incident,
    });
  }
);

export const updateIncidentStatusHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const user = requireRequestUser(req);
    const incidentId = getIncidentId(req);

    if (!req.body.status) {
      throw new ApiError(400, "status is required");
    }

    const incident = await updateIncidentStatus({
      user,
      incidentId,
      status: req.body.status,
      note: req.body.note,
      correlationId: req.correlationId,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      data: incident,
    });
  }
);