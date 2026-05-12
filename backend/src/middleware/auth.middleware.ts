import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../services/token.service";
import { ApiError } from "../utils/api-error";
import { prisma } from "../config/db";

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Authorization token is missing");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new ApiError(401, "Authorization token is missing");
  }

  const payload = verifyAccessToken(token);

  if (!payload.sessionId) {
    throw new ApiError(401, "Invalid token session");
  }

  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
  });

  if (!session || session.revoked || session.expiresAt < new Date()) {
    throw new ApiError(401, "Session is revoked or expired");
  }

  req.user = payload;
  next();
}