import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import "./admin-shell.css";

const NAV = [
  { to: "/admin/players",  label: "Players",  icon: "👤" },
  { to: "/admin/teams",    label: "Teams",    icon: "👥" },
  { to: "/admin/groups",   label: "Groups",   icon: "🧩" },
  { to: "/admin/matches",  label: "Matches",  icon: "📋" },
  { to: "/admin/knockout", label: "Knockout", icon: "🏆" },
];

function useMobileMenu() {
  const [open, setOpen] = React.useState(false);
  const { pathname } = useLocation();
  React.useEffect(() => setOpen(false), [pathname]); // เปลี่ยนหน้าแล้วปิดเมนู
  return { open, setOpen };
}

export default function AdminLayout() {
  const { open, setOpen } = useMobileMenu();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="shell">
      {/* Topbar */}
      <header className="topbar">
        <button className="btn-outline lg-hidden" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
        <div className="brand">🏸 Badminton Tournament Admin</div>
        <div className="actions lg-only">
          <button className="btn-outline" onClick={() => setCollapsed(v => !v)}>
            {collapsed ? "Expand menu" : "Collapse menu"}
          </button>
        </div>
      </header>

      {/* Sidebar (desktop) */}
      <aside className={`sidebar ${collapsed ? "is-collapsed" : ""}`}>
        <div className="sidebar__header">
          {!collapsed ? <strong>Moodeng Cup</strong> : <span>🏸</span>}
        </div>
        <nav className="nav">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} className="nav__item">
              <span className="nav__icon">{n.icon}</span>
              {!collapsed && <span className="nav__label">{n.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__footer">v1</div>
      </aside>

      {/* Drawer (mobile) */}
      <div className={`drawer ${open ? "is-open" : ""}`} role="dialog" aria-label="Main navigation">
        <div className="drawer__panel">
          <div className="drawer__header">
            <strong>Menu</strong>
            <button className="btn-outline" onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </div>
          <nav className="nav">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} className="nav__item" onClick={() => setOpen(false)}>
                <span className="nav__icon">{n.icon}</span>
                <span className="nav__label">{n.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="drawer__backdrop" onClick={() => setOpen(false)} />
      </div>

      {/* Main content */}
      <main className={`content ${collapsed ? "with-collapsed" : ""}`}>
        <div className="container">
          <Outlet /> {/* สำคัญ! หน้าย่อยจะเรนเดอร์ตรงนี้ */}
        </div>
      </main>
    </div>
  );
}
