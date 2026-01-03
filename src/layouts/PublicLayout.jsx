// src/layouts/PublicLayout.jsx
import React, { useEffect } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTournament } from "../contexts/TournamentContext";

export default function PublicLayout() {
  const { user } = useAuth();
  const { selectedTournament, clearTournament } = useTournament();
  const navigate = useNavigate();

  // ถ้าไม่มีทัวร์นาเมนต์ที่เลือก ให้ดีดกลับไปหน้าเลือก
  useEffect(() => {
    if (!selectedTournament) {
      navigate("/");
    }
  }, [selectedTournament, navigate]);

  if (!selectedTournament) return null; // ป้องกัน render ก่อน redirect

  const TabLink = ({ to, children }) => (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex-shrink-0 whitespace-nowrap px-4 py-3 text-center text-sm font-medium border-b-2 transition-colors
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
    // ✅ เพิ่ม font-kanit ตรงนี้เพื่อให้มีผลทั้งหน้า Public
    <div className="min-h-screen bg-gray-50 font-kanit">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex flex-col overflow-hidden">
            {/* แสดงชื่อทัวร์นาเมนต์จาก Context */}
            <h1 className="text-lg font-bold text-indigo-700 truncate leading-tight">
              {selectedTournament.name}
            </h1>
            <span className="text-[10px] text-gray-400 truncate">
              {selectedTournament.location || "ไม่ระบุสถานที่"}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* ปุ่มเปลี่ยนรายการ (สำหรับ User ทั่วไป) */}
            <button
              onClick={() => {
                clearTournament();
                navigate("/");
              }}
              className="text-xs text-slate-500 border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 transition"
            >
              🔁 เปลี่ยนรายการ
            </button>

            {user && user.role === "admin" && (
              <Link
                to="/admin"
                className="hidden sm:inline-block text-xs text-white bg-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-700 shadow-sm"
              >
                Admin Panel
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="sticky top-16 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex overflow-x-auto no-scrollbar md:justify-center">
            <TabLink to="running">
              <span className="relative flex items-center gap-1.5">
                Court Running
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </span>
            </TabLink>
            <TabLink to="schedule">ตารางแข่ง</TabLink>
            <TabLink to="standings">ตารางคะแนน</TabLink>
            <TabLink to="bracket">สายแข่ง (KO)</TabLink>

            {/* ✅ Comment ซ่อนเมนู Hall of Fame ไว้ก่อน */}
            {/* <TabLink to="hall-of-fame">ทำเนียบแชมป์ 🏆</TabLink> */}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-3 md:p-6 pb-20">
        <Outlet />
      </main>
    </div>
  );
}
