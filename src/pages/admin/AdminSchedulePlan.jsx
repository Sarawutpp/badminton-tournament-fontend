// src/pages/admin/AdminSchedulePlan.jsx
// (เวอร์ชันออกแบบใหม่ - Master List Sorter + กันพัง data.items)

import React from "react";
import { API, teamName } from "@/lib/api.js";
import { HAND_LEVEL_OPTIONS } from "@/lib/types.js";

const pageSize = 5000;

// ---- helper แปลงผลลัพธ์จาก API ให้เป็นรูปเดียวกันเสมอ ----
function normalizeScheduleResponse(res) {
  if (Array.isArray(res)) {
    return {
      items: res,
      total: res.length,
      page: 1,
      pageSize,
    };
  }
  if (res && Array.isArray(res.items)) {
    return {
      items: res.items,
      total: Number(res.total ?? res.items.length),
      page: Number(res.page ?? 1),
      pageSize: Number(res.pageSize ?? pageSize),
    };
  }
  return {
    items: [],
    total: 0,
    page: 1,
    pageSize,
  };
}

function formatTime(isoString) {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok",
    });
  } catch (e) {
    return "";
  }
}

function Pagination({ page, pageSize, total, onPageChange, loading }) {
  return null; // ตอนนี้ยังไม่ได้ใช้ pagination จริง
}

// ============ Modal สำหรับตั้งค่า Session ============

function SettingsModal({ isOpen, onClose, initialConfig, onSave }) {
  const [tempConfig, setTempConfig] = React.useState(initialConfig);

  React.useEffect(() => {
    setTempConfig(initialConfig);
  }, [initialConfig, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(tempConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg transform transition-all duration-300 scale-100">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold text-indigo-700">
            ตั้งค่าการจัดเรียง (Master Session Order)
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

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

        <div className="flex justify-end gap-2 p-4 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="border rounded px-4 py-2 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-100"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="border rounded px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
          >
            บันทึกค่า
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Component หลัก ============

export default function AdminSchedulePlan() {
  const [hand, setHand] = React.useState("");
  const [status, setStatus] = React.useState(""); // ให้ default = ทุกสถานะ
  const [q, setQ] = React.useState("");
  const [data, setData] = React.useState({
    items: [],
    total: 0,
    page: 1,
    pageSize,
  });
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const defaultSessionConfig = "BABY, BGMix\nBG-, BGMen";
  const [sessionConfig, setSessionConfig] = React.useState(
    defaultSessionConfig
  );
  const [showSettings, setShowSettings] = React.useState(false);

  const load = async (page = 1) => {
    try {
      setLoading(true);
      setErr("");
      const res = await API.listSchedule({
        page: 1,
        pageSize,
        handLevel: hand || undefined,
        status: status || undefined,
        q: q || undefined,
        sort: "matchNo", // ใช้ลำดับหลักจาก matchNo
      });

      const norm = normalizeScheduleResponse(res);
      setData(norm);
    } catch (e) {
      console.error(e);
      setErr(e.message || "โหลดข้อมูลไม่สำเร็จ");
      setData({
        items: [],
        total: 0,
        page: 1,
        pageSize,
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hand, status, q]);

  // ให้มีตัวแปร items / total ที่กัน undefined แล้วใช้ตลอดด้านล่าง
  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
    ? data
    : [];
  const total = Number(data?.total ?? items.length);

  function move(index, dir) {
    const arr = [...items];
    const j = index + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[index], arr[j]] = [arr[j], arr[index]];
    setData((d) => ({ ...d, items: arr }));
  }

  // ============ Auto Sort (ตามรอบ + session) ============

  function handleAutoSort() {
    if (!items.length) return;
    if (
      !window.confirm(
        "ต้องการจัดเรียงอัตโนมัติ (ตามรอบ) ใช่หรือไม่?\nหมายเหตุ: ต้องกด Save Master Order เพื่อบันทึกถาวร"
      )
    )
      return;

    const handLevelGroup = {};
    try {
      sessionConfig.split("\n").forEach((line, sessionIndex) => {
        line.split(",").forEach((hand) => {
          const cleanHand = hand.trim();
          if (cleanHand) {
            handLevelGroup[cleanHand] = sessionIndex + 1;
          }
        });
      });
    } catch (e) {
      console.error("Error parsing session config:", e);
      alert("Error: ไม่สามารถอ่านค่า Master Session Order ได้");
      return;
    }

    const getHandGroup = (m) => handLevelGroup[m.handLevel] || 99;

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
      let round =
        toNum(m.groupRound) ||
        toNum(m.roundNo) ||
        toNum(m.groupMatchNo) ||
        toNum(m.groupOrder);
      if (round !== 0) return round;
      if (m.matchId) {
        try {
          const match = String(m.matchId).match(/-R(\d+)-/);
          if (match && match[1]) {
            round = toNum(match[1]);
            if (round !== 0) return round;
          }
        } catch (e) {}
      }
      return 99;
    };

    const sorted = [...items].sort((a, b) => {
      const groupA = getHandGroup(a);
      const groupB = getHandGroup(b);
      if (groupA !== groupB) return groupA - groupB;

      let c = stageOrder(a) - stageOrder(b);
      if (c !== 0) return c;

      if (stageOrder(a) === 1) {
        const roundA = getGroupRound(a);
        const roundB = getGroupRound(b);
        if (roundA !== roundB) return roundA - roundB;

        c = String(a.handLevel || "").localeCompare(
          String(b.handLevel || "")
        );
        if (c !== 0) return c;

        c = String(a.group || "").localeCompare(String(b.group || ""));
        if (c !== 0) return c;
      } else {
        c = String(a.handLevel || "").localeCompare(
          String(b.handLevel || "")
        );
        if (c !== 0) return c;
      }

      return toNum(a.matchNo) - toNum(b.matchNo);
    });

    setData((d) => ({ ...d, items: sorted }));
    alert(
      "จัดเรียงอัตโนมัติสำเร็จ!\nกรุณาตรวจสอบและกด 'Save Master Order' เพื่อยืนยันการบันทึก"
    );
  }

  // ============ Auto Time (35 นาที / 14 แมท) ============

  async function handleAutoTime() {
    if (!items.length) return;

    const ok = window.confirm(
      "ต้องการกำหนดเวลาคาดการณ์อัตโนมัติหรือไม่?\n" +
        "- เริ่มจาก 09:00\n" +
        "- 1 slot = 14 แมท\n" +
        "- แต่ละ slot เพิ่ม 35 นาที (เช่น 09:00, 09:35, 10:10, ...)"
    );
    if (!ok) return;

    setSaving(true);
    setErr("");

    try {
      // Ensure the current master order is saved before assigning times
      const orderedIds = items.map((m) => m._id);
      if (orderedIds.length) {
        await API.reorderMatches({ orderedIds });
      }

      const BASE_HOUR = 9;
      const BASE_MINUTE = 0;
      const SLOT_MINUTES = 35;
      const MATCH_PER_SLOT = 14;

      const today = new Date();

      const tasks = items.map((m, index) => {
        const slotIndex = Math.floor(index / MATCH_PER_SLOT);
        const plusMinutes = SLOT_MINUTES * slotIndex;

        const base = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          BASE_HOUR,
          BASE_MINUTE,
          0,
          0
        );
        const dt = new Date(base.getTime() + plusMinutes * 60 * 1000);

        return API.updateSchedule(m._id, {
          scheduledAt: dt.toISOString(),
        });
      });

      await Promise.all(tasks);
      await load(data.page);
      alert("กำหนดเวลาอัตโนมัติเรียบร้อยแล้ว 🎉");
    } catch (e) {
      console.error(e);
      setErr(e.message || "กำหนดเวลาอัตโนมัติไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  // ============ Save Order ============

  async function saveOrder() {
    setSaving(true);
    setErr("");
    try {
      const orderedIds = items.map((m) => m._id);
      const res = await API.reorderMatches({
        orderedIds,
      });
      alert(`บันทึกลำดับใหม่ ${res.updated} แมทช์`);
      await load(data.page);
    } catch (e) {
      console.error(e);
      setErr(e.message || "บันทึกลำดับไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function saveOneTime(matchId, timeString) {
    let v = timeString.trim();
    if (!v) return;

    // รองรับ 9.00, 9, 09, 09:30 ฯลฯ
    v = v.replace(".", ":");
    if (/^\d{1,2}$/.test(v)) {
      v = v + ":00";
    }

    if (!/^\d{1,2}:\d{2}$/.test(v)) {
      setErr("กรอกเวลาในรูปแบบ HH:MM เช่น 9:00 หรือ 09:30");
      return;
    }

    const [hh, mm] = v.split(":");
    const d = new Date();
    const iso = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      Number(hh),
      Number(mm)
    ).toISOString();

    try {
      await API.updateSchedule(matchId, { scheduledAt: iso });
    } catch (e) {
      console.error("Save time failed:", e);
      setErr(`อัปเดตเวลาไม่สำเร็จ`);
    }
  }

  // ============ Render ============

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-indigo-700">
              Schedule Plan (Master List)
            </h1>
            <p className="text-slate-600 text-xs md:text-sm">
              จัดลำดับ และใส่เวลาคาดการณ์ (ไม่ต้องใส่คอร์ท)
            </p>
          </div>

          <div className="flex items-start gap-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-white rounded-2xl shadow p-2 md:p-3">
              <select
                className="border rounded px-2 py-2 text-sm"
                value={hand}
                onChange={(e) => setHand(e.target.value)}
              >
                <option value="">ทุกระดับมือ</option>
                {HAND_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.labelShort || opt.label}
                  </option>
                ))}
              </select>
              <select
                className="border rounded px-2 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">ทุกสถานะ</option>
                <option value="scheduled">รอแข่ง</option>
                <option value="in-progress">กำลังแข่ง</option>
                <option value="finished">จบแล้ว</option>
              </select>
              <input
                type="text"
                placeholder="ค้นหา (ชื่อทีม, Match ID)"
                className="border rounded px-2 py-2 text-sm col-span-2"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <button
              onClick={() => setShowSettings(true)}
              className="p-3 bg-white rounded-2xl shadow hover:bg-slate-50 text-slate-600 hover:text-indigo-700"
              title="ตั้งค่าการจัดเรียง"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
          </div>
        </header>

        {err && (
          <div className="text-red-600 bg-red-100 p-3 rounded-md mb-4">
            {err}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow ring-1 ring-slate-200 overflow-hidden">
          <div className="sticky top-0 bg-slate-100 border-b text-[13px] grid grid-cols-12 gap-2 px-3 py-2 font-semibold text-slate-600">
            <div className="col-span-1 text-center">เรียง</div>
            <div className="col-span-1 text-center">ลำดับ</div>
            <div className="col-span-2">เวลาคาดการณ์ (น.)</div>
            <div className="col-span-3">ระดับ/กลุ่ม</div>
            <div className="col-span-3">ทีม (T1 vs T2)</div>
            <div className="col-span-2 text-center">Match ID</div>
          </div>

          {loading && !items.length && (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">
              กำลังโหลด...
            </div>
          )}
          {!loading && !items.length && (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">
              ไม่มีข้อมูล
            </div>
          )}

          {items.map((m, i) => (
            <div
              key={m._id}
              className="grid grid-cols-12 gap-2 items-center px-3 py-2 border-b last:border-0 text-sm"
            >
              <div className="col-span-1 text-center">
                <div className="flex gap-1 justify-center">
                  <button
                    className="border rounded p-1 enabled:hover:bg-slate-100 disabled:opacity-30"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                  >
                    ▲
                  </button>
                  <button
                    className="border rounded p-1 enabled:hover:bg-slate-100 disabled:opacity-30"
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                  >
                    ▼
                  </button>
                </div>
              </div>
              <div className="col-span-1 text-center font-medium">
                {m.matchNo ?? "-"}
              </div>
              <div className="col-span-2">
                <input
                  className="border rounded px-2 py-1 w-full"
                  placeholder="เช่น 09:00"
                  defaultValue={formatTime(m.scheduledAt)}
                  onBlur={(e) => saveOneTime(m._id, e.target.value.trim())}
                />
              </div>
              <div className="col-span-3 text-slate-700">
                {m.handLevel}
                {m.group ? ` / ${m.group}` : ""}
              </div>
              <div className="col-span-3 truncate">
                <strong className="font-semibold">
                  {teamName(m.team1)}
                </strong>
                <span className="text-slate-400 font-normal"> vs </span>
                <strong className="font-semibold">
                  {teamName(m.team2)}
                </strong>
              </div>
              <div className="col-span-2 text-center text-slate-600 font-medium">
                {m.matchId || "-"}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
          <button
            className="border rounded px-4 py-2 bg-amber-500 text-white font-bold shadow-sm hover:bg-amber-600 disabled:bg-gray-400 w-full md:w-auto"
            onClick={handleAutoSort}
            disabled={loading || saving || !items.length}
          >
            จัดเรียงอัตโนมัติ (ตามรอบ)
          </button>

          <button
            className="border rounded px-4 py-2 bg-blue-500 text-white font-bold shadow-sm hover:bg-blue-600 disabled:bg-gray-400 w-full md:w-auto"
            onClick={handleAutoTime}
            disabled={loading || saving || !items.length}
          >
            เติมเวลาอัตโนมัติ (35 นาที / 14 แมท)
          </button>

          <button
            className="border rounded px-4 py-2 bg-green-600 text-white font-bold shadow-sm hover:bg-green-700 disabled:bg-gray-400 w-full md:w-auto"
            onClick={saveOrder}
            disabled={loading || saving || !items.length}
          >
            {saving ? "กำลังบันทึก..." : "Save Master Order"}
          </button>

          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={total}
            onPageChange={load}
            loading={loading}
          />
        </div>
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        initialConfig={sessionConfig}
        onSave={(newConfig) => {
          setSessionConfig(newConfig);
        }}
      />
    </div>
  );
}
