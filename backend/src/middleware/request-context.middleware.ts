import { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";

export function requestContext(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const correlationId = randomUUID();

  req.correlationId = correlationId;
  res.setHeader("X-Correlation-Id", correlationId);

  next();
}