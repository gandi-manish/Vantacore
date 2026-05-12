import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error";
import { logger } from "../config/logger";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    logger.warn("Handled API error", {
      statusCode: err.statusCode,
      message: err.message,
      details: err.details,
      correlationId: req.correlationId,
    });

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details ?? null,
      correlationId: req.correlationId ?? null,
    });
  }

  logger.error("Unhandled server error", {
    error:
      err instanceof Error
        ? {
            message: err.message,
            stack: err.stack,
          }
        : err,
    correlationId: req.correlationId,
  });

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    correlationId: req.correlationId ?? null,
  });
}