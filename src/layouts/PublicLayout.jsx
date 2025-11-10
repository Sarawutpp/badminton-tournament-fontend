// src/layouts/PublicLayout.jsx
// (เวอร์ชันแก้ไข: แท็บเลื่อนได้ + ใช้ .no-scrollbar)

import React from "react";
import { NavLink, Outlet, useParams, Link } from "react-router-dom";

export default function PublicLayout() {
  const { slug } = useParams();
  
  // ============ [!! START: ส่วนที่แก้ไข !!] ============
  // (ลบ flex-1 ออก, เพิ่ม flex-shrink-0)
  const TabLink = ({ to, children }) => (
    <NavLink
      to={to}
      end // ให้เช็ค path แบบเป๊ะๆ
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
  // ============ [!! END: ส่วนที่แก้ไข !!] ============

  return (
    // พื้นหลังสีเทาอ่อน
    <div className="min-h-screen bg-gray-100">
      
      {/* --- 1. Header (ส่วนหัว) --- */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex justify-between items-center">
          {/* ชื่อทัวร์ */}
          <h1 className="text-lg font-bold text-indigo-700 truncate">
            Moodeng Cup 2025
            <span className="text-gray-500 font-normal hidden md:inline"> • {slug}</span>
          </h1>
          {/* ลิงก์กลับ Admin */}
          <Link 
            to="/admin" 
            className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200"
          >
            Admin
          </Link>
        </div>
      </header>

      {/* --- 2. Tabs (เมนู) [แก้ไขแล้ว] --- */}
      <nav className="sticky top-16 z-10 bg-white shadow-sm">
        {/* เปลี่ยนจาก max-w-4xl เป็น overflow-x-auto */}
        <div className="flex overflow-x-auto no-scrollbar">
          {/* เพิ่ม mx-auto md:justify-center เพื่อให้สวยงาม */}
          <div className="flex flex-nowrap mx-auto md:justify-center">
            
            {/* (เรียงลำดับตามไฟล์ที่คุณส่งมา) */}
            <TabLink to="running">
              <span className="relative">
                Court Runing
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

      {/* --- 3. Content (เนื้อหา) --- */}
      <main className="max-w-4xl mx-auto p-2 md:p-4">
        <Outlet />
      </main>
    </div>
  );
}