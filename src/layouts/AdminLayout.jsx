// src/layouts/AdminLayout.jsx

import React from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTournament } from "../contexts/TournamentContext"; // Import

const NAV = [
  { to: "/admin/players", label: "Players", icon: "👤" },
  { to: "/admin/teams", label: "Teams", icon: "👥" },
  { to: "/admin/generator", label: "Generator", icon: "✨" },
  { to: "/admin/schedule-plan", label: "Schedule Plan", icon: "🗓️" },
  { to: "/admin/manual-match", label: "สร้างแมตช์ (Manual)", icon: "➕" },
  { to: "/admin/court-running", label: "Court Running", icon: "🏸" },
  { to: "/admin/matches", label: "Matches (Scoring)", icon: "📋" },
  { to: "/admin/standings", label: "Admin Standings", icon: "📊" },
  { to: "/admin/knockout/bracket", label: "จัดสาย Knockout", icon: "🧩" },
  { to: "/admin/knockout/scoring", label: "กรอกคะแนน Knockout", icon: "🏆" },
  { to: "/admin/print-batch", label: "พิมพ์ใบคะแนน", icon: "🖨️" },
];

function useMobileMenu() {
  const [open, setOpen] = React.useState(false);
  const { pathname } = useLocation();
  React.useEffect(() => setOpen(false), [pathname]);
  return { open, setOpen };
}

function Button({ onClick, children, className = "", type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`border border-gray-300 bg-white px-3 py-1.5 rounded-lg text-sm shadow-sm hover:bg-gray-50 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

function NavItem({ to, icon, label, collapsed, isMobile = false }) {
  const commonClasses = "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors";
  const activeClasses = "bg-indigo-700 text-white";
  const inactiveClasses = "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700";

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${commonClasses} ${isActive ? activeClasses : inactiveClasses}`
      }
    >
      <span className="text-lg w-6 text-center">{icon}</span>
      {(!collapsed || isMobile) && (
        <span className="font-medium text-sm whitespace-nowrap">{label}</span>
      )}
    </NavLink>
  );
}

export default function AdminLayout() {
  const { open, setOpen } = useMobileMenu();
  const [collapsed, setCollapsed] = React.useState(false);

  const { user, logout } = useAuth();
  const { selectedTournament, clearTournament } = useTournament(); // Use Context
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:grid lg:grid-cols-[auto_1fr] lg:grid-rows-[auto_1fr]">
      
      {/* TOPBAR */}
      <header className="sticky top-0 z-30 lg:col-span-2 flex items-center justify-between gap-4 p-3 md:p-4 border-b bg-white/95 backdrop-blur-sm shadow-sm lg:shadow-none">
        <div className="flex items-center gap-3">
          <Button className="lg:hidden p-2" onClick={() => setOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
          <div className="font-bold text-base md:text-lg text-indigo-800 truncate flex items-center gap-2">
            <span>🏸</span>
            <span className="hidden xs:inline">Badminton Admin</span>
            {/* Show Selected Tournament Name */}
            {selectedTournament && (
               <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-md ml-2 border border-orange-200">
                 {selectedTournament.name}
               </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NavLink to="/public" className="hidden sm:block">
            <Button>Public Site</Button>
          </NavLink>

          {/* ปุ่ม Switch Event */}
          <Button onClick={clearTournament} className="text-xs border-orange-200 text-orange-700 hover:bg-orange-50">
            🔁 Switch Event
          </Button>

          {user ? (
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-700">
              <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium text-xs">
                {user.displayName}
              </span>
              <Button onClick={handleLogout} className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
                Logout
              </Button>
            </div>
          ) : (
            <Button onClick={() => navigate("/login")}>Login</Button>
          )}

          <Button
            className="hidden lg:block"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? "Expand" : "Collapse"}
          </Button>
        </div>
      </header>

      {/* SIDEBAR */}
      <aside
        className={`hidden lg:flex sticky top-[69px] z-20 h-[calc(100vh-69px)] flex-col justify-between p-4 border-r bg-white transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="overflow-y-auto no-scrollbar">
          <div className="font-bold px-3 mb-4 text-slate-400 text-xs uppercase tracking-wider">
            {collapsed ? "Menu" : "Main Menu"}
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => (
              <NavItem key={n.to} {...n} collapsed={collapsed} />
            ))}
          </nav>
        </div>

        <nav className="flex flex-col gap-1 pt-4 border-t mt-2">
          <NavItem to="/public" icon="🌍" label="Public Site" collapsed={collapsed} />
        </nav>
      </aside>

      {/* DRAWER (Mobile) */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setOpen(false)}
          />
          <div className="fixed top-0 left-0 z-50 h-full w-[80%] max-w-sm bg-white p-4 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <div className="font-bold text-lg text-indigo-800">Menu</div>
              <button 
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto flex flex-col gap-1.5">
              {NAV.map((n) => (
                <NavItem key={n.to} {...n} isMobile={true} />
              ))}
            </nav>

            <div className="mt-auto border-t pt-4 space-y-3">
              <Button onClick={clearTournament} className="w-full justify-center border-orange-200 text-orange-700 bg-orange-50">
                  🔁 เปลี่ยนรายการแข่งขัน
              </Button>

              <NavLink to="/public" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100">
                <span className="text-lg">🌍</span>
                <span className="font-medium">Public Site</span>
              </NavLink>

              {user && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-sm font-medium text-slate-700 mb-2">
                    {user.displayName}
                  </div>
                  <Button
                    onClick={handleLogout}
                    className="w-full border-red-200 text-red-600 bg-white hover:bg-red-50"
                  >
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <main className="flex-1 min-w-0 p-3 md:p-6 overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}