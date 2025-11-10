// src/pages/public/PublicCourtRunning.jsx
// (หน้าใหม่สำหรับ User ดูคอร์ทที่กำลังแข่ง)

import React, { useState, useEffect, useMemo } from "react";
import { API, teamName } from "@/lib/api.js";

// (คัดลอก statusStyle มาจาก Schedule.jsx)
const statusStyle = {
  finished: "bg-emerald-100 text-emerald-700",
  "in-progress": "bg-amber-100 text-amber-800",
  scheduled: "bg-sky-100 text-sky-700", 
};

// Component "การ์ด" สำหรับคอร์ท
function CourtCard({ courtNumber, match }) {
  return (
    <div className="bg-white rounded-xl shadow border h-full flex flex-col">
      {/* 1. หมายเลขคอร์ท */}
      <div className="p-4 border-b">
        <h3 className="font-bold text-lg">คอร์ท {courtNumber}</h3>
      </div>
      
      {/* 2. เนื้อหา (ว่า "ว่าง" หรือ "กำลังแข่ง") */}
      <div className="p-4 flex-grow">
        {!match ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            -- ว่าง --
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-indigo-600 font-semibold">
                {match.handLevel} / {match.group}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs ${statusStyle[match.status]}`}>
                แข่งอยู่
              </span>
            </div>
            <div className="mt-1">
              <strong>{teamName(match.team1)}</strong>
              <span className="text-gray-400"> vs </span>
              <strong>{teamName(match.team2)}</strong>
            </div>
            <div className="text-xs text-gray-500 mt-1">{match.matchId}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Component หลัก
export default function PublicCourtRunning() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [inProgress, setInProgress] = useState([]); // แมทช์ที่ "in-progress"
  
  // (สมมติว่ามี 14 คอร์ท)
  const NUM_COURTS = 14; 
  const courts = Array.from({ length: NUM_COURTS }, (_, i) => i + 1);

  const loadAll = async () => {
    setLoading(true);
    setErr("");
    try {
      // ดึงเฉพาะแมทช์ที่ "กำลังแข่ง" ทั้งหมด
      const progressRes = await API.listSchedule({ status: "in-progress", pageSize: 50 });
      setInProgress(progressRes.items || []);
    } catch (e) {
      setErr(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // (ตั้ง Auto-refresh ทุก 30 วินาที)
    const interval = setInterval(loadAll, 30000); 
    return () => clearInterval(interval);
  }, []);

  // สร้าง Map (Object) เพื่อให้หาแมทช์ตามคอร์ทได้ง่าย
  // { '1': match, '2': null, '3': match, ... }
  const matchesByCourt = useMemo(() => {
    const map = {};
    for (const m of inProgress) {
      if (m.court) {
        map[m.court] = m;
      }
    }
    return map;
  }, [inProgress]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">คอร์ทที่กำลังแข่ง (Live)</h2>
          <p className="text-sm text-gray-500">
            (รีเฟรชอัตโนมัติทุก 30 วินาที)
          </p>
        </div>
        <button
          className="px-4 py-2 border rounded-md bg-white shadow-sm disabled:opacity-50"
          onClick={loadAll}
          disabled={loading}
        >
          {loading ? "..." : "Refresh"}
        </button>
      </div>

      {err && <div className="text-red-600 bg-red-100 p-3 rounded-md mb-4">{err}</div>}

      {loading && inProgress.length === 0 && (
        <div className="text-center text-gray-500 p-8">กำลังโหลด...</div>
      )}
      
      {!loading && inProgress.length === 0 && (
        <div className="text-center text-gray-500 p-8">ไม่มีคอร์ทที่กำลังแข่งขัน</div>
      )}

      {/* Responsive Grid (Mobile 1, Tablet 2, PC 3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courts.map(num => {
          const match = matchesByCourt[num];
          return (
            <CourtCard
              key={num}
              courtNumber={num}
              match={match}
            />
          );
        })}
      </div>
    </div>
  );
}