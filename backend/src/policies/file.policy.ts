import { JwtPayload } from "../types/auth.types";

type FileForPolicy = {
  ownerUserId: string;
  department: string;
  sensitivityLevel: string;
};

export function canDownloadFile(params: {
  user: JwtPayload;
  file: FileForPolicy;
  justification?: string;
}): { allowed: boolean; reason: string; severity: "low" | "medium" | "high" } {
  const { user, file, justification } = params;

  if (file.ownerUserId === user.userId) {
    return { allowed: true, reason: "owner_access", severity: "low" };
  }

  if (user.role === "manager" && user.department === file.department) {
    return { allowed: true, reason: "manager_department_access", severity: "medium" };
  }

  if (user.role === "security_analyst") {
    if (!justification || justification.trim().length < 10) {
      return {
        allowed: false,
        reason: "security_access_requires_justification",
        severity: "high",
      };
    }

    return {
      allowed: true,
      reason: "security_override_with_justification",
      severity: "high",
    };
  }

  return {
    allowed: false,
    reason: "download_policy_denied",
    severity: "high",
  };
}