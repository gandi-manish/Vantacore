import { RiskSignal, RiskSignalType } from "./risk-signals";
import { ThreatPattern, ThreatPatternType } from "./threat-patterns";

export interface CorrelationRule {
  pattern: ThreatPatternType;

  requiredSignals: RiskSignalType[];

  minimumSignalCount: number;

  confidence: number;

  description: string;
}

export const CORRELATION_RULES: CorrelationRule[] = [
  {
    pattern: ThreatPattern.ACCOUNT_TAKEOVER,

    requiredSignals: [
      RiskSignal.DOWNLOAD_SPIKE,
      RiskSignal.SENSITIVE_FILE_ACCESS,
      RiskSignal.SECURITY_OVERRIDE,
    ],

    minimumSignalCount: 2,

    confidence: 85,

    description:
      "Possible account takeover involving sensitive file access and abnormal download behavior",
  },

  {
    pattern: ThreatPattern.DATA_EXFILTRATION,

    requiredSignals: [
      RiskSignal.DOWNLOAD_SPIKE,
      RiskSignal.SENSITIVE_FILE_ACCESS,
    ],

    minimumSignalCount: 2,

    confidence: 75,

    description:
      "Potential data exfiltration attempt involving high-volume sensitive downloads",
  },

  {
    pattern: ThreatPattern.PRIVILEGE_ABUSE,

    requiredSignals: [
      RiskSignal.SECURITY_OVERRIDE,
    ],

    minimumSignalCount: 1,

    confidence: 60,

    description:
      "Possible privilege abuse or policy override detected",
  },
];