import { prisma } from "../config/db";

export async function getSocSummary() {
  const [highAlerts, criticalAlerts, suspendedUsers, containmentActions] =
    await Promise.all([
      prisma.auditEvent.count({ where: { severity: "high" } }),
      prisma.auditEvent.count({ where: { severity: "critical" } }),
      prisma.user.count({ where: { status: "suspended" } }),
      prisma.auditEvent.count({
        where: {
          eventType: {
            in: [
              "IP_BASED_CONTAINMENT_TRIGGERED",
              "TARGETED_CONTAINMENT_TRIGGERED",
              "AUTOMATED_CONTAINMENT_TRIGGERED",
              "USER_ACCOUNT_LOCKED",
            ],
          },
        },
      }),
    ]);

  return {
    highAlerts,
    criticalAlerts,
    suspendedUsers,
    containmentActions,
  };
}

export async function getRecentAlerts() {
  return prisma.auditEvent.findMany({
    where: {
      severity: {
        in: ["high", "critical"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });
}

export async function getSuspendedUsers() {
  return prisma.user.findMany({
    where: {
      status: "suspended",
    },
    select: {
      id: true,
      email: true,
      role: true,
      department: true,
      status: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function getUserTimeline(userId: string) {
  return prisma.auditEvent.findMany({
    where: {
      actorUserId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });
}
export async function getContainmentActions() {
  return prisma.auditEvent.findMany({
    where: {
      eventType: {
        in: [
          "IP_BASED_CONTAINMENT_TRIGGERED",
          "TARGETED_CONTAINMENT_TRIGGERED",
          "AUTOMATED_CONTAINMENT_TRIGGERED",
          "USER_ACCOUNT_LOCKED",
          "USER_ACCOUNT_UNLOCKED",
        ],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });
}

export async function getRiskyFiles() {
  return prisma.file.findMany({
    where: {
      OR: [
        { sensitivityLevel: "sensitive" },
        {
          uploadStatus: "completed",
        },
      ],
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 50,
  });
}

export async function getSocIncidents() {
  const events = await prisma.auditEvent.findMany({
    where: {
      severity: {
        in: ["high", "critical"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  const groupedByCorrelationId = events.reduce<Record<string, typeof events>>(
    (acc, event) => {
      const key = event.correlationId || "uncorrelated";

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(event);
      return acc;
    },
    {}
  );

  return Object.entries(groupedByCorrelationId).map(
    ([correlationId, incidentEvents]) => {
      const highestSeverity = incidentEvents.some(
        (event) => event.severity === "critical"
      )
        ? "critical"
        : "high";

      return {
        correlationId,
        severity: highestSeverity,
        eventCount: incidentEvents.length,
        firstSeen: incidentEvents[incidentEvents.length - 1]?.createdAt,
        lastSeen: incidentEvents[0]?.createdAt,
        primaryActorUserId: incidentEvents[0]?.actorUserId,
        latestEventType: incidentEvents[0]?.eventType,
        events: incidentEvents,
      };
    }
  );
}