import { Request, Response } from "express";

export function healthCheck(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: "VantaCore backend is healthy",
    service: "vantacore-backend",
    timestamp: new Date().toISOString(),
  });
}