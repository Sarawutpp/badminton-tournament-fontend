// src/pages/public/Schedule.jsx
// ตารางแข่ง (Public) โหลดจาก API จริง + Responsive

import React, { useState, useEffect } from "react";
import { API, teamName } from "@/lib/api.js";
import { HAND_LEVEL_OPTIONS } from "@/lib/types.js";

// สีสถานะ (ชัดขึ้น)
// - รอแข่ง: ฟ้า
// - กำลังแข่ง: แดง
// - จบแล้ว: เทา
const statusStyle = {
  finished: "bg-slate-200 text-slate-700",
  "in-progress": "bg-red-100 text-red-700",
  scheduled: "bg-sky-100 text-sky-700",
};

// การ์ดสำหรับมือถือ
function MatchCard({ m }) {
  const time = m.scheduledAt
    ? new Date(m.scheduledAt).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Bangkok",
      })
    : "-";

  return (
    <div className="p-4 grid grid-cols-3 gap-2 text-sm">
      {/* Col 1: Time / Court / Order */}
      <div className="col-span-1">
        <div className="font-bold">{time}</div>
        <div className="text-xs text-slate-500">คอร์ท {m.court || "-"}</div>
        <div className="text-xs text-slate-500 mt-1">
          ลำดับ {m.matchNo || "-"}
        </div>
      </div>

      {/* Col 2: Teams */}
      <div className="col-span-2">
        <div className="font-medium truncate">
          {teamName(m.team1)}{" "}
          <span className="text-slate-400">vs</span>{" "}
          {teamName(m.team2)}
        </div>
        <div className="text-xs text-slate-500">
          {m.handLevel} / {m.group}
        </div>
        {m.result && (
          <div className="text-emerald-700 font-semibold text-xs mt-1">
            ผล: {m.result}
          </div>
        )}
      </div>

      {/* Col 3: Status + Match ID */}
      <div className="col-span-3 flex justify-between items-center mt-2">
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            statusStyle[m.status] || ""
          }`}
        >
          {m.status === "in-progress"
            ? "แข่งอยู่"
            : m.status === "finished"
            ? "จบแล้ว"
            : "รอแข่ง"}
        </span>
        <span className="text-slate-500 text-xs font-medium">
          {m.matchId}
        </span>
      </div>
    </div>
  );
}

// Component หลัก
export default function PublicScheduleLongRow() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [level, setLevel] = useState("");
  const [court, setCourt] = useState("");
  // ✅ Default แสดงเฉพาะ "รอแข่ง + กำลังแข่ง"
  const [status, setStatus] = useState("scheduled,in-progress");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 24;

  // โหลดข้อมูลจาก API
  const loadMatches = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await API.listSchedule({
        page,
        pageSize,
        handLevel: level,
        court,
        status, // อนุญาตให้ส่ง "scheduled,in-progress"
        q,
        sort: "scheduledAt,matchNo", // เรียงตามเวลา แล้วตาม matchNo
      });
      setData({
        items: res.items || [],
        total: res.total || 0,
      });
    } catch (e) {
      setErr(e.message || "Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  // reload เมื่อ filter / page เปลี่ยน
  useEffect(() => {
    loadMatches();
  }, [level, court, status, q, page]);

  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));

  // ปุ่มลูกศรซ้าย-ขวาเปลี่ยนหน้า
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight")
        setPage((p) => Math.min(totalPages, p + 1));
      if (e.key === "ArrowLeft")
        setPage((p) => Math.max(1, p - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [totalPages]);

  const levels = HAND_LEVEL_OPTIONS;
  const courts = Array.from({ length: 14 }, (_, i) => String(i + 1));

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header + Filters */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-indigo-700">
              Moodeng Cup 2025
            </h1>
            <p className="text-slate-600 text-xs md:text-sm">
              ตารางการแข่งขัน (แนวยาว • หน้าละ 24 แมทช์ พร้อมลำดับแมท)
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-2">
            {/* ระดับมือ */}
            <select
              className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700"
              value={level}
              onChange={(e) => {
                setLevel(e.target.value);
                setPage(1);
              }}
            >
              <option value="">ทุกระดับมือ</option>
              {levels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>

            {/* คอร์ท */}
            <select
              className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700"
              value={court}
              onChange={(e) => {
                setCourt(e.target.value);
                setPage(1);
              }}
            >
              <option value="">ทุกคอร์ท</option>
              {courts.map((c) => (
                <option key={c} value={c}>
                  คอร์ท {c}
                </option>
              ))}
            </select>

            {/* ✅ สถานะ (มี option รวม รอแข่ง+กำลังแข่ง เป็น default) */}
            <select
              className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="scheduled,in-progress">
                รอแข่ง + กำลังแข่ง (แนะนำ)
              </option>
              <option value="scheduled">รอแข่งเท่านั้น</option>
              <option value="in-progress">กำลังแข่งเท่านั้น</option>
              <option value="finished">จบแล้ว</option>
              <option value="">ทุกสถานะ</option>
            </select>

            {/* ค้นหา */}
            <input
              className="flex-grow bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="ค้นหา: Match ID / ชื่อทีม"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onBlur={() => setPage(1)}
            />
          </div>
        </header>

        {err && (
          <div className="text-red-600 bg-red-100 p-3 rounded-md mb-4">
            {err}
          </div>
        )}
        {loading && (
          <div className="text-slate-500 p-4">กำลังโหลด...</div>
        )}

        {/* ตารางหลัก */}
        <div className="bg-white rounded-2xl shadow ring-1 ring-slate-200 overflow-hidden">
          {/* Header (desktop) */}
          <div className="sticky top-0 bg-gray-50 border-b text-[13px] hidden md:grid grid-cols-12 gap-2 px-3 py-2 font-semibold text-slate-600">
            <div className="col-span-1 text-center">ลำดับ</div>
            <div className="col-span-2">เวลา</div>
            <div className="col-span-1 text-center">คอร์ท</div>
            <div className="col-span-2">ระดับ/กลุ่ม</div>
            <div className="col-span-3">ทีม</div>
            <div className="col-span-1 text-center">สถานะ</div>
            <div className="col-span-2 text-left">Match ID</div>
          </div>

          {/* แถว (desktop) */}
          <div className="hidden md:block">
            {data.items.map((m, i) => (
              <div
                key={m._id}
                className={`grid grid-cols-12 gap-2 items-center px-3 py-3 text-sm ${
                  i % 2 === 0 ? "bg-white" : "bg-slate-50"
                }`}
              >
                <div className="col-span-1 text-center font-semibold text-slate-700">
                  {m.matchNo}
                </div>
                <div className="col-span-2 font-medium text-slate-800">
                  {m.scheduledAt
                    ? new Date(m.scheduledAt).toLocaleTimeString(
                        "th-TH",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Bangkok",
                        }
                      )
                    : "-"}
                </div>
                <div className="col-span-1 text-center">
                  {m.court}
                </div>
                <div className="col-span-2 text-slate-700">
                  {m.handLevel} / {m.group}
                </div>
                <div className="col-span-3">
                  <div className="truncate">
                    <span className="font-semibold">
                      {teamName(m.team1)}
                    </span>
                    <span className="text-slate-400">{" vs "}</span>
                    <span className="font-semibold">
                      {teamName(m.team2)}
                    </span>
                  </div>
                  {m.result && (
                    <div className="text-emerald-700 font-semibold text-xs">
                      ผล: {m.result}
                    </div>
                  )}
                </div>
                <div className="col-span-1 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      statusStyle[m.status] || ""
                    }`}
                  >
                    {m.status === "in-progress"
                      ? "แข่งอยู่"
                      : m.status === "finished"
                      ? "จบแล้ว"
                      : "รอแข่ง"}
                  </span>
                </div>
                <div className="col-span-2 text-left text-slate-600 font-medium">
                  {m.matchId}
                </div>
              </div>
            ))}
          </div>

          {/* การ์ด (mobile) */}
          <div className="block md:hidden divide-y divide-gray-100">
            {data.items.map((m) => (
              <MatchCard key={m._id} m={m} />
            ))}
          </div>

          {/* Empty state */}
          {!loading && data.items.length === 0 && (
            <div className="text-center text-slate-500 py-12">
              ไม่พบข้อมูลแมทช์
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify_between mt-3 text-sm">
          <div className="text-slate-500">
            แสดง {data.items.length} จาก {data.total} แมทช์
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded border bg-white shadow-sm disabled:opacity-40"
              onClick={() =>
                setPage((p) => Math.max(1, p - 1))
              }
              disabled={page === 1 || loading}
            >
              ก่อนหน้า
            </button>
            <span className="text-slate-600">
              หน้า {page} / {totalPages}
            </span>
            <button
              className="px-3 py-2 rounded border bg-white shadow-sm disabled:opacity-40"
              onClick={() =>
                setPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={page === totalPages || loading}
            >
              ถัดไป
            </button>
          </div>
        </div>

        <footer className="text-center text-xs text-slate-400 mt-4">
          อัปเดตล่าสุด:{" "}
          {new Date().toLocaleString("th-TH")} • ใช้ปุ่ม ⬅️➡️ เปลี่ยนหน้า
        </footer>
      </div>
    </div>
  );
}
