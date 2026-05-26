import {
  RiskSignalType,
  scoreRiskSignals,
} from "./risk-signals";

import {
  evaluateRiskPolicy,
  PolicyDecision,
} from "./response-policy";

export interface PolicyEvaluationInput {
  signals: RiskSignalType[];
  metadata?: {
    actorUserId?: string;
    actorRole?: string;
    department?: string;
    ipAddress?: string;
    fileId?: string;
    fileSensitivity?: string;
    correlationId?: string;
  };
}

export interface PolicyEvaluationResult {
  signals: RiskSignalType[];
  score: number;
  severity: PolicyDecision["severity"];
  actions: PolicyDecision["actions"];
  reasoning: string[];
}

function buildReasoning(signals: RiskSignalType[]): string[] {
  return signals.map((signal) => {
    switch (signal) {
      case "DOWNLOAD_SPIKE":
        return "Abnormal file download volume detected";

      case "SENSITIVE_FILE_ACCESS":
        return "Sensitive file access occurred";

      case "SECURITY_OVERRIDE":
        return "Security override justification was used";

      case "FAILED_LOGIN_BURST":
        return "Multiple failed login attempts detected";

      case "BRUTE_FORCE_AGAINST_USER":
        return "Possible brute-force activity against user account";

      case "NEW_IP_LOGIN":
        return "Login from previously unseen IP address";

      case "SUSPICIOUS_IP_LOGIN":
        return "Suspicious IP address activity detected";

      case "IMPOSSIBLE_TRAVEL":
        return "Impossible travel login pattern detected";

      case "REFRESH_TOKEN_REUSE":
        return "Refresh token reuse detected";

      case "TOKEN_REPLAY":
        return "Possible token replay attack detected";

      case "RESTRICTED_FILE_ACCESS":
        return "Attempted access to restricted file";

      case "ROLE_POLICY_VIOLATION":
        return "Role policy violation detected";

      case "UNAUTHORIZED_ADMIN_ACCESS":
        return "Unauthorized admin access attempt detected";

      case "OUTSIDE_DEPARTMENT_ACCESS":
        return "Cross-department file access detected";

      case "UNUSUAL_ACTIVITY_BURST":
        return "Unusual activity burst detected";

      case "MULTIPLE_DENIED_ACTIONS":
        return "Repeated denied operations detected";

      default:
        return `Security signal detected: ${signal}`;
    }
  });
}

export function evaluateSecurityPolicy(
  input: PolicyEvaluationInput
): PolicyEvaluationResult {
  const score = scoreRiskSignals(input.signals);

  const policy = evaluateRiskPolicy(score);

  const reasoning = buildReasoning(input.signals);

  return {
    signals: input.signals,
    score,
    severity: policy.severity,
    actions: policy.actions,
    reasoning,
  };
}