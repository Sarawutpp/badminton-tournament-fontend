// src/layouts/AdminLayout.jsx
// (เวอร์ชันที่แปลเป็น Tailwind CSS และเพิ่ม Auth + Logout แล้ว)

import React from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// NAV (เมนู) ยังคงเหมือนเดิม
const NAV = [
  { to: "/admin/players", label: "Players", icon: "👤" },
  { to: "/admin/teams", label: "Teams", icon: "👥" },
  { to: "/admin/generator", label: "Generator", icon: "✨" },
  { to: "/admin/schedule-plan", label: "Schedule Plan", icon: "🗓️" },
  { to: "/admin/court-running", label: "Court Running", icon: "🏸" },
  { to: "/admin/matches", label: "Matches (Scoring)", icon: "📋" },
  { to: "/admin/standings", label: "Standings", icon: "📊" },
  { to: "/admin/knockout", label: "Knockout", icon: "🏆" },
];

// Hook สำหรับเมนูมือถือ (ยังคงเหมือนเดิม)
function useMobileMenu() {
  const [open, setOpen] = React.useState(false);
  const { pathname } = useLocation();
  React.useEffect(() => setOpen(false), [pathname]);
  return { open, setOpen };
}

// Helper component สำหรับปุ่ม (ใช้ซ้ำ)
function Button({ onClick, children, className = "", type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`border border-gray-300 bg-white px-3 py-1.5 rounded-lg text-sm shadow-sm hover:bg-gray-50 ${className}`}
    >
      {children}
    </button>
  );
}

// Helper component สำหรับ NavLink (ใช้ซ้ำ)
function NavItem({ to, icon, label, collapsed, isMobile = false }) {
  const commonClasses = "flex items-center gap-3 px-3 py-2.5 rounded-lg";
  const activeClasses = "bg-indigo-700 text-white";
  const inactiveClasses =
    "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700";

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${commonClasses} ${
          isActive ? activeClasses : inactiveClasses
        }`
      }
    >
      <span className="text-lg w-5 text-center">{icon}</span>
      {(!collapsed || isMobile) && (
        <span className="font-medium text-sm">{label}</span>
      )}
    </NavLink>
  );
}

export default function AdminLayout() {
  const { open, setOpen } = useMobileMenu();
  const [collapsed, setCollapsed] = React.useState(false);

  // ✅ Auth hook + logout
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    // Layout หลัก
    <div className="grid grid-rows-[auto_1fr] grid-cols-[auto_1fr] min-h-screen bg-gray-50">
      {/* TOPBAR */}
      <header className="sticky top-0 z-20 col-span-2 flex items-center justify-between gap-4 p-4 border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {/* ปุ่มเปิดเมนู (มือถือ) */}
          <Button className="lg:hidden" onClick={() => setOpen(true)}>
            ☰
          </Button>
          <div className="font-bold text-lg text-indigo-800">
            🏸 Badminton Tournament Admin
          </div>
        </div>

        {/* ขวาสุด: ปุ่มต่าง ๆ + ข้อมูล user */}
        <div className="flex items-center gap-2">
          {/* ลิงก์ไปหน้า Public */}
          <NavLink to="/t/main" className="hidden sm:block">
            <Button>Public Site</Button>
          </NavLink>

          {/* แสดงชื่อ user + role ถ้า login */}
          {user ? (
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-700">
              <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">
                {user.displayName} ({user.role})
              </span>
              <Button
                onClick={handleLogout}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          ) : (
            // กรณีเผื่อไว้ (ปกติจะไม่เข้า เพราะ /admin ถูก RequireAdmin หุ้มแล้ว)
            <Button onClick={() => navigate("/login")}>Login</Button>
          )}

          {/* ปุ่มพับ sidebar (เฉพาะจอใหญ่) */}
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
        className={`sticky top-[77px] z-10 h-[calc(100vh-77px)] flex flex-col justify-between p-4 border-r bg-white/80 backdrop-blur-sm transition-all duration-200 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div>
          <div className="font-bold p-3 mb-2">
            {collapsed ? "MD" : "Moodeng Cup"}
          </div>
          <nav className="flex flex-col gap-1.5">
            {NAV.map((n) => (
              <NavItem key={n.to} {...n} collapsed={collapsed} />
            ))}
          </nav>
        </div>

        <nav className="flex flex-col gap-1.5 pt-4 border-t">
          <NavItem
            to="/t/main"
            icon="🌍"
            label="Public Site"
            collapsed={collapsed}
          />
        </nav>
      </aside>

      {/* DRAWER (Mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-label="Main navigation"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <div className="fixed top-0 left-0 z-50 h-full w-72 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <strong>Menu</strong>
              <Button onClick={() => setOpen(false)}>✕</Button>
            </div>
            <nav className="flex flex-col gap-1.5">
              {NAV.map((n) => (
                <NavItem key={n.to} {...n} isMobile={true} />
              ))}

              <hr className="my-2" />

              <NavItem
                to="/t/main"
                icon="🌍"
                label="Public Site"
                isMobile={true}
              />

              {/* user + logout บน mobile */}
              {user && (
                <div className="mt-4 border-t pt-3 text-sm text-gray-700 flex flex-col gap-2">
                  <span>
                    {user.displayName} ({user.role})
                  </span>
                  <Button
                    onClick={handleLogout}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </Button>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <main className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
