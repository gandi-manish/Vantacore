import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Shield, Activity } from "lucide-react";
import { apiClient } from "../api/client";
import { saveAuthTokens } from "../utils/auth";

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@vantacore.local");
  const [password, setPassword] = useState("Password@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiClient.post("/auth/login", {
        email,
        password,
      });

      const { accessToken, refreshToken } = response.data.data;

      saveAuthTokens(accessToken, refreshToken);
      navigate("/dashboard");
    } catch {
      setError("Login failed. Check credentials or account status.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden overflow-hidden border-r border-slate-800 bg-slate-950 p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.16),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.10),transparent_30%)]" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-cyan-400">
                <Shield size={30} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  VantaCore
                </h1>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Security Operations Center
                </p>
              </div>
            </div>

            <div className="mt-28 max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-400">
                Control. Observe. Defend.
              </p>

              <h2 className="mt-6 text-6xl font-black leading-tight tracking-tight text-white">
                Secure.
                <br />
                Monitor.
                <br />
                <span className="text-cyan-400">Contain.</span>
              </h2>

              <p className="mt-6 max-w-md text-lg leading-8 text-slate-400">
                Security-first file governance with auditability, risk scoring,
                and automated containment for internal enterprise workflows.
              </p>
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <Activity className="mb-3 text-cyan-400" size={20} />
              <p className="text-2xl font-bold text-white">SOC</p>
              <p className="mt-1 text-xs text-slate-500">Alert visibility</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <Shield className="mb-3 text-emerald-400" size={20} />
              <p className="text-2xl font-bold text-white">RBAC</p>
              <p className="mt-1 text-xs text-slate-500">Controlled access</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <Lock className="mb-3 text-amber-400" size={20} />
              <p className="text-2xl font-bold text-white">Audit</p>
              <p className="mt-1 text-xs text-slate-500">Traceable actions</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-slate-950 px-6 py-12">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-400">
                  <Shield size={28} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">VantaCore</h1>
                  <p className="text-sm text-slate-500">
                    Control. Observe. Defend.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-400">
                  SOC Workstation
                </p>
                <h2 className="mt-3 text-3xl font-bold text-white">
                  Welcome back
                </h2>
                <p className="mt-2 text-slate-400">
                  Sign in to access the VantaCore security console.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Email
                  </label>
                  <input
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Password
                  </label>
                  <input
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    autoComplete="current-password"
                  />
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <button
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Authenticating..." : "Authenticate"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>

              <div className="mt-8 border-t border-slate-800 pt-5">
                <p className="text-center text-xs uppercase tracking-[0.22em] text-slate-500">
                  Protected by VantaCore access controls
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}