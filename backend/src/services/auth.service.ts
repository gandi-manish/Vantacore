import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { prisma } from "../config/db";
import { ApiError } from "../utils/api-error";
import {
  LoginInput,
  LoginResponse,
  LogoutInput,
  RefreshInput,
  RefreshResponse,
  RequestContext,
  SafeUser,
} from "../types/auth.types";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
} from "./token.service";
import { createAuditEvent } from "./audit.service";

function toSafeUser(user: {
  id: string;
  email: string;
  role: string;
  department: string;
  status: string;
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    department: user.department,
    status: user.status,
  };
}

function getRefreshTokenExpiryDate(): Date {
  const now = new Date();
  now.setHours(now.getHours() + 8);
  return now;
}

export async function loginUser(
  input: LoginInput,
  context?: RequestContext
): Promise<LoginResponse> {
  const email = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status !== "active") {
    throw new ApiError(403, "User account is not active");
  }

  const sessionId = randomUUID();

  const payload = {
    userId: user.id,
    sessionId,
    email: user.email,
    role: user.role,
    department: user.department,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: getRefreshTokenExpiryDate(),
      revoked: false,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    },
  });

  await createAuditEvent({
    eventType: "LOGIN_SUCCESS",
    severity: "low",
    actorUserId: user.id,
    actorRole: user.role,
    targetResourceType: "user",
    targetResourceId: user.id,
    department: user.department,
    correlationId: context?.correlationId,
    ipAddress: context?.ipAddress,
  });

  return {
    accessToken,
    refreshToken,
    user: toSafeUser(user),
  };
}

export async function refreshUserToken(
  input: RefreshInput,
  context?: RequestContext
): Promise<RefreshResponse> {
  const oldRefreshToken = input.refreshToken;
  const payload = verifyRefreshToken(oldRefreshToken);
  const oldRefreshTokenHash = hashToken(oldRefreshToken);

  const activeSession = await prisma.session.findFirst({
    where: {
      id: payload.sessionId,
      userId: payload.userId,
      refreshTokenHash: oldRefreshTokenHash,
      revoked: false,
    },
  });

  if (!activeSession) {
    const revokedSession = await prisma.session.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.userId,
        refreshTokenHash: oldRefreshTokenHash,
        revoked: true,
      },
    });

    if (revokedSession) {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      await createAuditEvent({
        eventType: "REFRESH_TOKEN_REUSE_DETECTED",
        severity: "high",
        actorUserId: payload.userId,
        actorRole: user?.role,
        targetResourceType: "session",
        targetResourceId: revokedSession.id,
        department: user?.department,
        correlationId: context?.correlationId,
        ipAddress: context?.ipAddress,
      });

      throw new ApiError(
        401,
        "Refresh token reuse detected. Session is invalid."
      );
    }

    throw new ApiError(401, "Refresh session is invalid or revoked");
  }

  if (activeSession.expiresAt < new Date()) {
    throw new ApiError(401, "Refresh session has expired");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || user.status !== "active") {
    throw new ApiError(403, "User account is not active");
  }

  await prisma.session.update({
    where: { id: activeSession.id },
    data: { revoked: true },
  });

  const newSessionId = randomUUID();

  const newPayload = {
    userId: user.id,
    sessionId: newSessionId,
    email: user.email,
    role: user.role,
    department: user.department,
  };

  const newAccessToken = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken(newPayload);

  await prisma.session.create({
    data: {
      id: newSessionId,
      userId: user.id,
      refreshTokenHash: hashToken(newRefreshToken),
      expiresAt: getRefreshTokenExpiryDate(),
      revoked: false,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    },
  });

  await createAuditEvent({
    eventType: "REFRESH_TOKEN_ROTATED",
    severity: "low",
    actorUserId: user.id,
    actorRole: user.role,
    targetResourceType: "session",
    targetResourceId: activeSession.id,
    department: user.department,
    correlationId: context?.correlationId,
    ipAddress: context?.ipAddress,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logoutUser(
  input: LogoutInput,
  context?: RequestContext
): Promise<void> {
  const payload = verifyRefreshToken(input.refreshToken);
  const refreshTokenHash = hashToken(input.refreshToken);

  const existingSession = await prisma.session.findFirst({
    where: {
      id: payload.sessionId,
      refreshTokenHash,
      revoked: false,
    },
  });

  if (!existingSession) {
    throw new ApiError(401, "Refresh session is invalid or already revoked");
  }

  const user = await prisma.user.findUnique({
    where: { id: existingSession.userId },
  });

  await prisma.session.update({
    where: { id: existingSession.id },
    data: { revoked: true },
  });

  await createAuditEvent({
    eventType: "LOGOUT_SUCCESS",
    severity: "low",
    actorUserId: existingSession.userId,
    actorRole: user?.role,
    targetResourceType: "session",
    targetResourceId: existingSession.id,
    department: user?.department,
    correlationId: context?.correlationId,
    ipAddress: context?.ipAddress,
  });
}