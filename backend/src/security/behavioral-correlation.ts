import { prisma } from "../config/db";
import { RiskSignal, RiskSignalType } from "./risk-signals";
import { correlateSignals } from "./correlation-engine";

interface BehavioralCorrelationInput {
  actorUserId: string;
  ipAddress?: string;
  windowMinutes?: number;
}

const EVENT_SIGNAL_MAP: Record<string, RiskSignalType | null> = {
  FILE_DOWNLOAD_SECURITY_OVERRIDE: RiskSignal.SECURITY_OVERRIDE,
  FILE_DOWNLOAD_DENIED: RiskSignal.MULTIPLE_DENIED_ACTIONS,
  FILE_DOWNLOAD_DENIED_RESTRICTED: RiskSignal.RESTRICTED_FILE_ACCESS,
  FILE_DOWNLOAD_SPIKE_DETECTED: RiskSignal.DOWNLOAD_SPIKE,
  RISK_SCORE_EVALUATED: RiskSignal.UNUSUAL_ACTIVITY_BURST,

  AUTH_LOGIN_FAILED: RiskSignal.FAILED_LOGIN_BURST,
  AUTH_BRUTE_FORCE_DETECTED: RiskSignal.BRUTE_FORCE_AGAINST_USER,
  AUTH_NEW_IP_LOGIN: RiskSignal.NEW_IP_LOGIN,
  AUTH_SUSPICIOUS_IP_LOGIN: RiskSignal.SUSPICIOUS_IP_LOGIN,
  AUTH_IMPOSSIBLE_TRAVEL: RiskSignal.IMPOSSIBLE_TRAVEL,
  AUTH_REFRESH_TOKEN_REUSE_DETECTED: RiskSignal.REFRESH_TOKEN_REUSE,

  ROLE_POLICY_VIOLATION: RiskSignal.ROLE_POLICY_VIOLATION,
  UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT: RiskSignal.UNAUTHORIZED_ADMIN_ACCESS,
};

export async function behavioralCorrelation(input: BehavioralCorrelationInput) {
  const windowMinutes = input.windowMinutes || 5;
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);

  const recentEvents = await prisma.auditEvent.findMany({
    where: {
      actorUserId: input.actorUserId,
      ...(input.ipAddress ? { ipAddress: input.ipAddress } : {}),
      createdAt: {
        gte: since,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const aggregatedSignals: RiskSignalType[] = [];

  for (const event of recentEvents) {
    const mappedSignal = EVENT_SIGNAL_MAP[event.eventType];

    if (mappedSignal && !aggregatedSignals.includes(mappedSignal)) {
      aggregatedSignals.push(mappedSignal);
    }
  }

  const correlations = correlateSignals(aggregatedSignals);

  return {
    recentEvents,
    aggregatedSignals,
    correlations,
  };
}