import { prisma } from "../config/db";

export async function revokeAllUserSessions(userId: string): Promise<number> {
  const result = await prisma.session.updateMany({
    where: {
      userId,
      revoked: false,
    },
    data: { revoked: true },
  });

  return result.count;
}

export async function revokeSession(sessionId: string): Promise<boolean> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.revoked) return false;

  await prisma.session.update({
    where: { id: sessionId },
    data: { revoked: true },
  });

  return true;
}

export async function revokeUserSessionsByIp(params: {
  userId: string;
  ipAddress?: string;
}): Promise<number> {
  if (!params.ipAddress) return 0;

  const result = await prisma.session.updateMany({
    where: {
      userId: params.userId,
      ipAddress: params.ipAddress,
      revoked: false,
    },
    data: { revoked: true },
  });

  return result.count;
}