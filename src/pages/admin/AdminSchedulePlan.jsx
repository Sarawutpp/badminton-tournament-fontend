// src/pages/admin/AdminSchedulePlan.jsx
// (เวอร์ชันออกแบบใหม่ - Master List Sorter)
import React from "react"; // <-- [!! แก้ไข !!] ต้อง import React ตัวเต็มมาใช้
import { API, teamName } from "@/lib/api.js";
import { HAND_LEVEL_OPTIONS } from "@/lib/types.js";

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

function Pagination({ page, pageSize, total, onPageChange, loading }) {
  return null; 
}

// ============ [!! START: ส่วนที่แก้ไข 1 (เพิ่ม Modal Component) !!] ============
/**
 * Modal Component สำหรับตั้งค่า Session
 * (วางไว้นอก Component หลัก)
 */
function SettingsModal({ isOpen, onClose, initialConfig, onSave }) {
  // สร้าง state ชั่วคราวสำหรับเก็บค่าใน Textarea ของ Modal
  const [tempConfig, setTempConfig] = React.useState(initialConfig);

  // อัปเดต state ชั่วคราว เมื่อ initialConfig (state จริง) เปลี่ยน
  React.useEffect(() => {
    setTempConfig(initialConfig);
  }, [initialConfig, isOpen]); // ให้รีเซ็ตค่าทุกครั้งที่เปิด Modal

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(tempConfig); // ส่งค่าใหม่กลับไปที่ state หลัก
    onClose(); // ปิด Modal
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity duration-300">
      {/* Modal Content */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg transform transition-all duration-300 scale-100">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold text-indigo-700">ตั้งค่าการจัดเรียง (Master Session Order)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>
        {/* Modal Body */}
        <div className="p-4">
          <p className="text-xs text-slate-600 mb-2">
            ใส่ประเภทมือที่ต้องการให้แข่งก่อน (1 บรรทัด = 1 เซสชั่น) คั่นด้วยจุลภาค (,)
            <br />
            เช่น: BABY, BGMix (เซสชั่น 1) บรรทัดถัดไป BG-, BGMen (เซสชั่น 2)
          </p>
          <textarea
            className="border rounded px-2 py-2 text-sm w-full font-mono bg-slate-50"
            rows={6}
            value={tempConfig}
            onChange={(e) => setTempConfig(e.target.value)}
            placeholder="BABY, BGMix&#10;BG-, BGMen&#10;P-, P+"
          />
        </div>
        {/* Modal Footer */}
        <div className="flex justify-end gap-2 p-4 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="border rounded px-4 py-2 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-100">
            ยกเลิก
          </button>
          <button onClick={handleSave} className="border rounded px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700">
            บันทึกค่า
          </button>
        </div>
      </div>
    </div>
  );
}
// ============ [!! END: ส่วนที่แก้ไข 1 !!] ============


export default function AdminSchedulePlan() {
  const [hand, setHand] = React.useState("");
  const [status, setStatus] = React.useState("scheduled");
  const [q, setQ] = React.useState("");
  const [data, setData] = React.useState({ items: [], total: 0, page: 1, pageSize });
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // ============ [!! START: ส่วนที่แก้ไข 2 (เพิ่ม State สำหรับ Modal) !!] ============
  const defaultSessionConfig = "BABY, BGMix\nBG-, BGMen";
  const [sessionConfig, setSessionConfig] = React.useState(defaultSessionConfig);
  const [showSettings, setShowSettings] = React.useState(false); // State ควบคุมการแสดง Modal
  // ============ [!! END: ส่วนที่แก้ไข 2 !!] ============

  const load = async (page = 1) => {
    try {
      setLoading(true);
      setErr("");
      const res = await API.listSchedule({
        page: 1, 
        pageSize: pageSize, 
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

  React.useEffect(() => { load(1); }, [hand, status, q]);

  function move(index, dir) {
    const arr = [...data.items];
    const j = index + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[index], arr[j]] = [arr[j], arr[index]];
    setData((d) => ({ ...d, items: arr }));
  }

  // ============ [!! START: ส่วนที่แก้ไข 3 (อัปเดต handleAutoSort) !!] ============
  // Auto sort by: [Major Group] -> stage -> groupRound -> handLevel -> group
  function handleAutoSort() {
    if (!data.items?.length) return;
    if (!window.confirm("ต้องการจัดเรียงอัตโนมัติ (ตามรอบ) ใช่หรือไม่?\nหมายเหตุ: ต้องกด Save Master Order เพื่อบันทึกถาวร")) return;

    // [!! NEW !!] 
    // 1. สร้าง Map จาก 'sessionConfig' state (ที่มาจาก Modal)
    const handLevelGroup = {};
    try {
      sessionConfig
        .split('\n') // แยกแต่ละบรรทัด (เซสชั่น)
        .forEach((line, sessionIndex) => {
          line.split(',') // แยกแต่ละประเภทมือ
            .forEach((hand) => {
              const cleanHand = hand.trim();
              if (cleanHand) {
                // ให้เลขเซสชั่น (บรรทัดที่ 1 = 1, บรรทัดที่ 2 = 2)
                handLevelGroup[cleanHand] = sessionIndex + 1;
              }
            });
        });
    } catch (e) {
      console.error("Error parsing session config:", e);
      alert("Error: ไม่สามารถอ่านค่า Master Session Order ได้");
      return;
    }

    // 2. ฟังก์ชันผู้ช่วย
    const getHandGroup = (m) => handLevelGroup[m.handLevel] || 99; // 99 = กลุ่มอื่นๆ ที่ไม่ได้ระบุ

    // --- ส่วนนี้เหมือนเดิม (ฟังก์ชันผู้ช่วยอื่นๆ) ---
    const stageOrder = (m) => {
      const s = String(m.stage || m.round || "").toLowerCase();
      if (s.includes("group")) return 1;
      if (s.includes("round of 16") || s.includes("r16")) return 2;
      if (s.includes("quarter") || s.includes("qf")) return 3;
      if (s.includes("semi") || s.includes("sf")) return 4;
      if (s.includes("final")) return 5;
      return 99;
    };

    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const getGroupRound = (m) => {
      let round = toNum(m.groupRound) || toNum(m.roundNo) || toNum(m.groupMatchNo) || toNum(m.groupOrder);
      if (round !== 0) return round;
      if (m.matchId) {
        try {
          const match = String(m.matchId).match(/-R(\d+)-/); 
          if (match && match[1]) {
            round = toNum(match[1]);
            if (round !== 0) return round;
          }
        } catch (e) { /* (ปล่อยผ่าน) */ }
      }
      return 99;
    };
    // --- สิ้นสุดส่วนเหมือนเดิม ---


    // 3. ตรรกะการจัดเรียง (ใช้ logic ล่าสุด)
    const sorted = [...data.items].sort((a, b) => {
      // 1. เรียงตาม 'กลุ่มใหญ่' (Session) ก่อน
      const groupA = getHandGroup(a);
      const groupB = getHandGroup(b);
      if (groupA !== groupB) {
        return groupA - groupB;
      }

      // 2. ถ้า 'กลุ่มใหญ่' เดียวกัน ให้เรียงตาม 'stage' (รอบการแข่ง)
      let c = stageOrder(a) - stageOrder(b);
      if (c !== 0) return c;

      // 3. ถ้า 'stage' เดียวกัน (เช่น รอบแบ่งกลุ่ม)
      if (stageOrder(a) === 1) { 
        // 3a. เรียงตาม 'นัดที่' (groupRound) (เช่น R1 ทั้งหมด)
        const roundA = getGroupRound(a);
        const roundB = getGroupRound(b);
        if (roundA !== roundB) {
          return roundA - roundB;
        }
        // 3b. ถ้า 'นัดที่' เดียวกัน (เช่น R1)
        // ให้เรียงตาม 'ประเภทมือ' (handLevel) (เช่น BABY R1 มาก่อน BGMix R1)
        c = String(a.handLevel || "").localeCompare(String(b.handLevel || ""));
        if (c !== 0) return c;
        // 3c. ถ้า 'ประเภทมือ' เดียวกัน ให้เรียงตาม 'กลุ่ม' (group) (A, B, C)
        c = String(a.group || "").localeCompare(String(b.group || ""));
        if (c !== 0) return c;
      } else {
        // (สำหรับรอบน็อคเอาท์)
        // 4a. เรียงตาม 'ประเภทมือ' (handLevel)
        c = String(a.handLevel || "").localeCompare(String(b.handLevel || ""));
        if (c !== 0) return c;
      }

      // 5. เรียงตาม 'matchNo' เดิม เป็นลำดับสุดท้าย
      return toNum(a.matchNo) - toNum(b.matchNo);
    });

    setData((d) => ({ ...d, items: sorted }));
    alert("จัดเรียงอัตโนมัติสำเร็จ!\nกรุณาตรวจสอบและกด 'Save Master Order' เพื่อยืนยันการบันทึก");
  }
  // ============ [!! END: ส่วนที่แก้ไข 3 !!] ============

  async function saveOrder() {
    setSaving(true);
    setErr("");
    try {
      const orderedIds = data.items.map((m) => m._id);
      const res = await API.reorderMatches({
        orderedIds,
      });
      alert(`บันทึกลำดับใหม่ ${res.updated} แมทช์`);
      await load(data.page); 
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
        
        {/* ============ [!! START: ส่วนที่แก้ไข 4 (อัปเดต Header UI) !!] ============ */}
        <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-indigo-700">Schedule Plan (Master List)</h1>
            <p className="text-slate-600 text-xs md:text-sm">จัดลำดับ และใส่เวลาคาดการณ์ (ไม่ต้องใส่คอร์ท)</p>
          </div>
          
          {/* เพิ่ม flex container เพื่อรวม Filter และ ปุ่มตั้งค่า */}
          <div className="flex items-start gap-2">
            {/* Filter (เหมือนเดิม) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-white rounded-2xl shadow p-2 md:p-3">
              <select className="border rounded px-2 py-2 text-sm" value={hand} onChange={(e) => setHand(e.target.value)}>
                <option value="">ทุกระดับมือ</option>
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

            {/* ปุ่มตั้งค่า (Settings Button) */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-3 bg-white rounded-2xl shadow hover:bg-slate-50 text-slate-600 hover:text-indigo-700"
              title="ตั้งค่าการจัดเรียง"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
          </div>
        </header>
        {/* ============ [!! END: ส่วนที่แก้ไข 4 !!] ============ */}


        {err && <div className="text-red-600 bg-red-100 p-3 rounded-md mb-4">{err}</div>}

        {/* (ส่วนตาราง ... เหมือนเดิมทุกอย่าง) */}
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

        {/* (ส่วนปุ่ม ... เหมือนเดิม) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
          <button
            className="border rounded px-4 py-2 bg-amber-500 text-white font-bold shadow-sm hover:bg-amber-600 disabled:bg-gray-400 w-full md:w-auto"
            onClick={handleAutoSort}
            disabled={loading || saving || !data.items.length}
          >
            จัดเรียงอัตโนมัติ (ตามรอบ)
          </button>
          <button
            className="border rounded px-4 py-2 bg-green-600 text-white font-bold shadow-sm hover:bg-green-700 disabled:bg-gray-400 w-full md:w-auto"
            onClick={saveOrder}
            disabled={loading || saving || !data.items.length}
          >
            {saving ? "กำลังบันทึก..." : "Save Master Order"}
          </button>
          
          <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={load} loading={loading} />
        </div>
      </div>

      {/* ============ [!! START: ส่วนที่แก้ไข 5 (Render Modal) !!] ============ */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        initialConfig={sessionConfig}
        onSave={(newConfig) => {
          setSessionConfig(newConfig);
          // (onSave ใน Modal จะอัปเดต state หลัก)
        }}
      />
      {/* ============ [!! END: ส่วนที่แก้ไข 5 !!] ============ */}
    </div>
  );
}