import { useEffect, useState } from "react";
import { Clock, Lock, ShieldAlert, Unlock, WifiOff } from "lucide-react";
import { fetchSocIncidents } from "../api/soc";
import {
  containUserIp,
  lockUserAccount,
  unlockUserAccount,
} from "../api/admin";

import type { SocIncident } from "../api/soc";

type IncidentFilter = "all" | "open" | "investigating" | "contained";
type ActionType = "lock" | "unlock" | "contain-ip";

function formatTime(value: string) {
  return new Date(value).toLocaleString();
}

function formatName(value: string) {
  return value.replace(/_/g, " ");
}

function severityClass(severity: SocIncident["severity"]) {
  return severity === "critical"
    ? "border-red-500/40 bg-red-500/10 text-red-300"
    : "border-orange-500/40 bg-orange-500/10 text-orange-300";
}

function statusClass(status: SocIncident["status"]) {
  switch (status) {
    case "contained":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
    case "investigating":
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
    default:
      return "border-sky-500/40 bg-sky-500/10 text-sky-300";
  }
}

export function IncidentsPage() {
  const [incidents, setIncidents] = useState<SocIncident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    null
  );
  const [filter, setFilter] = useState<IncidentFilter>("all");
  const [justification, setJustification] = useState("");
  const [actionLoading, setActionLoading] = useState<ActionType | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
  let ignore = false;

  async function fetchData() {
    try {
      setLoading(true);

      const data = await fetchSocIncidents();

      if (!ignore) {
        setIncidents(data);
        setSelectedIncidentId(data[0]?.id ?? null);
      }
    } catch {
      if (!ignore) {
        setError("Failed to load SOC incidents.");
      }
    } finally {
      if (!ignore) {
        setLoading(false);
      }
    }
  }

  void fetchData();

  return () => {
    ignore = true;
  };
}, []);

  const sortedIncidents = [...incidents].sort((a, b) => {
    const severityOrder = { critical: 2, high: 1 };

    if (severityOrder[b.severity] !== severityOrder[a.severity]) {
      return severityOrder[b.severity] - severityOrder[a.severity];
    }

    return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
  });

  const filteredIncidents = sortedIncidents.filter((incident) =>
    filter === "all" ? true : incident.status === filter
  );

  const selectedIncident = incidents.find(
    (incident) => incident.id === selectedIncidentId
  );

  async function executeAction(action: ActionType) {
    if (!selectedIncident?.primaryActorUserId) {
      setActionMessage("No actor user found for this incident.");
      return;
    }

    if (justification.trim().length < 10) {
      setActionMessage("Justification must be at least 10 characters.");
      return;
    }

    if (action === "contain-ip" && !selectedIncident.ipAddress) {
      setActionMessage("No IP address found for this incident.");
      return;
    }

    setActionLoading(action);
    setActionMessage("");

    try {
      if (action === "lock") {
        await lockUserAccount({
          userId: selectedIncident.primaryActorUserId,
          justification,
        });
        setActionMessage("User account locked successfully.");
      }

      if (action === "unlock") {
        await unlockUserAccount({
          userId: selectedIncident.primaryActorUserId,
          justification,
        });
        setActionMessage("User account unlocked successfully.");
      }

      if (action === "contain-ip") {
        await containUserIp({
          userId: selectedIncident.primaryActorUserId,
          ipAddress: selectedIncident.ipAddress || "",
          justification,
        });
        setActionMessage("IP containment executed successfully.");
      }

      setJustification("");
      const data = await fetchSocIncidents();
setIncidents(data);
    } catch {
      setActionMessage("Action failed. Check permissions or session state.");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
          Incident Response
        </p>
        <h2 className="mt-3 text-4xl font-bold text-white">
          Alerts & Incidents
        </h2>
        <p className="mt-2 max-w-3xl text-slate-400">
          Correlated high-risk events grouped into investigation-ready security
          incidents.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl xl:col-span-2">
          <div className="border-b border-slate-800 px-6 py-5">
            <h3 className="text-xl font-semibold text-white">
              Incident Queue
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Prioritized incidents based on severity, containment status, and
              latest activity.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-slate-800 px-6 py-4">
            {(["all", "open", "investigating", "contained"] as const).map(
              (item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                    filter === item
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              )
            )}
          </div>

          <div className="divide-y divide-slate-800">
            {loading && (
              <div className="px-6 py-8 text-sm text-slate-400">
                Loading incidents...
              </div>
            )}

            {!loading && filteredIncidents.length === 0 && (
              <div className="px-6 py-8 text-sm text-slate-400">
                No incidents found for this filter.
              </div>
            )}

            {!loading &&
              filteredIncidents.map((incident) => (
                <button
                  key={incident.id}
                  onClick={() => {
                    setSelectedIncidentId(incident.id);
                    setActionMessage("");
                    setJustification("");
                  }}
                  className={`block w-full px-6 py-5 text-left transition hover:bg-slate-800/40 ${
                    selectedIncidentId === incident.id
                      ? "bg-slate-800/60"
                      : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500">
                      {incident.id}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${severityClass(
                        incident.severity
                      )}`}
                    >
                      {incident.severity}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusClass(
                        incident.status
                      )}`}
                    >
                      {incident.status}
                    </span>
                  </div>

                  <h4 className="mt-3 font-semibold text-white">
                    {incident.title}
                  </h4>

                  <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                    {incident.summary}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>{incident.eventCount} event(s)</span>
                    <span>Dept: {incident.department || "unknown"}</span>
                    <span>Actor: {incident.actorRole || "unknown"}</span>
                    <span>IP: {incident.ipAddress || "unknown"}</span>
                  </div>
                </button>
              ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl">
            <div className="border-b border-slate-800 px-6 py-5">
              <h3 className="text-xl font-semibold text-white">
                Incident Actions
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Human-approved containment actions with mandatory justification.
              </p>
            </div>

            {!selectedIncident && !loading && (
              <div className="px-6 py-8 text-sm text-slate-400">
                Select an incident to take action.
              </div>
            )}

            {selectedIncident && (
              <div className="p-6">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm font-semibold text-white">
                    {selectedIncident.title}
                  </p>
                  <p className="mt-2 break-all text-xs text-slate-500">
                    Actor: {selectedIncident.primaryActorUserId || "unknown"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    IP: {selectedIncident.ipAddress || "unknown"}
                  </p>
                </div>

                <label className="mt-5 block text-sm font-medium text-slate-300">
                  Analyst justification
                </label>
                <textarea
                  value={justification}
                  onChange={(event) => setJustification(event.target.value)}
                  className="mt-2 min-h-28 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Explain why this action is necessary..."
                />

                {actionMessage && (
                  <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                    {actionMessage}
                  </div>
                )}

                <div className="mt-5 grid grid-cols-1 gap-3">
                  <button
                    onClick={() => executeAction("contain-ip")}
                    disabled={actionLoading !== null}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-300 transition hover:bg-orange-500/20 disabled:opacity-50"
                  >
                    <WifiOff size={17} />
                    {actionLoading === "contain-ip"
                      ? "Containing IP..."
                      : "Contain IP Sessions"}
                  </button>

                  <button
                    onClick={() => executeAction("lock")}
                    disabled={actionLoading !== null}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    <Lock size={17} />
                    {actionLoading === "lock"
                      ? "Locking User..."
                      : "Lock User"}
                  </button>

                  <button
                    onClick={() => executeAction("unlock")}
                    disabled={actionLoading !== null}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    <Unlock size={17} />
                    {actionLoading === "unlock"
                      ? "Unlocking User..."
                      : "Unlock User"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl">
            <div className="border-b border-slate-800 px-6 py-5">
              <h3 className="text-xl font-semibold text-white">
                Incident Timeline
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Event sequence for the selected incident.
              </p>
            </div>

            {!selectedIncident && !loading && (
              <div className="px-6 py-8 text-sm text-slate-400">
                Select an incident to inspect.
              </div>
            )}

            {selectedIncident && (
              <div className="p-6">
                <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400">
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {selectedIncident.title}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        {selectedIncident.correlationId}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${severityClass(
                            selectedIncident.severity
                          )}`}
                        >
                          {selectedIncident.severity}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusClass(
                            selectedIncident.status
                          )}`}
                        >
                          {selectedIncident.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedIncident.timeline.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                    >
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${
                          event.severity === "critical"
                            ? "border-red-500/40 bg-red-500/10 text-red-300"
                            : event.severity === "high"
                              ? "border-orange-500/40 bg-orange-500/10 text-orange-300"
                              : event.severity === "medium"
                                ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        }`}
                      >
                        {event.severity}
                      </span>

                      <p className="mt-3 font-semibold text-white">
                        {formatName(event.eventType)}
                      </p>

                      <p className="mt-2 text-sm text-slate-400">
                        {event.justification ||
                          "No analyst justification recorded."}
                      </p>

                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        <Clock size={14} />
                        {formatTime(event.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}