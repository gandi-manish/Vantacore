import { RiskSignal, RiskSignalType } from "./risk-signals";
import {
  CORRELATION_RULES,
  CorrelationRule,
} from "./correlation-rules";

export interface CorrelationResult {
  matched: boolean;

  confidence: number;

  pattern?: string;

  description?: string;

  matchedSignals: RiskSignalType[];
}

export function correlateSignals(
  signals: RiskSignalType[]
): CorrelationResult[] {
  const results: CorrelationResult[] = [];

  for (const rule of CORRELATION_RULES) {
    const matchedSignals = rule.requiredSignals.filter((signal) =>
      signals.includes(signal)
    );

    if (matchedSignals.length >= rule.minimumSignalCount) {
      results.push({
        matched: true,

        confidence: rule.confidence,

        pattern: rule.pattern,

        description: rule.description,

        matchedSignals,
      });
    }
  }

  return results;
}