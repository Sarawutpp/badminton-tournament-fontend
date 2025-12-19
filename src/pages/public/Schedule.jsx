// src/pages/public/Schedule.jsx
import React, { useState, useEffect, useMemo } from "react";
import { API, teamName } from "@/lib/api.js";
import { useTournament } from "@/contexts/TournamentContext"; 

// สีสถานะ (ปรับให้ตรงกับรูปภาพ)
const statusStyle = {
  finished: "bg-slate-200 text-slate-600",
  "in-progress": "bg-red-50 text-red-600 border border-red-100", // ปรับให้ดูเป็นป้ายสวยขึ้น
  scheduled: "bg-sky-50 text-sky-600 border border-sky-100",
};

const STATUS_PRIORITY = {
  "in-progress": 0,
  scheduled: 1,
  finished: 2,
};

// --- การ์ดแมทช์ (ปรับดีไซน์ใหม่ให้เหมือนต้นฉบับ) ---
function MatchCard({ m }) {
  const time = m.scheduledAt
    ? new Date(m.scheduledAt).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Bangkok",
      })
    : "-";

  return (
    // ใช้ Flex เพื่อให้เส้นแบ่งแนวตั้งยาวตลอดความสูง
    <div className="p-4 flex gap-4 text-sm border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors">
      
      {/* Col 1: Time / Court / Order (ด้านซ้าย) */}
      <div className="w-[70px] flex-shrink-0 flex flex-col items-start border-r border-gray-200 pr-3">
        <div className="font-bold text-slate-800 text-base leading-none mb-1">
          {time}
        </div>
        <div className="text-xs text-slate-500 font-medium mb-0.5">
          คอร์ท {m.court || "-"}
        </div>
        <div className="text-[10px] text-slate-400">
          ลำดับ {m.matchNo || "-"}
        </div>
      </div>

      {/* Col 2: Info (ด้านขวา - รวม Teams, Category, Status, ID) */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        
        {/* ส่วนบน: ชื่อทีม และ รายการ */}
        <div className="mb-2">
          <div className="font-medium truncate text-slate-900 text-sm flex items-center gap-1">
            <span className={m.winner === m.team1 ? "text-indigo-600 font-bold" : ""}>
               {teamName(m.team1)}
            </span>
            <span className="text-slate-400 text-xs px-1">vs</span>
            <span className={m.winner === m.team2 ? "text-indigo-600 font-bold" : ""}>
               {teamName(m.team2)}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5 font-normal">
            {m.handLevel} {m.group ? `/ ${m.group}` : ""}
          </div>
        </div>

        {/* ส่วนล่าง: สถานะ (ซ้าย) และ Match ID (ขวา) */}
        <div className="flex items-end justify-between">
          <div>
            {m.result ? (
              <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                ผล: {m.result}
              </span>
            ) : (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide ${
                  statusStyle[m.status] || "bg-slate-100 text-slate-500"
                }`}
              >
                {m.status === "in-progress"
                  ? "กำลังแข่งขัน"
                  : m.status === "finished"
                  ? "จบแล้ว"
                  : "รอแข่ง"}
              </span>
            )}
          </div>
          <div className="text-slate-300 text-[10px] font-mono tracking-tighter uppercase">
            {m.matchId}
          </div>
        </div>

      </div>
    </div>
  );
}

// Component หลัก
export default function PublicScheduleLongRow() {
  const { selectedTournament } = useTournament(); 
  
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [level, setLevel] = useState("");
  const [court, setCourt] = useState("");
  const [status, setStatus] = useState("scheduled,in-progress");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 24;

  const [showFilters, setShowFilters] = useState(false);

  const levels = useMemo(() => {
    const cats = selectedTournament?.settings?.categories || [];
    if (cats.length > 0) {
      return cats.map((c) => ({ value: c, label: c, labelShort: c }));
    }
    return []; 
  }, [selectedTournament]);

  const courts = useMemo(() => {
    const total = selectedTournament?.settings?.totalCourts || 14; 
    return Array.from({ length: total }, (_, i) => String(i + 1));
  }, [selectedTournament]);

  const loadMatches = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await API.listSchedule({
        page,
        pageSize,
        handLevel: level,
        court,
        status,
        q,
        sort: "matchNo",
      });

      const raw = res.items || [];
      const keyword = (q || "").trim();
      let filtered = raw;

      if (keyword) {
        const re = new RegExp(keyword, "i");
        filtered = raw.filter((m) => {
          const name1 = teamName(m.team1) || "";
          const name2 = teamName(m.team2) || "";
          const id = m.matchId || "";
          return re.test(id) || re.test(name1) || re.test(name2);
        });
      }

      const items = filtered.slice().sort((a, b) => {
        const pa = STATUS_PRIORITY[a.status] ?? 99;
        const pb = STATUS_PRIORITY[b.status] ?? 99;
        if (pa !== pb) return pa - pb;
        const na = Number(a.matchNo ?? 0);
        const nb = Number(b.matchNo ?? 0);
        return na - nb;
      });

      setData({
        items,
        total: res.total ?? raw.length,
      });
    } catch (e) {
      setErr(e.message || "Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [level, court, status, q, page, selectedTournament]);

  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") setPage((p) => Math.min(totalPages, p + 1));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(1, p - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [totalPages]);

  const levelLabel = level || "ทุกระดับมือ";
  const courtLabel = court ? `คอร์ท ${court}` : "ทุกคอร์ท";
  const statusLabel = (() => {
    switch (status) {
      case "scheduled,in-progress": return "รอแข่ง + กำลังแข่ง";
      case "scheduled": return "รอแข่ง";
      case "in-progress": return "กำลังแข่ง";
      case "finished": return "จบแล้ว";
      default: return "ทุกสถานะ";
    }
  })();

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col gap-1 mb-3 md:mb-4 md:flex-row md:items-end md:justify-between">
            <h2 className="text-xl font-bold text-slate-800 hidden md:block">
               📅 ตารางการแข่งขัน
            </h2>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex items-center justify-between md:justify-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs md:text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-50 transition-colors w-full md:w-auto"
            >
              <span>ตัวกรองการแสดงผล</span>
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${showFilters ? "bg-indigo-600 text-white border-indigo-600" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}>
                 {showFilters ? "–" : "+"}
              </span>
            </button>
        </header>

        {/* Filter Accordion */}
        <section className="mb-4">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] md:text-xs text-slate-500">
             <span className="font-semibold text-slate-700 mr-1">ตัวกรองปัจจุบัน:</span>
             <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2 py-1 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {levelLabel}
             </span>
             <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2 py-1 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                {courtLabel}
             </span>
             <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2 py-1 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                {statusLabel}
             </span>
          </div>

          {showFilters && (
            <div className="rounded-2xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm animate-fadeIn">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-4 md:items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-slate-600">ระดับมือ</label>
                  <select
                    className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={level}
                    onChange={(e) => { setLevel(e.target.value); setPage(1); }}
                  >
                    <option value="">ทุกระดับมือ</option>
                    {levels.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-slate-600">คอร์ท</label>
                  <select
                    className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={court}
                    onChange={(e) => { setCourt(e.target.value); setPage(1); }}
                  >
                    <option value="">ทุกคอร์ท</option>
                    {courts.map((c) => (
                      <option key={c} value={c}>คอร์ท {c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-slate-600">สถานะ</label>
                  <select
                    className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  >
                    <option value="scheduled,in-progress">รอแข่ง + กำลังแข่ง (แนะนำ)</option>
                    <option value="scheduled">รอแข่งเท่านั้น</option>
                    <option value="in-progress">กำลังแข่งเท่านั้น</option>
                    <option value="finished">จบแล้ว</option>
                    <option value="">ทั้งหมด</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 md:col-span-1">
                   <label className="text-[11px] font-medium text-slate-600">ค้นหา</label>
                   <input
                     className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                     placeholder="ค้นหา: Match ID / ชื่อทีม"
                     value={q}
                     onChange={(e) => setQ(e.target.value)}
                     onBlur={() => setPage(1)}
                   />
                </div>
              </div>
            </div>
          )}
        </section>

        {err && <div className="text-red-600 bg-red-100 p-3 rounded-md mb-4 text-center text-sm">{err}</div>}
        {loading && <div className="text-slate-500 p-8 text-center">⏳ กำลังโหลดข้อมูล...</div>}

        {/* List / Table */}
        {!loading && (
          <div className="bg-white rounded-2xl shadow ring-1 ring-slate-200 overflow-hidden">
            
            {/* Desktop Table Header */}
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 text-[12px] uppercase tracking-wider hidden md:grid grid-cols-12 gap-2 px-4 py-3 font-semibold text-slate-500">
               <div className="col-span-1 text-center">ลำดับ</div>
               <div className="col-span-2">เวลา</div>
               <div className="col-span-1 text-center">คอร์ท</div>
               <div className="col-span-2">ระดับ/กลุ่ม</div>
               <div className="col-span-3">ทีม</div>
               <div className="col-span-1 text-center">สถานะ</div>
               <div className="col-span-2 text-right">Match ID</div>
            </div>

            {/* Desktop Rows */}
            <div className="hidden md:block">
               {data.items.map((m, i) => (
                 <div key={m._id} className={`grid grid-cols-12 gap-2 items-center px-4 py-3 text-sm border-b border-gray-200 last:border-0 hover:bg-indigo-50/30 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                    <div className="col-span-1 text-center font-bold text-slate-400">{m.matchNo}</div>
                    <div className="col-span-2 font-medium text-slate-700">
                      {m.scheduledAt ? new Date(m.scheduledAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" }) : "-"}
                    </div>
                    <div className="col-span-1 text-center">
                       <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">{m.court || "-"}</span>
                    </div>
                    <div className="col-span-2 text-slate-600 text-xs">
                       <span className="font-semibold">{m.handLevel}</span> {m.group && <span>/ {m.group}</span>}
                    </div>
                    <div className="col-span-3">
                       <div className="truncate flex items-center gap-2">
                          <span className={`font-semibold ${m.winner && m.winner === m.team1 ? 'text-emerald-600' : 'text-slate-800'}`}>{teamName(m.team1)}</span>
                          <span className="text-slate-300 text-xs">vs</span>
                          <span className={`font-semibold ${m.winner && m.winner === m.team2 ? 'text-emerald-600' : 'text-slate-800'}`}>{teamName(m.team2)}</span>
                       </div>
                       {m.result && <div className="text-emerald-600 text-[10px] font-bold mt-1">ผล: {m.result}</div>}
                    </div>
                    <div className="col-span-1 text-center">
                       <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyle[m.status] || "bg-gray-100"}`}>
                          {m.status === "in-progress" ? "กำลังแข่ง" : m.status === "finished" ? "จบแล้ว" : "รอแข่ง"}
                       </span>
                    </div>
                    <div className="col-span-2 text-right text-slate-400 font-mono text-xs">{m.matchId}</div>
                 </div>
               ))}
            </div>

            {/* Mobile Cards (ใช้ MatchCard ที่ปรับใหม่) */}
            <div className="block md:hidden">
               {data.items.map((m) => <MatchCard key={m._id} m={m} />)}
            </div>

            {data.items.length === 0 && (
               <div className="text-center text-slate-400 py-12 flex flex-col items-center">
                  <span className="text-4xl mb-2">📭</span>
                  <span>ไม่พบข้อมูลแมทช์</span>
               </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && data.items.length > 0 && (
          <div className="flex items-center justify-between mt-3 text-sm">
             <div className="text-slate-500 text-xs">แสดง {data.items.length} จาก {data.total} รายการ</div>
             <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1.5 rounded border bg-white shadow-sm disabled:opacity-50 text-slate-600 hover:bg-slate-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ก่อนหน้า
                </button>
                <span className="text-slate-600 font-medium">{page} / {totalPages}</span>
                <button
                  className="px-3 py-1.5 rounded border bg-white shadow-sm disabled:opacity-50 text-slate-600 hover:bg-slate-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  ถัดไป
                </button>
             </div>
          </div>
        )}

        <footer className="text-center text-xs text-slate-300 mt-6">
           Update: {new Date().toLocaleTimeString("th-TH")}
        </footer>

      </div>
    </div>
  );
}