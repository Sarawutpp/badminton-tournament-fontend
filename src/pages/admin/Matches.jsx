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
  return { items: [], total: 0, page: 1, pageSize: fallbackPageSize };
}

export default function MatchesAdminPage() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [paging, setPaging] = React.useState({ total: 0, page: 1, pageSize: 50 });

  const [filters, setFilters] = React.useState({
    handLevel: "",
    group: "",
    q: "",
    onlyToday: false,
  });

  async function load(page = 1) {
    setLoading(true);
    setErr("");
    try {
      let res;
      // 1) ถ้ามี API แยกสำหรับ schedule ใช้ตัวนั้น
      if (API.listSchedule) {
        res = await API.listSchedule({
          handLevel: filters.handLevel || undefined,
          group: filters.group || undefined,
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
      setPaging((p) => ({
        ...p,
        total: 0,
        page,
      }));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div className="p-6 space-y-3">
      <h1 className="text-2xl font-bold">Matches — Group &amp; Schedule</h1>

      <div className="bg-white rounded-xl shadow p-3 grid grid-cols-1 md:grid-cols-3 gap-2">
        <div>
          <label className="text-sm text-slate-600">ระดับมือ</label>
          <select
            className="border rounded px-2 py-2 w-full"
            value={filters.handLevel}
            onChange={(e) => setFilters({ ...filters, handLevel: e.target.value })}
          >
            <option value="">ทั้งหมด</option>
            {HAND_LEVEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.labelShort || opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-600">กลุ่ม</label>
          <input
            className="border rounded px-2 py-2 w-full"
            placeholder="เช่น A, B, C..."
            value={filters.group}
            onChange={(e) => setFilters({ ...filters, group: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600">ค้นหา</label>
          <input
            className="border rounded px-2 py-2 w-full"
            placeholder="ชื่อทีม, Match ID, Court..."
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          className="px-3 py-1 border rounded text-sm"
          onClick={() => load(1)}
          disabled={loading}
        >
          โหลดข้อมูล
        </button>
      </div>

      {err && (
        <div className="p-3 bg-red-50 text-sm text-red-600 rounded">
          {err}
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-2 text-center w-16">แมตช์</th>
              <th className="p-2 text-center w-28">เวลา</th>
              <th className="p-2 text-center w-16">คอร์ท</th>
              <th className="p-2 text-left">คู่แข่ง</th>
              <th className="p-2 text-center w-24">ผล</th>
              <th className="p-2 text-center w-32">สถานะ</th>
              <th className="p-2 text-center w-40">Match ID</th>
            </tr>
          </thead>
          <tbody>
            {rows && rows.length > 0 ? (
              rows.map((m) => (
                <tr key={m._id || m.id} className="border-t">
                  <td className="p-2 text-center">{m.matchNo ?? m.no ?? "-"}</td>
                  <td className="p-2">
                    <input
                      className="border rounded px-2 py-1 w-28"
                      placeholder="HH:MM"
                      defaultValue={
                        m.scheduledAt
                          ? new Date(m.scheduledAt).toLocaleTimeString("th-TH", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""
                      }
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (!v) return;
                        const [hh, mm] = v.split(":");
                        if (hh && mm) {
                          const d = new Date();
                          const iso = new Date(
                            d.getFullYear(),
                            d.getMonth(),
                            d.getDate(),
                            +hh,
                            +mm
                          ).toISOString();
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
                  <td className="p-2">
                    <div className="truncate max-w-[320px]">
                      <strong>{teamName(m.team1) || m.team1?.name || "-"}</strong>{" "}
                      <span className="text-slate-400">vs</span>{" "}
                      <strong>{teamName(m.team2) || m.team2?.name || "-"}</strong>
                    </div>
                    <div className="text-xs text-slate-400">
                      {m.handLevel || m.level}
                      {m.group ? ` / กลุ่ม ${m.group}` : ""}
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    {m.score1 ?? 0}-{m.score2 ?? 0}
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
              ))
            ) : (
              <tr>
                <td className="p-4 text-center text-slate-500" colSpan={8}>
                  ไม่มีข้อมูล
                </td>
              </tr>
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
          <div>
            หน้า {paging.page} /{" "}
            {paging.pageSize > 0
              ? Math.max(1, Math.ceil(paging.total / paging.pageSize))
              : 1}
          </div>
          <button
            className="border rounded px-3 py-2"
            onClick={() =>
              load(
                Math.min(
                  Math.max(1, Math.ceil(paging.total / paging.pageSize)),
                  paging.page + 1
                )
              )
            }
            disabled={
              loading ||
              paging.page >=
                Math.max(1, Math.ceil(paging.total / paging.pageSize))
            }
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}
