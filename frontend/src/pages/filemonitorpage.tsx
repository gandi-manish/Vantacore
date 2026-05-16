import { useEffect, useState } from "react";
import {
  Ban,
  Clock,
  Eye,
  FileWarning,
  Flag,
  ShieldAlert,
} from "lucide-react";
import { apiClient } from "../api/client";

type RiskyFile = {
  id: string;
  ownerUserId: string;
  fileName: string;
  s3Key: string;
  department: string;
  sensitivityLevel: string;
  uploadStatus: string;
  createdAt: string;
  updatedAt: string;
};

function formatTime(value: string) {
  return new Date(value).toLocaleString();
}

function sensitivityClass(level: string) {
  switch (level) {
    case "sensitive":
      return "border-red-500/40 bg-red-500/10 text-red-300";
    case "confidential":
      return "border-orange-500/40 bg-orange-500/10 text-orange-300";
    case "internal":
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
    default:
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  }
}

export function FileMonitorPage() {
  const [files, setFiles] = useState<RiskyFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [justification, setJustification] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadFiles() {
      try {
        const response = await apiClient.get("/soc/files/risky");

        if (!ignore) {
          const data = response.data.data as RiskyFile[];
          setFiles(data);
          setSelectedFileId(data[0]?.id ?? null);
        }
      } catch {
        if (!ignore) {
          setError("Failed to load risky files.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadFiles();

    return () => {
      ignore = true;
    };
  }, []);

  const selectedFile = files.find((file) => file.id === selectedFileId);

  function handleMockAction(action: string) {
    if (!selectedFile) {
      setActionMessage("Select a file first.");
      return;
    }

    if (justification.trim().length < 10) {
      setActionMessage("Justification must be at least 10 characters.");
      return;
    }

    setActionMessage(
      `${action} is ready for backend wiring. No server action executed yet.`
    );
  }

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
          File Governance
        </p>
        <h2 className="mt-3 text-4xl font-bold text-white">File Monitor</h2>
        <p className="mt-2 max-w-3xl text-slate-400">
          Monitor sensitive and completed file objects across VantaCore with
          ownership, department, and response context.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
            <div>
              <h3 className="text-xl font-semibold text-white">
                Risky / Sensitive Files
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Select a file to inspect and prepare analyst actions.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300">
              {loading ? "--" : files.length} tracked
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">File</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Sensitivity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Updated</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {loading && (
                  <tr>
                    <td className="px-6 py-8 text-sm text-slate-400" colSpan={6}>
                      Loading files...
                    </td>
                  </tr>
                )}

                {!loading && files.length === 0 && (
                  <tr>
                    <td className="px-6 py-8 text-sm text-slate-400" colSpan={6}>
                      No risky files found.
                    </td>
                  </tr>
                )}

                {!loading &&
                  files.map((file) => (
                    <tr
                      key={file.id}
                      onClick={() => {
                        setSelectedFileId(file.id);
                        setActionMessage("");
                        setJustification("");
                      }}
                      className={`cursor-pointer transition hover:bg-slate-800/40 ${
                        selectedFileId === file.id ? "bg-slate-800/60" : ""
                      }`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400">
                            <FileWarning size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {file.fileName}
                            </p>
                            <p className="mt-1 max-w-md truncate text-xs text-slate-500">
                              {file.s3Key}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-300">
                        {file.department}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${sensitivityClass(
                            file.sensitivityLevel
                          )}`}
                        >
                          {file.sensitivityLevel}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-bold uppercase text-slate-300">
                          {file.uploadStatus}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          {formatTime(file.updatedAt)}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedFileId(file.id);
                              setActionMessage("");
                            }}
                            className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-2 text-cyan-300 hover:bg-cyan-500/20"
                            title="Investigate file"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedFileId(file.id);
                              setActionMessage(
                                "Flag action selected. Add justification in the panel."
                              );
                            }}
                            className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 text-amber-300 hover:bg-amber-500/20"
                            title="Flag file"
                          >
                            <Flag size={16} />
                          </button>

                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedFileId(file.id);
                              setActionMessage(
                                "Restrict action selected. Add justification in the panel."
                              );
                            }}
                            className="rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20"
                            title="Restrict file"
                          >
                            <Ban size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl">
            <div className="border-b border-slate-800 px-6 py-5">
              <h3 className="text-xl font-semibold text-white">
                File Actions
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Prepare analyst-approved file response actions.
              </p>
            </div>

            {!selectedFile && !loading && (
              <div className="px-6 py-8 text-sm text-slate-400">
                Select a file to inspect.
              </div>
            )}

            {selectedFile && (
              <div className="p-6">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400">
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {selectedFile.fileName}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        {selectedFile.id}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-500">
                    <p>Owner: {selectedFile.ownerUserId}</p>
                    <p>Department: {selectedFile.department}</p>
                    <p>Sensitivity: {selectedFile.sensitivityLevel}</p>
                    <p>Status: {selectedFile.uploadStatus}</p>
                  </div>
                </div>

                <label className="mt-5 block text-sm font-medium text-slate-300">
                  Analyst justification
                </label>
                <textarea
                  value={justification}
                  onChange={(event) => setJustification(event.target.value)}
                  className="mt-2 min-h-28 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Explain why this file action is necessary..."
                />

                {actionMessage && (
                  <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                    {actionMessage}
                  </div>
                )}

                <div className="mt-5 grid grid-cols-1 gap-3">
                  <button
                    onClick={() => handleMockAction("Flag for investigation")}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-300 transition hover:bg-amber-500/20"
                  >
                    <Flag size={17} />
                    Flag for Investigation
                  </button>

                  <button
                    onClick={() => handleMockAction("Restrict access")}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/20"
                  >
                    <Ban size={17} />
                    Restrict File Access
                  </button>

                  <button
                    onClick={() => handleMockAction("Investigate")}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/20"
                  >
                    <Eye size={17} />
                    Open Investigation Context
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-white">Why this matters</h3>
            <p className="mt-2 text-sm text-slate-400">
              File-level actions turn VantaCore from a monitoring dashboard into
              a response platform. Backend wiring comes next.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}