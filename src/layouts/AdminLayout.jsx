// src/layouts/AdminLayout.jsx
// (เวอร์ชันที่แปลเป็น Tailwind CSS และแก้ไขแล้ว)

import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom"; // <-- แก้ไข 'in' เป็น 'from'

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
function Button({ onClick, children, className = "" }) {
  return (
    <button
      type="button"
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
  const inactiveClasses = "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700";

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${commonClasses} ${isActive ? activeClasses : inactiveClasses}`
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

  return (
    // "shell" -> เปลี่ยนเป็น CSS Grid ของ Tailwind
    <div className="grid grid-rows-[auto_1fr] grid-cols-[auto_1fr] min-h-screen bg-gray-50">
      
      {/* "topbar" -> เปลี่ยนเป็น flex, sticky, border */}
      <header className="sticky top-0 z-20 col-span-2 flex items-center justify-between gap-4 p-4 border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button className="lg:hidden" onClick={() => setOpen(true)}>
            ☰
          </Button>
          <div className="font-bold text-lg text-indigo-800">
            🏸 Badminton Tournament Admin
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NavLink to="/t/main" className="hidden sm:block">
            <Button>Public Site</Button>
          </NavLink>
          <Button className="hidden lg:block" onClick={() => setCollapsed((v) => !v)}>
            {collapsed ? "Expand" : "Collapse"}
          </Button>
        </div>
      </header>

      {/* "sidebar" -> เปลี่ยนเป็น flex, sticky, transition */}
      <aside
        className={`sticky top-[77px] z-10 h-[calc(100vh-77px)] flex flex-col justify-between p-4 border-r bg-white/80 backdrop-blur-sm transition-all duration-200 ${
          collapsed ? "w-20" : "w-64"
        }`} // <-- แก้ไข ${...} ให้ถูกต้อง
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

      {/* "Drawer (mobile)" -> เปลี่ยนเป็น Tailwind ทั้งหมด */}
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
              <NavItem to="/t/main" icon="🌍" label="Public Site" isMobile={true} />
            </nav>
          </div>
        </div>
      )}

      {/* "content" -> เปลี่ยนเป็น main, p-6 */}
      <main className="p-4 md:p-6">
        {/* "container" -> Tailwind's max-w-7xl */}
        <div className="max-w-7xl mx-auto">
          <Outlet /> {/* หน้าย่อยจะเรนเดอร์ตรงนี้ */}
        </div>
      </main>
    </div>
  );
}