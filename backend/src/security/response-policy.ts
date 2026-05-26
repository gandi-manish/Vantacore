export type RiskSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical"
  | "severe";

export type ResponseAction =
  | "log"
  | "alert"
  | "contain_session"
  | "contain_ip"
  | "lock_user"
  | "full_isolation";

export interface PolicyDecision {
  score: number;
  severity: RiskSeverity;
  actions: ResponseAction[];
}

export function evaluateRiskPolicy(score: number): PolicyDecision {
  if (score >= 120) {
    return {
      score,
      severity: "severe",
      actions: [
        "alert",
        "contain_session",
        "contain_ip",
        "lock_user",
        "full_isolation",
      ],
    };
  }

  if (score >= 76) {
    return {
      score,
      severity: "critical",
      actions: [
        "alert",
        "contain_session",
        "contain_ip",
        "lock_user",
      ],
    };
  }

  if (score >= 51) {
    return {
      score,
      severity: "high",
      actions: [
        "alert",
        "contain_session",
        "contain_ip",
      ],
    };
  }

  if (score >= 26) {
    return {
      score,
      severity: "medium",
      actions: ["alert"],
    };
  }

  return {
    score,
    severity: "low",
    actions: ["log"],
  };
}