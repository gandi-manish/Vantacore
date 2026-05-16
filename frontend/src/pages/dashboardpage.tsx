import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Clock,
  Lock,
  ShieldAlert,
  Siren,
} from "lucide-react";
import {
  fetchRecentAlerts,
  fetchSocSummary,
  fetchTopRiskUsers,
} from "../api/soc";

import type { AuditEvent, RiskUser, SocSummary } from "../api/soc";

function formatEventName(eventType: string) {
  return eventType.replaceAll("_", " ");
}

function formatTime(value: string) {
  return new Date(value).toLocaleString();
}

function severityClass(severity: AuditEvent["severity"]) {
  switch (severity) {
    case "critical":
      return "border-red-500/40 bg-red-500/10 text-red-300";
    case "high":
      return "border-orange-500/40 bg-orange-500/10 text-orange-300";
    case "medium":
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
    default:
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  }
}

function riskBarClass(level: RiskUser["level"]) {
  switch (level) {
    case "critical":
      return "bg-red-400";
    case "high":
      return "bg-orange-400";
    case "medium":
      return "bg-amber-400";
    default:
      return "bg-emerald-400";
  }
}

export function DashboardPage() {
  const [summary, setSummary] = useState<SocSummary | null>(null);
  const [alerts, setAlerts] = useState<AuditEvent[]>([]);
  const [riskUsers, setRiskUsers] = useState<RiskUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [summaryData, alertsData, riskUsersData] = await Promise.all([
          fetchSocSummary(),
          fetchRecentAlerts(),
          fetchTopRiskUsers(),
        ]);

        setSummary(summaryData);
        setAlerts(alertsData.slice(0, 6));
        setRiskUsers(riskUsersData);
      } catch {
        setError("Failed to load SOC dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const cards = [
    { label: "High Alerts", value: summary?.highAlerts ?? "--", icon: ShieldAlert },
    { label: "Critical Alerts", value: summary?.criticalAlerts ?? "--", icon: Siren },
    { label: "Suspended Users", value: summary?.suspendedUsers ?? "--", icon: Lock },
    { label: "Containment Actions", value: summary?.containmentActions ?? "--", icon: AlertTriangle },
  ];

  return (
    <section>
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Security Operations
          </p>
          <h2 className="mt-3 text-4xl font-bold text-white">SOC Overview</h2>
          <p className="mt-2 max-w-3xl text-slate-400">
            Live operational visibility into alerts, containment activity, and
            user risk across VantaCore.
          </p>
        </div>

        <div className="hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 md:block">
          LIVE
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{card.label}</p>
                <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400">
                  <Icon size={20} />
                </div>
              </div>

              <p className="mt-5 text-4xl font-bold text-white">
                {loading ? "--" : card.value}
              </p>

              <p className="mt-3 text-xs text-slate-500">
                From SOC backend telemetry
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl xl:col-span-2">
          <div className="border-b border-slate-800 px-6 py-5">
            <h3 className="text-xl font-semibold text-white">
              Recent High-Risk Activity
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Latest high and critical audit events requiring analyst attention.
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            {loading && (
              <div className="px-6 py-8 text-sm text-slate-400">
                Loading alerts...
              </div>
            )}

            {!loading && alerts.length === 0 && (
              <div className="px-6 py-8 text-sm text-slate-400">
                No high-risk alerts found.
              </div>
            )}

            {!loading &&
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between gap-4 px-6 py-5 hover:bg-slate-800/40"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${severityClass(
                          alert.severity
                        )}`}
                      >
                        {alert.severity}
                      </span>
                      <h4 className="font-semibold text-white">
                        {formatEventName(alert.eventType)}
                      </h4>
                    </div>

                    <p className="mt-2 max-w-2xl text-sm text-slate-400">
                      {alert.justification ||
                        "No analyst justification recorded."}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>Dept: {alert.department || "unknown"}</span>
                      <span>Actor: {alert.actorRole || "unknown"}</span>
                      <span>IP: {alert.ipAddress || "unknown"}</span>
                    </div>
                  </div>

                  <div className="min-w-fit text-right text-xs text-slate-500">
                    <div className="flex items-center justify-end gap-2">
                      <Clock size={14} />
                      {formatTime(alert.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-white">Risk Panel</h3>
            <p className="mt-2 text-sm text-slate-400">
              Top users ranked by recent security activity and risk score.
            </p>

            <div className="mt-6 space-y-4">
              {loading && (
                <p className="text-sm text-slate-400">Loading risky users...</p>
              )}

              {!loading && riskUsers.length === 0 && (
                <p className="text-sm text-slate-400">
                  No risky users found.
                </p>
              )}

              {!loading &&
                riskUsers.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{user.email}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {user.role} • {user.department} • {user.status}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${severityClass(
                          user.level
                        )}`}
                      >
                        {user.level}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <p className="w-10 text-sm font-bold text-white">
                        {user.score}
                      </p>
                      <div className="h-2 flex-1 rounded-full bg-slate-800">
                        <div
                          className={`h-2 rounded-full ${riskBarClass(
                            user.level
                          )}`}
                          style={{ width: `${user.score}%` }}
                        />
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      {user.recentEventCount} recent event(s) • last activity{" "}
                      {formatTime(user.lastActivityAt)}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-white">Analyst Focus</h3>
            <p className="mt-2 text-sm text-slate-400">
              Prioritize critical users, account locks, containment actions, and
              repeated risky file activity.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}