// src/pages/admin/Matches.jsx
import React from "react";
import { API, teamName } from "@/lib/api.js"; // <-- 1. แก้ไข path
import { HAND_LEVEL_OPTIONS } from "@/lib/types.js"; // <-- 2. Import มาตรฐาน

// แปลงผลลัพธ์ให้เป็นรูป { items, total, page, pageSize } เสมอ
function normalizeScheduleResponse(res, fallbackPageSize = 50) {
  if (Array.isArray(res)) {
    return { items: res, total: res.length, page: 1, pageSize: fallbackPageSize };
  }
  if (res && Array.isArray(res.items)) {
    return {
      items: res.items,
      total: Number(res.total ?? res.items.length),
      page: Number(res.page ?? 1),
      pageSize: Number(res.pageSize ?? fallbackPageSize),
    };
  }
  // กรณีแปลก ๆ (null/undefined หรือ object ไม่มี items) — กันพัง
  return { items: [], total: 0, page: 1, pageSize: fallbackPageSize };
}

export default function MatchesAdmin() {
  const [rows, setRows] = React.useState([]);
  const [paging, setPaging] = React.useState({ total: 0, page: 1, pageSize: 50 });
  const [filters, setFilters] = React.useState({ handLevel: "Baby", status: "scheduled", q: "" });
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");

  async function load(page = 1) {
    try {
      setLoading(true);
      setErr("");

      let res;
      if (typeof API.listSchedule === "function") {
        res = await API.listSchedule({
          page,
          pageSize: paging.pageSize,
          handLevel: filters.handLevel,
          status: filters.status,
          q: filters.q,
          sort: "scheduledAt,matchNo",
        });
      } else {
        // กันพังกรณีลืมเพิ่ม listSchedule ใน api.js
        res = await API.listAllMatches();
      }

      const norm = normalizeScheduleResponse(res, paging.pageSize);
      setRows(norm.items);
      setPaging({ total: norm.total, page: norm.page, pageSize: norm.pageSize });
    } catch (e) {
      setErr(e.message || "โหลดข้อมูลไม่สำเร็จ");
      setRows([]);
      setPaging((p) => ({ ...p, total: 0 }));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(1); }, [filters.handLevel, filters.status]);

  async function saveRow(m, patch) {
    try {
      setLoading(true);
      await API.updateMatch(m._id, patch);
      await load(paging.page);
    } catch (e) {
      alert(e.message || "บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  const onScoreBlur = (m, val) => {
    const [a, b] = String(val).split("-").map((x) => parseInt(x, 10));
    if (!isNaN(a) && !isNaN(b)) {
      const status = a === b ? m.status : "finished";
      saveRow(m, { score1: a, score2: b, status });
    }
  };

  return (
    <div className="p-6 space-y-3">
      <h1 className="text-2xl font-bold">Matches — Group & Schedule</h1>

      <div className="bg-white rounded-xl shadow p-3 grid grid-cols-1 md:grid-cols-3 gap-2">
        <div>
          <label className="text-sm text-slate-600">ระดับมือ</label>
          <select
            className="border rounded px-2 py-2 w-full"
            value={filters.handLevel}
            onChange={(e) => setFilters({ ...filters, handLevel: e.target.value })}
          >
            {/* 3. วนลูปจาก HAND_LEVEL_OPTIONS */}
            {HAND_LEVEL_OPTIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-600">สถานะ</label>
          <select
            className="border rounded px-2 py-2 w-full"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="scheduled">รอแข่ง</option>
            <option value="in-progress">กำลังแข่ง</option>
            <option value="finished">จบแล้ว</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-600">ค้นหา (Match ID/ทีม)</label>
          <div className="flex gap-2">
            <input
              className="border rounded px-3 py-2 w-full"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
            <button className="border rounded px-3" onClick={() => load(1)} disabled={loading}>ค้นหา</button>
          </div>
        </div>
      </div>

      {err && <div className="text-red-600">{err}</div>}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-[960px] w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 text-center">ลำดับ</th>
              <th className="p-2">เวลา</th>
              <th className="p-2 text-center">คอร์ท</th>
              <th className="p-2">ระดับ/กลุ่ม</th>
              <th className="p-2">ทีม</th>
              <th className="p-2 text-center">ผล (เกม)</th>
              <th className="p-2 text-center">สถานะ</th>
              <th className="p-2 text-center">Match ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((m) => (
              <tr key={m._id || m.id} className="border-t">
                <td className="p-2 text-center">{m.matchNo ?? m.no ?? "-"}</td>
                <td className="p-2">
                  <input
                    className="border rounded px-2 py-1 w-28"
                    placeholder="HH:MM"
                    defaultValue={
                      m.scheduledAt
                        ? new Date(m.scheduledAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
                        : ""
                    }
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (!v) return;
                      const [hh, mm] = v.split(":");
                      if (hh && mm) {
                        const d = new Date();
                        const iso = new Date(d.getFullYear(), d.getMonth(), d.getDate(), +hh, +mm).toISOString();
                        saveRow(m, { scheduledAt: iso });
                      }
                    }}
                  />
                </td>
                <td className="p-2 text-center">
                  <input
                    className="border rounded px-2 py-1 w-16 text-center"
                    defaultValue={m.court || ""}
                    onBlur={(e) => saveRow(m, { court: e.target.value })}
                  />
                </td>
                <td className="p-2">{m.handLevel || m.level}{m.group ? ` / ${m.group}` : ""}</td>
                <td className="p-2">
                  <div className="truncate max-w-[320px]">
                    <strong>{teamName(m.team1) || m.team1?.name || "-"}</strong>{" "}
                    <span className="text-slate-400">vs</span>{" "}
                    <strong>{teamName(m.team2) || m.team2?.name || "-"}</strong>
                  </div>
                </td>
                <td className="p-2 text-center">
                  <input
                    className="border rounded px-2 py-1 w-24 text-center"
                    defaultValue={`${m.score1 ?? 0}-${m.score2 ?? 0}`}
                    onBlur={(e) => onScoreBlur(m, e.target.value)}
                  />
                </td>
                <td className="p-2 text-center">
                  <select
                    className="border rounded px-2 py-1"
                    defaultValue={m.status || "scheduled"}
                    onChange={(e) => saveRow(m, { status: e.target.value })}
                  >
                    <option value="scheduled">รอแข่ง</option>
                    <option value="in-progress">กำลังแข่ง</option>
                    <option value="finished">จบแล้ว</option>
                  </select>
                </td>
                <td className="p-2 text-center">{m.matchId || "-"}</td>
              </tr>
            )) : (
              <tr><td className="p-4 text-center text-slate-500" colSpan={8}>ไม่มีข้อมูล</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-slate-500">รวม {paging.total} แมท</div>
        <div className="flex items-center gap-3">
          <button
            className="border rounded px-3 py-2"
            onClick={() => load(Math.max(1, paging.page - 1))}
            disabled={loading || paging.page <= 1}
          >
            ก่อนหน้า
          </button>
          <div>หน้า {paging.page}</div>
          <button
            className="border rounded px-3 py-2"
            onClick={() => load(paging.page + 1)}
            disabled={loading || (paging.page * paging.pageSize) >= paging.total}
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}