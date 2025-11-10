// src/pages/admin/AdminSchedulePlan.jsx
// (เวอร์ชันออกแบบใหม่ - Master List Sorter)
import React from "react";
import { API, teamName } from "@/lib/api.js";
import { HAND_LEVEL_OPTIONS } from "@/lib/types.js"; // <-- 1. Import มาตรฐาน

// ============ [!! START: ส่วนที่แก้ไข !!] ============

// แก้ไข 1: เพิ่ม pageSize ให้สูงมากๆ เพื่อโหลดทั้งหมดมาเรียง
const pageSize = 5000; 

function formatTime(isoString) {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok",
    });
  } catch (e) { return ""; }
}

// แก้ไข 2: ปิดการใช้งาน Pagination (ซ่อนมันไปเลย)
function Pagination({ page, pageSize, total, onPageChange, loading }) {
  return null; // <-- ซ่อน Pagination
}

export default function AdminSchedulePlan() {
  const [hand, setHand] = React.useState("");
  const [status, setStatus] = React.useState("scheduled");
  const [q, setQ] = React.useState("");
  const [data, setData] = React.useState({ items: [], total: 0, page: 1, pageSize });
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = async (page = 1) => {
    try {
      setLoading(true);
      setErr("");
      const res = await API.listSchedule({
        page: 1, // แก้ไข 3: บังคับให้โหลดหน้า 1 เสมอ
        pageSize: pageSize, // ใช้ pageSize ค่าสูงสุด
        handLevel: hand,
        status,
        q,
        sort: "matchNo", 
      });
      setData(res);
    } catch (e) {
      setErr(e.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };
// ============ [!! END: ส่วนที่แก้ไข !!] ============

  React.useEffect(() => { load(1); }, [hand, status, q]);

  function move(index, dir) {
    const arr = [...data.items];
    const j = index + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[index], arr[j]] = [arr[j], arr[index]];
    setData((d) => ({ ...d, items: arr }));
  }

  async function saveOrder() {
    setSaving(true);
    setErr("");
    try {
      const orderedIds = data.items.map((m) => m._id);
      const res = await API.reorderMatches({
        orderedIds,
      });
      alert(`บันทึกลำดับใหม่ ${res.updated} แมทช์`);
      await load(data.page); // โหลดหน้าเดิม (ซึ่งก็คือหน้า 1)
    } catch (e) {
      setErr(e.message || "บันทึกลำดับไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function saveOneTime(matchId, timeString) {
    if (!timeString.match(/^\d{1,2}:\d{2}$/)) return;
    const [hh, mm] = timeString.split(":");
    const d = new Date(); 
    const iso = new Date(d.getFullYear(), d.getMonth(), d.getDate(), +hh, +mm).toISOString();
    
    try {
      await API.updateSchedule(matchId, { scheduledAt: iso });
    } catch (e) {
      console.error("Save time failed:", e);
      setErr(`อัปเดตเวลาไม่สำเร็จ`);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-indigo-700">Schedule Plan (Master List)</h1>
            <p className="text-slate-600 text-xs md:text-sm">จัดลำดับ และใส่เวลาคาดการณ์ (ไม่ต้องใส่คอร์ท)</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-white rounded-2xl shadow p-2 md:p-3">
            <select className="border rounded px-2 py-2 text-sm" value={hand} onChange={(e) => setHand(e.target.value)}>
              <option value="">ทุกระดับมือ</option>
              {/* 2. วนลูปจาก HAND_LEVEL_OPTIONS */}
              {HAND_LEVEL_OPTIONS.map((x) => ( <option key={x} value={x}>{x}</option> ))}
            </select>
            <select className="border rounded px-2 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="scheduled">รอแข่ง</option>
              <option value="in-progress">กำลังแข่ง</option>
              <option value="finished">จบแล้ว</option>
              <option value="">ทั้งหมด</option>
            </select>
            <input
              type="text"
              placeholder="ค้นหา (ชื่อทีม, Match ID)"
              className="border rounded px-2 py-2 text-sm col-span-2"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </header>

        {err && <div className="text-red-600 bg-red-100 p-3 rounded-md mb-4">{err}</div>}

        <div className="bg-white rounded-2xl shadow ring-1 ring-slate-200 overflow-hidden">
          <div className="sticky top-0 bg-slate-100 border-b text-[13px] grid grid-cols-12 gap-2 px-3 py-2 font-semibold text-slate-600">
            <div className="col-span-1 text-center">เรียง</div>
            <div className="col-span-1 text-center">ลำดับ</div>
            <div className="col-span-2">เวลาคาดการณ์ (น.)</div>
            <div className="col-span-3">ระดับ/กลุ่ม</div>
            <div className="col-span-3">ทีม (T1 vs T2)</div>
            <div className="col-span-2 text-center">Match ID</div>
          </div>

          {loading && !data.items.length && <div className="px-4 py-8 text-center text-slate-500 text-sm">กำลังโหลด...</div>}
          {!loading && !data.items.length && <div className="px-4 py-8 text-center text-slate-500 text-sm">ไม่มีข้อมูล</div>}
          
          {data.items.map((m, i) => (
            <div key={m._id} className="grid grid-cols-12 gap-2 items-center px-3 py-2 border-b last:border-0 text-sm">
              <td className="col-span-1 text-center">
                <div className="flex gap-1 justify-center">
                  <button className="border rounded p-1 enabled:hover:bg-slate-100 disabled:opacity-30" onClick={() => move(i, -1)} disabled={i === 0}>▲</button>
                  <button className="border rounded p-1 enabled:hover:bg-slate-100 disabled:opacity-30" onClick={() => move(i, 1)} disabled={i === data.items.length - 1}>▼</button>
                </div>
              </td>
              <td className="col-span-1 text-center font-medium">{m.matchNo ?? "-"}</td>
              <td className="col-span-2">
                <input
                  className="border rounded px-2 py-1 w-full"
                  placeholder="HH:MM"
                  defaultValue={formatTime(m.scheduledAt)}
                  onBlur={(e) => saveOneTime(m._id, e.target.value.trim())}
                />
              </td>
              <td className="col-span-3 text-slate-700">{m.handLevel}{m.group ? ` / ${m.group}` : ""}</td>
              <td className="col-span-3 truncate">
                <strong className="font-semibold">{teamName(m.team1)}</strong>
                <span className="text-slate-400 font-normal"> vs </span>
                <strong className="font-semibold">{teamName(m.team2)}</strong>
              </td>
              <td className="col-span-2 text-center text-slate-600 font-medium">{m.matchId || "-"}</td>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
          <button
            className="border rounded px-4 py-2 bg-green-600 text-white font-bold shadow-sm hover:bg-green-700 disabled:bg-gray-400 w-full md:w-auto"
            onClick={saveOrder}
            disabled={loading || saving || !data.items.length}
          >
            {saving ? "กำลังบันทึก..." : "Save Master Order"}
          </button>
          
          {/* แก้ไข 4: Pagination จะถูกซ่อนโดยอัตโนมัติ (เพราะเรา return null) */}
          <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={load} loading={loading} />
        </div>
      </div>
    </div>
  );
}