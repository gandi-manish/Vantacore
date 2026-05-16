import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  FileWarning,
  LayoutDashboard,
  LogOut,
  Shield,
} from "lucide-react";
import { clearAuthTokens } from "../utils/auth";

const navItems = [
  {
    label: "SOC Overview",
    to: "/dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Incidents",
    to: "/dashboard/incidents",
    icon: AlertTriangle,
  },
  {
    label: "File Monitor",
    to: "/dashboard/files",
    icon: FileWarning,
  },
];

export function DashboardLayout() {
  const navigate = useNavigate();

  function logout() {
    clearAuthTokens();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed left-0 top-0 h-full w-72 border-r border-slate-800 bg-slate-900 p-6">
        <div className="mb-10 flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-cyan-400">
            <Shield size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">VantaCore</h1>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              SOC Platform
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-300"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Status
            </p>
            <p className="mt-2 text-sm font-semibold text-emerald-300">
              Console Active
            </p>
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="ml-72 min-h-screen p-8">
        <Outlet />
      </main>
    </div>
  );
}