import { prisma } from "../config/db";

function scoreEvent(eventType: string, severity: string): number {
  let score = 0;

  if (eventType === "USER_ACCOUNT_LOCKED") score += 80;
  if (eventType === "RISK_SCORE_EVALUATED") score += 40;
  if (eventType === "IP_BASED_CONTAINMENT_TRIGGERED") score += 35;
  if (eventType === "TARGETED_CONTAINMENT_TRIGGERED") score += 30;
  if (eventType === "FILE_DOWNLOAD_SPIKE_DETECTED") score += 40;
  if (eventType === "FILE_DOWNLOAD_SECURITY_OVERRIDE") score += 25;
  if (eventType === "REFRESH_TOKEN_REUSE_DETECTED") score += 60;
  if (eventType === "FILE_DOWNLOAD_DENIED") score += 20;

  if (severity === "critical") score += 30;
  if (severity === "high") score += 20;
  if (severity === "medium") score += 10;

  return score;
}

function getRiskLevel(score: number) {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

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
      OR: [{ sensitivityLevel: "sensitive" }, { uploadStatus: "completed" }],
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 50,
  });
}

function buildIncidentTitle(eventType: string) {
  if (eventType === "USER_ACCOUNT_LOCKED") return "User account locked after high-risk activity";
  if (eventType === "IP_BASED_CONTAINMENT_TRIGGERED") return "IP-based containment triggered";
  if (eventType === "RISK_SCORE_EVALUATED") return "Risk score escalation detected";
  if (eventType === "FILE_DOWNLOAD_SPIKE_DETECTED") return "Download spike detected";
  if (eventType === "FILE_DOWNLOAD_SECURITY_OVERRIDE") return "Security override file access";
  if (eventType === "REFRESH_TOKEN_REUSE_DETECTED") return "Refresh token reuse detected";

 return eventType.replace(/_/g, " ");
}

function getIncidentStatus(eventTypes: string[]) {
  if (eventTypes.includes("USER_ACCOUNT_LOCKED")) return "contained";
  if (
    eventTypes.includes("IP_BASED_CONTAINMENT_TRIGGERED") ||
    eventTypes.includes("TARGETED_CONTAINMENT_TRIGGERED") ||
    eventTypes.includes("AUTOMATED_CONTAINMENT_TRIGGERED")
  ) {
    return "contained";
  }

  if (eventTypes.includes("RISK_SCORE_EVALUATED")) return "investigating";

  return "open";
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
    take: 150,
  });

  const groupedByCorrelationId = events.reduce<Record<string, typeof events>>(
    (acc, event) => {
      const key = event.correlationId || `uncorrelated-${event.id}`;

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
      const sortedEvents = [...incidentEvents].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );

      const latestEvent = incidentEvents[0];
      const eventTypes = incidentEvents.map((event) => event.eventType);

      const highestSeverity = incidentEvents.some(
        (event) => event.severity === "critical"
      )
        ? "critical"
        : "high";

      const status = getIncidentStatus(eventTypes);

      return {
        id: `INC-${correlationId.slice(0, 8).toUpperCase()}`,
        correlationId,
        title: buildIncidentTitle(latestEvent.eventType),
        severity: highestSeverity,
        status,
        eventCount: incidentEvents.length,
        firstSeen: sortedEvents[0]?.createdAt,
        lastSeen: latestEvent.createdAt,
        primaryActorUserId: latestEvent.actorUserId,
        actorRole: latestEvent.actorRole,
        department: latestEvent.department,
        ipAddress: latestEvent.ipAddress,
        latestEventType: latestEvent.eventType,
        summary:
          latestEvent.justification ||
          `Incident generated from ${incidentEvents.length} high-risk security event(s).`,
        timeline: sortedEvents,
      };
    }
  );
}

export async function getTopRiskUsers(limit = 5) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      department: true,
      status: true,
      updatedAt: true,
    },
  });

  const results = await Promise.all(
    users.map(async (user) => {
      const recentEvents = await prisma.auditEvent.findMany({
        where: {
          actorUserId: user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      });

      const rawScore = recentEvents.reduce((total, event) => {
        return total + scoreEvent(event.eventType, event.severity);
      }, 0);

      const score = Math.min(rawScore, 100);
      const level = getRiskLevel(score);

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
        score,
        level,
        recentEventCount: recentEvents.length,
        lastActivityAt: recentEvents[0]?.createdAt || user.updatedAt,
      };
    })
  );

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}