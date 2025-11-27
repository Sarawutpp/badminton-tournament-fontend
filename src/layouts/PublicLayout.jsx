// src/layouts/PublicLayout.jsx
// (เวอร์ชันสำหรับ /public/... ไม่ใช้ slug แล้ว)

import React from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PublicLayout() {
  const { user } = useAuth();

  const TabLink = ({ to, children }) => (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex-shrink-0 whitespace-nowrap px-4 py-3 text-center text-sm font-medium border-b-2
        ${
          isActive
            ? "border-indigo-500 text-indigo-600"
            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
        }`
      }
    >
      {children}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex justify-between items-center">
          <h1 className="text-lg font-bold text-indigo-700 truncate">
            Moodeng Cup 2025
          </h1>

          <div className="flex items-center gap-2">
            {user && user.role === "admin" && (
              <>
                <span className="hidden sm:inline text-xs text-gray-600 bg-indigo-50 px-2 py-1 rounded-full">
                  Admin: {user.displayName}
                </span>
                <Link
                  to="/admin"
                  className="text-xs text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100"
                >
                  กลับหน้า Admin
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="sticky top-16 z-10 bg-white shadow-sm">
        <div className="flex overflow-x-auto no-scrollbar">
          <div className="flex flex-nowrap mx-auto md:justify-center">
            <TabLink to="running">
              <span className="relative">
                Court Running
                <span className="absolute top-0 right-[-10px] flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </span>
            </TabLink>

            <TabLink to="schedule">ตารางแข่ง</TabLink>
            <TabLink to="standings">ตารางคะแนน</TabLink>
            <TabLink to="bracket">สายแข่ง (KO)</TabLink>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-2 md:p-4">
        <Outlet />
      </main>
    </div>
  );
}
