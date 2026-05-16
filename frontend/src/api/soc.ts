import { apiClient } from "./client";

export type SocSummary = {
  highAlerts: number;
  criticalAlerts: number;
  suspendedUsers: number;
  containmentActions: number;
};

export type AuditEvent = {
  id: string;
  eventType: string;
  severity: "low" | "medium" | "high" | "critical";
  actorUserId: string | null;
  actorRole: string | null;
  targetResourceType: string;
  targetResourceId: string;
  department: string | null;
  justification: string | null;
  correlationId: string | null;
  ipAddress: string | null;
  createdAt: string;
};

export type RiskUser = {
  id: string;
  email: string;
  role: string;
  department: string;
  status: string;
  score: number;
  level: "low" | "medium" | "high" | "critical";
  recentEventCount: number;
  lastActivityAt: string;
};
export type SocIncident = {
  id: string;
  correlationId: string;
  title: string;
  severity: "high" | "critical";
  status: "open" | "investigating" | "contained";
  eventCount: number;
  firstSeen: string;
  lastSeen: string;
  primaryActorUserId: string | null;
  actorRole: string | null;
  department: string | null;
  ipAddress: string | null;
  latestEventType: string;
  summary: string;
  timeline: AuditEvent[];
};

export async function fetchSocIncidents(): Promise<SocIncident[]> {
  const response = await apiClient.get("/soc/incidents");
  return response.data.data;
}

export async function fetchSocSummary(): Promise<SocSummary> {
  const response = await apiClient.get("/soc/summary");
  return response.data.data;
}

export async function fetchRecentAlerts(): Promise<AuditEvent[]> {
  const response = await apiClient.get("/soc/alerts");
  return response.data.data;
}

export async function fetchTopRiskUsers(): Promise<RiskUser[]> {
  const response = await apiClient.get("/soc/users/risk");
  return response.data.data;
}