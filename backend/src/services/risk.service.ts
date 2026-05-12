export type RiskSignal =
  | "DOWNLOAD_SPIKE"
  | "TOKEN_REUSE"
  | "SECURITY_OVERRIDE"
  | "SENSITIVE_FILE_ACCESS"
  | "REPEATED_IP_ANOMALY"
  | "OFF_HOURS_ACTIVITY";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type RecommendedAction =
  | "LOG_ONLY"
  | "ALERT"
  | "CONTAIN_SESSION_OR_IP"
  | "LOCK_USER";

const RISK_WEIGHTS: Record<RiskSignal, number> = {
  DOWNLOAD_SPIKE: 40,
  TOKEN_REUSE: 60,
  SECURITY_OVERRIDE: 25,
  SENSITIVE_FILE_ACCESS: 20,
  REPEATED_IP_ANOMALY: 20,
  OFF_HOURS_ACTIVITY: 10,
};

export interface RiskAssessmentInput {
  signals: RiskSignal[];
}

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  recommendedAction: RecommendedAction;
  reasons: RiskSignal[];
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function getRecommendedAction(level: RiskLevel): RecommendedAction {
  switch (level) {
    case "critical":
      return "LOCK_USER";
    case "high":
      return "CONTAIN_SESSION_OR_IP";
    case "medium":
      return "ALERT";
    case "low":
    default:
      return "LOG_ONLY";
  }
}

export function assessRisk(input: RiskAssessmentInput): RiskAssessment {
  const rawScore = input.signals.reduce((total, signal) => {
    return total + RISK_WEIGHTS[signal];
  }, 0);

  const score = Math.min(rawScore, 100);
  const level = getRiskLevel(score);
  const recommendedAction = getRecommendedAction(level);

  return {
    score,
    level,
    recommendedAction,
    reasons: input.signals,
  };
}