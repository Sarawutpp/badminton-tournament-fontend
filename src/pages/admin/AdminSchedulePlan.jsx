// src/pages/admin/AdminSchedulePlan.jsx
// (Update: Fixed Bottom Toolbar + Advanced Auto Time Settings)

import React from "react";
import { API, teamName } from "@/lib/api.js";
import { HAND_LEVEL_OPTIONS } from "@/lib/types.js";
import { useTournament } from "@/contexts/TournamentContext";
import * as XLSX from "xlsx";

const pageSize = 5000;

// ---- Helpers ----
function normalizeScheduleResponse(res) {
  if (Array.isArray(res))
    return { items: res, total: res.length, page: 1, pageSize };
  if (res && Array.isArray(res.items)) {
    return {
      items: res.items,
      total: Number(res.total ?? res.items.length),
      page: Number(res.page ?? 1),
      pageSize: Number(res.pageSize ?? pageSize),
    };
  }
  return { items: [], total: 0, page: 1, pageSize };
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

// ============ Component: Settings Modal (ตั้งค่าลำดับรุ่น) ============
function SettingsModal({
  isOpen,
  onClose,
  initialConfig,
  onSave,
  defaultList,
}) {
  const [tempConfig, setTempConfig] = React.useState(initialConfig);
  React.useEffect(() => {
    setTempConfig(initialConfig);
  }, [initialConfig, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
          <h3 className="text-lg font-bold text-indigo-700">
            ⚙️ ตั้งค่าการจัดเรียง (Master Session Order)
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-600 mb-2">
            ใส่ประเภทมือที่ต้องการให้แข่งก่อน (1 บรรทัด = 1 เซสชั่น)
          </p>
          <textarea
            className="border rounded px-3 py-2 text-sm w-full font-mono bg-slate-50 focus:ring-2 focus:ring-indigo-200 outline-none"
            rows={8}
            value={tempConfig}
            onChange={(e) => setTempConfig(e.target.value)}
          />
          <div className="mt-2 text-right">
            <button
              onClick={() => {
                if (window.confirm("รีเซ็ตเป็นค่าเริ่มต้น?"))
                  setTempConfig(defaultList);
              }}
              className="text-xs text-indigo-600 underline hover:text-indigo-800"
            >
              คืนค่าเริ่มต้น
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 bg-slate-50 rounded-b-2xl border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => {
              onSave(tempConfig);
              onClose();
            }}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
          >
            บันทึกค่า
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Component: Auto Time Modal (ตั้งค่าเวลา) ============
function AutoTimeModal({ isOpen, onClose, onConfirm }) {
  // ค่า Default
  const [config, setConfig] = React.useState({
    startTime: "09:00",
    courts: 10,
    groupMinutes: 20,
    koMinutes: 30,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">
            🕒 ตั้งค่าการเติมเวลา (Auto Time)
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Start Time & Courts */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                เวลาเริ่มแข่ง
              </label>
              <input
                type="time"
                className="w-full border rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none"
                value={config.startTime}
                onChange={(e) =>
                  setConfig({ ...config, startTime: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                จำนวนสนาม
              </label>
              <input
                type="number"
                min={1}
                className="w-full border rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none"
                value={config.courts}
                onChange={(e) =>
                  setConfig({ ...config, courts: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="border-t border-slate-100 my-2"></div>

          {/* Durations */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              ⏱️ รอบแบ่งกลุ่ม (นาที/คู่)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="flex-1 border rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-green-200 outline-none border-green-200 bg-green-50"
                value={config.groupMinutes}
                onChange={(e) =>
                  setConfig({ ...config, groupMinutes: Number(e.target.value) })
                }
              />
              <span className="text-sm text-slate-400">นาที</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              🔥 รอบ Knockout (นาที/คู่)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="flex-1 border rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-orange-200 outline-none border-orange-200 bg-orange-50"
                value={config.koMinutes}
                onChange={(e) =>
                  setConfig({ ...config, koMinutes: Number(e.target.value) })
                }
              />
              <span className="text-sm text-slate-400">นาที</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 bg-slate-50 rounded-b-2xl border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => onConfirm(config)}
            className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
          >
            เริ่มคำนวณเวลา
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Component หลัก ============

export default function AdminSchedulePlan() {
  const { selectedTournament } = useTournament();

  const [hand, setHand] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [q, setQ] = React.useState("");
  const [data, setData] = React.useState({
    items: [],
    total: 0,
    page: 1,
    pageSize,
  });

  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState(new Set());

  // State สำหรับ Modal
  const [showSettings, setShowSettings] = React.useState(false);
  const [showTimeModal, setShowTimeModal] = React.useState(false); // [NEW]

  // Options แบบ Dynamic
  const handOptions = React.useMemo(() => {
    const cats = selectedTournament?.settings?.categories || [];
    if (cats.length > 0) {
      return cats.map((c) => ({ value: c, label: c }));
    }
    return HAND_LEVEL_OPTIONS.map((opt) => ({
      value: opt.value,
      label: opt.labelShort || opt.label || opt.value,
    }));
  }, [selectedTournament]);

  // Config State
  const defaultFromConst = handOptions.map((opt) => opt.value).join("\n");

  const [sessionConfig, setSessionConfig] = React.useState(() => {
    try {
      const saved = localStorage.getItem("scheduleSessionConfig");
      return saved ? saved : defaultFromConst;
    } catch (e) {
      return defaultFromConst;
    }
  });

  React.useEffect(() => {
    if (
      handOptions.length > 0 &&
      (!sessionConfig ||
        sessionConfig === HAND_LEVEL_OPTIONS.map((o) => o.value).join("\n"))
    ) {
      setSessionConfig(handOptions.map((o) => o.value).join("\n"));
    }
  }, [handOptions]);

  React.useEffect(() => {
    localStorage.setItem("scheduleSessionConfig", sessionConfig);
  }, [sessionConfig]);

  // ============ Logic Load ============
  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await API.listSchedule({
        page: 1,
        pageSize,
        handLevel: hand || undefined,
        status: status || undefined,
        q: q || undefined,
        tournamentId: selectedTournament?._id,
      });

      let rawItems = [];
      if (Array.isArray(res)) rawItems = res;
      else if (res && Array.isArray(res.items)) rawItems = res.items;

      const sortedItems = rawItems.sort((a, b) => {
        const orderA = Number(a.orderIndex) || 0;
        const orderB = Number(b.orderIndex) || 0;
        if (orderA > 0 && orderB === 0) return -1;
        if (orderA === 0 && orderB > 0) return 1;
        if (orderA > 0 && orderB > 0) return orderA - orderB;
        return (Number(a.matchNo) || 0) - (Number(b.matchNo) || 0);
      });

      const norm = normalizeScheduleResponse({ ...res, items: sortedItems });
      setData(norm);
      setSelectedIds(new Set());
    } catch (e) {
      console.error(e);
      setErr(e.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, [hand, status, q, selectedTournament]);
  const items = data.items || [];

  const unsortedCount = items.filter((i) => !i.orderIndex).length;

  // ============ Selection & Helper Logic ============
  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const getHandConfigMap = () => {
    const map = {};
    try {
      sessionConfig.split("\n").forEach((line, sessionIdx) => {
        line.split(",").forEach((h, handIdx) => {
          const clean = h.trim();
          if (clean)
            map[clean] = { session: sessionIdx + 1, index: handIdx + 1 };
        });
      });
    } catch (e) {}
    return map;
  };
  const getHandScore = (m, handMap) => {
    const h = String(m.handLevel || "");
    if (handMap[h]) return handMap[h];
    for (const k in handMap) {
      if (h.includes(k) || k.includes(h)) return handMap[k];
    }
    return { session: 99, index: 99 };
  };
  const getStageType = (m) => {
    const s = String(m.stage || m.round || "").toLowerCase();
    if (s.includes("group")) return 1;
    return 2;
  };
  const getKnockoutPriority = (m) => {
    const s = String(m.stage || "").toLowerCase();
    if (s.includes("32")) return 1;
    if (s.includes("16")) return 2;
    if (s.includes("quarter") || s.includes("qf")) return 3;
    if (s.includes("semi") || s.includes("sf")) return 4;
    if (s.includes("final")) return 5;
    return 99;
  };

  // ============ Sort Functions ============
  function handleGlobalAutoSort() {
    if (!items.length) return;
    if (
      !window.confirm(
        "⚠️ ต้องการจัดเรียงใหม่ 'ทั้งกระดาน' (Group สลับมือ / KO เรียงมือ)?"
      )
    )
      return;
    const handMap = getHandConfigMap();
    const sorted = [...items].sort((a, b) => sortCompare(a, b, handMap));
    setData({ ...data, items: sorted });
  }

  function handleAutoSortSelected() {
    if (selectedIds.size === 0) {
      alert("เลือกรายการก่อน");
      return;
    }
    if (!window.confirm(`จัดเรียงเฉพาะ ${selectedIds.size} รายการที่เลือก?`))
      return;
    const currentItems = [...items];
    const indices = [];
    const toSort = [];
    currentItems.forEach((item, index) => {
      if (selectedIds.has(item._id)) {
        indices.push(index);
        toSort.push(item);
      }
    });
    const handMap = getHandConfigMap();
    toSort.sort((a, b) => sortCompare(a, b, handMap));
    const newItems = [...currentItems];
    indices.forEach((originalIndex, i) => {
      newItems[originalIndex] = toSort[i];
    });
    setData({ ...data, items: newItems });
  }

  function sortCompare(a, b, handMap) {
    const infoA = getHandScore(a, handMap);
    const infoB = getHandScore(b, handMap);
    if (infoA.session !== infoB.session) return infoA.session - infoB.session;
    const stageA = getStageType(a);
    const stageB = getStageType(b);
    if (stageA !== stageB) return stageA - stageB;
    if (stageA === 1) {
      const rA = Number(a.groupRound || a.roundNo || 0);
      const rB = Number(b.groupRound || b.roundNo || 0);
      if (rA !== rB) return rA - rB;
      if (infoA.index !== infoB.index) return infoA.index - infoB.index;
      const nA = String(a.group || "");
      const nB = String(b.group || "");
      if (nA !== nB) return nA.localeCompare(nB);
    }
    if (stageA === 2) {
      if (infoA.index !== infoB.index) return infoA.index - infoB.index;
      const kA = getKnockoutPriority(a);
      const kB = getKnockoutPriority(b);
      if (kA !== kB) return kA - kB;
    }
    return (Number(a.matchNo) || 0) - (Number(b.matchNo) || 0);
  }

  function moveBulk(action) {
    if (selectedIds.size === 0) return;
    let currentItems = [...items];
    const selected = currentItems.filter((item) => selectedIds.has(item._id));
    const unselected = currentItems.filter(
      (item) => !selectedIds.has(item._id)
    );
    let newItems = [];
    if (action === "top") newItems = [...selected, ...unselected];
    else if (action === "bottom") newItems = [...unselected, ...selected];
    else if (action === "up") {
      newItems = [...currentItems];
      for (let i = 1; i < newItems.length; i++) {
        if (
          selectedIds.has(newItems[i]._id) &&
          !selectedIds.has(newItems[i - 1]._id)
        ) {
          [newItems[i - 1], newItems[i]] = [newItems[i], newItems[i - 1]];
        }
      }
    } else if (action === "down") {
      newItems = [...currentItems];
      for (let i = newItems.length - 2; i >= 0; i--) {
        if (
          selectedIds.has(newItems[i]._id) &&
          !selectedIds.has(newItems[i + 1]._id)
        ) {
          [newItems[i + 1], newItems[i]] = [newItems[i], newItems[i + 1]];
        }
      }
    }
    setData({ ...data, items: newItems });
  }

  async function saveOrder() {
    setSaving(true);
    try {
      const orderedIds = items.map((m) => m._id);
      await API.reorderMatches({ orderedIds });
      await load();
      alert(`✅ บันทึกเรียบร้อย (${items.length} รายการ)`);
    } catch (e) {
      alert("บันทึกไม่สำเร็จ: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  // ============ [NEW] Auto Time Logic ============

  // 1. แค่เปิด Modal
  function handleAutoTimeClick() {
    setShowTimeModal(true);
  }

  // 2. คำนวณจริงเมื่อกด Confirm ใน Modal
  async function executeAutoTime(config) {
    setShowTimeModal(false);
    setSaving(true);
    try {
      const { startTime, courts, groupMinutes, koMinutes } = config;

      // 1. คำนวณเวลา (เหมือนเดิม)
      const [startH, startM] = startTime.split(":").map(Number);
      const baseDate = new Date();
      baseDate.setHours(startH, startM, 0, 0);
      const startMs = baseDate.getTime();

      let courtFinishTimes = new Array(courts).fill(startMs);

      // 2. สร้าง Array ใหม่สำหรับอัปเดตหน้าจอทันที (Optimistic Update)
      const updatedItems = items.map((m, index) => {
        // คำนวณหาคิวสนาม
        const earliestTime = Math.min(...courtFinishTimes);
        const courtIndex = courtFinishTimes.indexOf(earliestTime);
        const scheduledTime = new Date(earliestTime);

        const isGroup =
          m.roundType === "group" ||
          (m.stage && m.stage.includes("Group")) ||
          m.group;
        const durationMinutes = isGroup ? groupMinutes : koMinutes;
        courtFinishTimes[courtIndex] += durationMinutes * 60 * 1000;

        // คืนค่า Object ใหม่ที่มีข้อมูลที่แก้แล้ว (เพื่อโชว์บนจอทันที)
        return {
          ...m,
          scheduledAt: scheduledTime.toISOString(),
          matchNo: index + 1,
          orderIndex: index + 1,
          court: String(courtIndex + 1),
          // เพิ่ม flag ว่ากำลังบันทึกอยู่ก็ได้ (ถ้าต้องการ)
        };
      });

      // ✅ KEY FIX 1: อัปเดต State หน้าจอทันที! (ไม่ต้องรอ Server)
      // ผู้ใช้จะเห็นเวลาเปลี่ยนทันทีที่กดปุ่ม
      setData((prev) => ({ ...prev, items: updatedItems }));

      // 3. ยิง API บันทึกลง Server (ทำเบื้องหลัง)
      const tasks = updatedItems.map((m) => {
        return API.updateSchedule(m._id, {
          scheduledAt: m.scheduledAt,
          matchNo: m.matchNo,
          orderIndex: m.orderIndex,
          court: m.court,
        });
      });

      await Promise.all(tasks);

      // ✅ KEY FIX 2: รอแป๊บนึง + โหลดใหม่แบบกัน Cache (timestamp)
      // ใส่ timeout นิดหน่อยเพื่อให้ชัวร์ว่า DB เขียนเสร็จแล้วค่อยโหลดจริงมาทับ
      setTimeout(() => {
        load();
      }, 500);

      alert(`✅ คำนวณเวลาและจัดคิวสนามเรียบร้อย!`);
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการบันทึกเวลา");
      load(); // ถ้าพัง ให้โหลดข้อมูลเดิมกลับมา
    } finally {
      setSaving(false);
    }
  }

  async function saveOneTime(matchId, val) {
    let v = val.trim();
    if (!v) return;
    v = v.replace(".", ":");
    if (/^\d{1,2}$/.test(v)) v = v + ":00";
    if (!/^\d{1,2}:\d{2}$/.test(v)) return;
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
    } catch (e) {}
  }

  // ============ Export Excel ============
  const handleExportExcel = () => {
    if (!items || items.length === 0) {
      alert("ไม่มีข้อมูลสำหรับ Export");
      return;
    }
    const exportData = items.map((m, index) => ({
      "ลำดับ (Seq)": index + 1,
      "เวลา (Time)": formatTime(m.scheduledAt) || "-",
      "Match ID": m.matchId || "-",
      "รุ่น (Hand)": m.handLevel,
      "กลุ่ม (Group)": m.group || "-",
      "สนาม (Court)": m.court || "-",
      "ทีม 1": teamName(m.team1),
      "ทีม 2": teamName(m.team2),
      สถานะ: m.status === "finished" ? "จบแล้ว" : "รอแข่ง",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Schedule");

    ws["!cols"] = [
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 25 },
      { wch: 25 },
      { wch: 10 },
    ];

    XLSX.writeFile(wb, `Schedule_Backup_${new Date().getTime()}.xlsx`);
  };

  // ============ Render ============
  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-6 pb-32">
      <div className="max-w-7xl mx-auto relative">
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-indigo-700 flex items-center gap-2">
              📅 Schedule Master Plan
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              จัดลำดับการแข่งขัน และกำหนดเวลา
            </p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 shadow-sm transition-all"
          >
            ⚙️ ตั้งค่า Session Order
          </button>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            className="border rounded px-2 py-2 text-sm bg-white"
            value={hand}
            onChange={(e) => setHand(e.target.value)}
          >
            <option value="">ทุกระดับมือ</option>
            {handOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className="border rounded px-2 py-2 text-sm bg-white"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">ทุกสถานะ</option>
            <option value="scheduled">รอแข่ง</option>
            <option value="finished">จบแล้ว</option>
          </select>
          <input
            placeholder="ค้นหา..."
            className="border rounded px-2 py-2 text-sm bg-white flex-1 min-w-[150px]"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* Floating Toolbar (Fixed Bottom Center) */}
        <div
          className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-300 
            ${
              selectedIds.size > 0
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10 pointer-events-none"
            }`}
        >
          <div className="bg-white/95 backdrop-blur-sm border border-indigo-200 shadow-2xl rounded-full p-2 pr-4 flex items-center gap-4">
            {/* Counter */}
            <div className="flex items-center justify-center bg-indigo-600 text-white w-8 h-8 rounded-full shadow-sm">
              <span className="text-sm font-bold">{selectedIds.size}</span>
            </div>

            {/* Arrows */}
            <div className="flex bg-slate-100 rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => moveBulk("top")}
                title="บนสุด"
                className="p-2 hover:bg-white hover:text-indigo-600 transition border-r border-slate-200"
              >
                ⏫
              </button>
              <button
                onClick={() => moveBulk("up")}
                title="ขึ้น"
                className="p-2 hover:bg-white hover:text-indigo-600 transition border-r border-slate-200"
              >
                🔼
              </button>
              <button
                onClick={() => moveBulk("down")}
                title="ลง"
                className="p-2 hover:bg-white hover:text-indigo-600 transition border-r border-slate-200"
              >
                🔽
              </button>
              <button
                onClick={() => moveBulk("bottom")}
                title="ล่างสุด"
                className="p-2 hover:bg-white hover:text-indigo-600 transition"
              >
                ⏬
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoSortSelected}
                className="bg-indigo-600 text-white border border-indigo-600 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-indigo-700 shadow-sm whitespace-nowrap"
              >
                Sort Selected
              </button>
              <div className="w-px h-6 bg-slate-300 mx-1"></div>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-slate-500 hover:text-red-600 font-semibold text-sm px-2"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* ============ Table ============ */}
        <div className="bg-white rounded-2xl shadow ring-1 ring-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-slate-100 border-b text-[12px] uppercase tracking-wide grid grid-cols-12 gap-2 px-3 py-3 font-bold text-slate-500 items-center">
            <div className="col-span-1 text-center">Select</div>
            <div className="col-span-1 text-center">Seq</div>
            <div className="col-span-2 text-center">Time (Lock)</div>
            <div className="col-span-3">Hand / Group</div>
            <div className="col-span-3">Match Info</div>
            <div className="col-span-2 text-right">Status</div>
          </div>

          <div className="divide-y divide-slate-100">
            {items.map((m, i) => {
              const isSelected = selectedIds.has(m._id);
              const isSorted = Number(m.orderIndex) > 0;
              const showDivider =
                !isSorted &&
                (i === 0 ||
                  (items[i - 1] && Number(items[i - 1].orderIndex) > 0));

              return (
                <React.Fragment key={m._id}>
                  {showDivider && (
                    <div className="bg-slate-50 border-y border-slate-200 py-3 px-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                      <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <polyline points="19 12 12 19 5 12"></polyline>
                        </svg>
                        <span>Queue / Draft (รอจัดลำดับ)</span>
                      </div>
                      <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-bold">
                        {unsortedCount} รายการ
                      </span>
                    </div>
                  )}

                  <div
                    className={`grid grid-cols-12 gap-2 items-center px-3 py-3 text-sm transition-colors duration-150
                    ${
                      isSelected
                        ? "bg-indigo-50"
                        : isSorted
                        ? "bg-white hover:bg-slate-50"
                        : "bg-yellow-50/50 hover:bg-yellow-100/50"
                    }
                  `}
                  >
                    {/* Checkbox */}
                    <div className="col-span-1 text-center flex justify-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={isSelected}
                        onChange={() => toggleSelect(m._id)}
                      />
                    </div>

                    {/* Seq */}
                    <div className="col-span-1 text-center font-bold text-slate-400">
                      {isSorted ? (
                        <span className="text-slate-600">{i + 1}</span>
                      ) : (
                        <span>-</span>
                      )}
                    </div>

                    {/* Time (Lock) */}
                    <div className="col-span-2 px-1">
                      <div
                        className={`relative flex items-center rounded-md border overflow-hidden
                         ${
                           isSorted
                             ? m.scheduledAt
                               ? "border-green-400 bg-green-50"
                               : "border-slate-300 bg-slate-50"
                             : "border-amber-300 border-dashed bg-white"
                         }
                      `}
                      >
                        <input
                          className={`w-full text-center bg-transparent py-1.5 text-sm font-bold focus:outline-none
                                ${
                                  isSorted && m.scheduledAt
                                    ? "text-green-700"
                                    : "text-slate-400"
                                }
                            `}
                          placeholder="--:--"
                          defaultValue={formatTime(m.scheduledAt)}
                          onBlur={(e) => saveOneTime(m._id, e.target.value)}
                        />
                        <div className="pr-2">
                          {isSorted ? (
                            <svg
                              className="w-3.5 h-3.5 text-green-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-3.5 h-3.5 text-amber-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                            >
                              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hand / Group */}
                    <div className="col-span-3 text-slate-700 font-medium truncate">
                      {m.handLevel}{" "}
                      <span className="text-slate-400 font-light mx-1">/</span>{" "}
                      {m.group || "-"}
                    </div>

                    {/* Match Info */}
                    <div className="col-span-3 truncate text-sm">
                      <span className="font-semibold text-slate-800">
                        {teamName(m.team1)}
                      </span>
                      <span className="text-slate-400 px-1 text-xs">vs</span>
                      <span className="font-semibold text-slate-800">
                        {teamName(m.team2)}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {m.matchId}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="col-span-2 text-right">
                      {isSorted ? (
                        <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-[10px] font-bold border border-green-200">
                          READY
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200">
                          WAIT
                        </span>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="fixed bottom-6 right-6 flex flex-col md:flex-row gap-3 z-30 items-end md:items-center">
          <button
            onClick={handleGlobalAutoSort}
            className="bg-amber-500 text-white shadow-lg border border-amber-600 px-4 py-3 rounded-full font-bold hover:bg-amber-600 transition mb-2 md:mb-0"
          >
            ⚡ จัดเรียง Auto (ทั้งหมด)
          </button>

          {/* ✅ เปลี่ยนปุ่มนี้ให้เรียก Modal */}
          <button
            onClick={handleAutoTimeClick}
            className="bg-white text-slate-700 border border-slate-300 shadow-lg px-4 py-3 rounded-full font-bold hover:bg-slate-50 transition"
          >
            🕒 เติมเวลา Auto
          </button>

          <button
            onClick={handleExportExcel}
            className="bg-green-600 text-white shadow-lg border border-green-700 px-4 py-3 rounded-full font-bold hover:bg-green-700 transition"
          >
            📊 Export Excel
          </button>
          <button
            onClick={saveOrder}
            disabled={saving}
            className="bg-indigo-600 text-white shadow-lg shadow-indigo-200 px-6 py-3 rounded-full font-bold hover:bg-indigo-700 disabled:bg-gray-400 transition"
          >
            {saving ? "บันทึก..." : "💾 บันทึก Master Order"}
          </button>
        </div>

        {/* Modals */}
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          initialConfig={sessionConfig}
          onSave={setSessionConfig}
          defaultList={defaultFromConst}
        />

        <AutoTimeModal
          isOpen={showTimeModal}
          onClose={() => setShowTimeModal(false)}
          onConfirm={executeAutoTime}
        />
      </div>
    </div>
  );
}
