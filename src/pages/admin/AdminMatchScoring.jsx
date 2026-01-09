// src/pages/admin/AdminMatchScoring.jsx
import React, { useState, useEffect } from "react";
import { API, teamName } from "@/lib/api.js";
import { HAND_LEVEL_OPTIONS } from "@/lib/types.js";
import { useTournament } from "@/contexts/TournamentContext";

const pageSize = 24;

// ----------------- Helpers -----------------
function hasScore(m) {
  if (Array.isArray(m.sets)) {
    const anySet = m.sets.some((s) => (s?.t1 || 0) > 0 || (s?.t2 || 0) > 0);
    if (anySet) return true;
  }
  if ((m.score1 || 0) > 0 || (m.score2 || 0) > 0) return true;
  return false;
}

function roundLabel(m) {
  if (m.roundType === "knockout") {
    return m.roundName || "Knockout";
  }
  if (m.group) return `Group ${m.group}`;
  return "รอบแบ่งกลุ่ม";
}

function handShort(level) {
  const opt = HAND_LEVEL_OPTIONS.find((x) => x.value === level);
  return opt?.labelShort || opt?.label || level || "-";
}

// ----------------- Components -----------------

function ShuttleSelectorModal({ isOpen, onClose, onConfirm, loading }) {
  if (!isOpen) return null;

  const options = [1, 2, 3, 4, 5]; // ตัวเลือกจำนวนลูก

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-center">
          <h3 className="text-white text-lg font-bold">
            🏸 จำนวนลูกแบดที่ใช้?
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            ระบุจำนวนลูกเพื่อคำนวณคูปอง (หารคนละครึ่ง)
          </p>
        </div>

        {/* Body: Buttons Grid */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {options.map((num) => (
              <button
                key={num}
                onClick={() => onConfirm(num)}
                disabled={loading}
                className="aspect-square rounded-2xl bg-slate-50 border-2 border-slate-100 text-2xl font-bold text-slate-700 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 transition-all flex items-center justify-center shadow-sm"
              >
                {num}
              </button>
            ))}
            {/* ปุ่ม 0 หรือ Custom */}
            <button
              onClick={() => onConfirm(0)}
              disabled={loading}
              className="aspect-square rounded-2xl bg-slate-50 border-2 border-slate-100 text-sm font-semibold text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-all flex flex-col items-center justify-center"
            >
              <span>ไม่ใช้</span>
              <span className="text-[10px]">(0)</span>
            </button>
          </div>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full py-3 rounded-xl border border-slate-200 text-slate-500 font-semibold hover:bg-slate-50 transition-colors"
          >
            ยกเลิก
          </button>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="text-indigo-600 font-bold animate-pulse">
              กำลังบันทึก...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------- Main Page -----------------
export default function AdminMatchScoringPage() {
  const { selectedTournament } = useTournament();

  const settings = selectedTournament?.settings || {};
  const CONFIG_MAX_SCORE = settings.maxScore || 21;
  const CONFIG_CATEGORIES =
    settings.categories && settings.categories.length > 0
      ? settings.categories
      : HAND_LEVEL_OPTIONS.map((h) => h.value);

  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // State สำหรับจัดการ Tab
  const [activeTab, setActiveTab] = useState("pending");

  const [filters, setFilters] = useState({
    handLevel: "",
    group: "",
    q: "",
    roundType: "",
  });

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // ✅ [MODIFIED] แก้ไขฟังก์ชัน load ให้ส่ง status ตาม activeTab
  async function load(p = 1) {
    setLoading(true);
    setErr("");
    try {
      // กำหนดค่า status ที่จะส่งไป API
      // ถ้าอยู่แท็บ pending ให้ขอ scheduled,in-progress
      // ถ้าอยู่แท็บ finished ให้ขอ finished
      const statusParam =
        activeTab === "pending" ? "scheduled,in-progress" : "finished";

      const res = await API.listMatchesForScoring({
        page: p,
        pageSize,
        handLevel: filters.handLevel || undefined,
        group: filters.group || undefined,
        q: filters.q || undefined,
        roundType: filters.roundType || undefined,
        status: statusParam, // ส่งค่า status ไปให้ Server กรอง
      });

      const items = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res)
        ? res
        : [];
      setRows(items);
      setTotal(Number(res?.total ?? items.length));
      setPage(Number(res?.page ?? p));
    } catch (e) {
      console.error(e);
      setErr(e?.message || "โหลดข้อมูลล้มเหลว");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  // ✅ [MODIFIED] เพิ่ม activeTab ลงใน dependency array
  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // เมื่อเปลี่ยนแท็บ ให้โหลดข้อมูลใหม่ทันที

  // ✅ [MODIFIED] ไม่ต้องกรอง Client-side แล้ว ใช้ rows ตรงๆ ได้เลย
  const displayedRows = rows;

  const maxPage = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  return (
    <div className="p-3 md:p-6 space-y-4 pb-20">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            กรอกผลการแข่งขัน
          </h1>
          <p className="text-xs md:text-sm text-slate-500">
            Rules: Max {CONFIG_MAX_SCORE} Points
          </p>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 md:p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          <div>
            <label className="text-[10px] md:text-xs text-slate-500">
              ระดับมือ
            </label>
            <select
              className="border rounded px-2 py-2 w-full text-sm"
              value={filters.handLevel}
              onChange={(e) =>
                setFilters((f) => ({ ...f, handLevel: e.target.value }))
              }
            >
              <option value="">ทั้งหมด</option>
              {CONFIG_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] md:text-xs text-slate-500">
              กลุ่ม
            </label>
            <input
              className="border rounded px-2 py-2 w-full text-sm"
              placeholder="A, B..."
              value={filters.group}
              onChange={(e) =>
                setFilters((f) => ({ ...f, group: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-[10px] md:text-xs text-slate-500">รอบ</label>
            <select
              className="border rounded px-2 py-2 w-full text-sm"
              value={filters.roundType}
              onChange={(e) =>
                setFilters((f) => ({ ...f, roundType: e.target.value }))
              }
            >
              <option value="group">รอบแบ่งกลุ่ม</option>
              <option value="knockout">รอบ Knockout</option>
              <option value="">ทั้งหมด</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] md:text-xs text-slate-500">
              ค้นหา
            </label>
            <input
              className="border rounded px-2 py-2 w-full text-sm"
              placeholder="ชื่อทีม / Match ID"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-end gap-3 text-xs md:text-sm text-slate-600">
          <div className="flex gap-2 w-full md:w-auto">
            <button
              className="flex-1 md:flex-none px-3 py-2 md:py-1 border rounded-full text-xs md:text-sm hover:bg-slate-50"
              onClick={() => {
                setFilters({
                  handLevel: "",
                  group: "",
                  q: "",
                  roundType: "group",
                });
                load(1);
              }}
            >
              ล้างค่า
            </button>
            <button
              className="flex-1 md:flex-none px-4 py-2 md:py-1 bg-slate-900 text-white rounded-full text-xs md:text-sm hover:bg-slate-800"
              onClick={() => load(1)}
              disabled={loading}
            >
              {loading ? "Loading..." : "โหลดข้อมูล"}
            </button>
          </div>
        </div>
      </div>

      {err && (
        <div className="p-3 bg-red-50 text-sm text-red-600 rounded">{err}</div>
      )}

      {/* Tabs Selector */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full md:w-fit">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex-1 md:flex-none px-4 py-2 text-sm font-semibold rounded-md transition-all ${
            activeTab === "pending"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          ⏳ รอแข่ง / รอกรอกผล
        </button>
        <button
          onClick={() => setActiveTab("finished")}
          className={`flex-1 md:flex-none px-4 py-2 text-sm font-semibold rounded-md transition-all ${
            activeTab === "finished"
              ? "bg-white text-emerald-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          ✅ จบแล้ว / มีผล
        </button>
      </div>

      {/* ================= Mobile List View (md:hidden) ================= */}
      <div className="block md:hidden space-y-4">
        {displayedRows && displayedRows.length > 0 ? (
          displayedRows.map((m) => (
            <MatchScoreCardMobile
              key={m._id}
              m={m}
              loadData={() => load(page)}
              configMaxScore={CONFIG_MAX_SCORE}
            />
          ))
        ) : (
          <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed">
            <p className="text-lg">ไม่พบข้อมูลในแท็บนี้</p>
            <p className="text-xs mt-1 text-slate-300">
              (ลองเปลี่ยนแท็บ หรือเปลี่ยนหน้าถัดไป)
            </p>
          </div>
        )}
      </div>

      {/* ================= Desktop Table View (hidden md:block) ================= */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-xs md:text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-2 text-center w-16">Match</th>
              <th className="p-2 text-left">คู่แข่ง</th>
              <th className="p-2 text-center w-24">ระดับ/กลุ่ม</th>
              <th className="p-2 text-center w-24">รอบ</th>
              <th className="p-2 text-center w-20">คอร์ท</th>
              <th className="p-2 text-center w-24">สถานะ</th>
              <th className="p-2 text-center w-24">Set 1</th>
              <th className="p-2 text-center w-24">Set 2</th>
              <th className="p-2 text-center w-24">Set 3</th>
              <th className="p-2 text-center w-28">Action</th>
            </tr>
          </thead>
          <tbody>
            {displayedRows && displayedRows.length > 0 ? (
              displayedRows.map((m) => (
                <MatchScoreRowDesktop
                  key={m._id}
                  m={m}
                  loadData={() => load(page)}
                  configMaxScore={CONFIG_MAX_SCORE}
                />
              ))
            ) : (
              <tr>
                <td colSpan={10} className="p-12 text-center text-slate-500">
                  ไม่พบข้อมูลในแท็บนี้
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs md:text-sm text-slate-600 pt-2">
        <div>
          รวม {total} • หน้า {page}/{maxPage}
          <span className="hidden md:inline ml-2 text-slate-400 text-xs">
            (แสดง {displayedRows.length} รายการในแท็บนี้)
          </span>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 border rounded-full hover:bg-slate-50 disabled:opacity-50"
            disabled={loading || page <= 1}
            onClick={() => {
              const p = Math.max(1, page - 1);
              setPage(p);
              load(p);
            }}
          >
            ก่อนหน้า
          </button>
          <button
            className="px-3 py-1 border rounded-full hover:bg-slate-50 disabled:opacity-50"
            disabled={loading || page >= maxPage}
            onClick={() => {
              const p = Math.min(maxPage, page + 1);
              setPage(p);
              load(p);
            }}
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// Logic Components (Desktop Row & Mobile Card)
// =========================================================================

/**
 * Shared Logic for Scoring
 */
function useMatchScoring(m, loadData, configMaxScore) {
  const isKO = m.roundType === "knockout";
  const isGroup = !isKO;

  // คำนวณ maxSets ตามกติกาจริงของแมตช์นั้น
  const gamesToWin = m.gamesToWin || 2;
  let maxSets = 3; // Default (BO3)

  if (gamesToWin === 1) {
    maxSets = 1; // Mini Tournament
  } else if (isGroup) {
    maxSets = 2; // Standard Group (BO2)
  }

  const maxScore = configMaxScore || 21;

  const alreadyHasScore = hasScore(m);
  const [isEditing, setIsEditing] = useState(
    m.status === "finished" && !alreadyHasScore
  );
  const [saving, setSaving] = useState(false);

  // [NEW] State Control Modal
  const [showShuttleModal, setShowShuttleModal] = useState(false);

  const [localSets, setLocalSets] = useState(() => {
    const s =
      m.sets?.map((set) => ({ t1: set.t1 || 0, t2: set.t2 || 0 })) || [];
    while (s.length < 3) s.push({ t1: 0, t2: 0 });
    return s;
  });

  const canEdit = !saving && m.status === "finished" && isEditing;

  function updateSetScore(index, team, value) {
    let v = parseInt(value, 10);
    if (Number.isNaN(v)) v = 0;
    if (v < 0) v = 0;

    const arr = [...localSets];
    arr[index] = { ...arr[index], [team]: v };
    setLocalSets(arr);
  }

  // Sync localSets when props m changes
  useEffect(() => {
    let s = m.sets?.map((set) => ({ t1: set.t1 || 0, t2: set.t2 || 0 })) || [];
    while (s.length < 3) s.push({ t1: 0, t2: 0 });
    setLocalSets(s);

    const hasScore =
      (m.sets && m.sets.length > 0) || m.score1 > 0 || m.score2 > 0;
    if (m.status === "finished" && !hasScore) {
      setIsEditing(true);
    }
  }, [m]);

  // [NEW] 1. Trigger: กดปุ่มบันทึก -> ตรวจสอบข้อมูลเบื้องต้น -> เปิด Modal
  function triggerSave() {
    // Check Validation
    const payloadSets = localSets.slice(0, maxSets).filter((s) => {
      const t1 = parseInt(s.t1);
      const t2 = parseInt(s.t2);
      return !isNaN(t1) && !isNaN(t2);
    });

    if (payloadSets.length === 0) {
      alert("กรุณากรอกคะแนนอย่างน้อย 1 เซ็ต");
      return;
    }

    // เปิด Modal ถามจำนวนลูกแบด
    setShowShuttleModal(true);
  }

  // [NEW] 2. Confirm: กดเลือกจำนวนลูก -> บันทึก API จริง
  async function confirmSave(shuttleCount) {
    setSaving(true);
    try {
      const payloadSets = localSets.slice(0, maxSets).filter((s) => {
        const t1 = parseInt(s.t1);
        const t2 = parseInt(s.t2);
        return !isNaN(t1) && !isNaN(t2);
      });

      await API.updateScore(m._id, {
        sets: payloadSets,
        status: "finished",
        shuttlecockUsed: shuttleCount, // ส่งค่าลูกไปด้วย
      });

      setIsEditing(false);
      setShowShuttleModal(false); // ปิด Modal
      await loadData();
    } catch (e) {
      alert(e.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setIsEditing(false);
    setShowShuttleModal(false);
    const s =
      m.sets?.map((set) => ({ t1: set.t1 || 0, t2: set.t2 || 0 })) || [];
    while (s.length < 3) s.push({ t1: 0, t2: 0 });
    setLocalSets(s);
  }

  return {
    isGroup,
    maxSets,
    maxScore,
    isEditing,
    setIsEditing,
    canEdit,
    localSets,
    updateSetScore,
    triggerSave, // ใช้แทน save เดิม
    confirmSave, // ใช้ใน Modal
    showShuttleModal, // State Modal
    setShowShuttleModal,
    cancel,
    alreadyHasScore,
    saving,
  };
}

/**
 * 📱 Mobile Card Component
 */
function MatchScoreCardMobile({ m, loadData, configMaxScore }) {
  const logic = useMatchScoring(m, loadData, configMaxScore);
  const {
    maxSets,
    isEditing,
    canEdit,
    localSets,
    updateSetScore,
    triggerSave, // [CHANGE]
    confirmSave, // [NEW]
    showShuttleModal, // [NEW]
    setShowShuttleModal, // [NEW]
    cancel,
    alreadyHasScore,
    saving,
    setIsEditing,
  } = logic;

  // Badge Status
  let statusBadge = null;
  if (m.status === "finished") {
    statusBadge = hasScore(m) ? (
      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
        ✅ มีผล
      </span>
    ) : (
      <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">
        ⚠️ รอกรอก
      </span>
    );
  } else if (m.status === "in-progress") {
    statusBadge = (
      <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded text-[10px] font-bold">
        กำลังแข่ง
      </span>
    );
  } else {
    statusBadge = (
      <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold">
        รอแข่ง
      </span>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-xs font-bold text-indigo-600">
            #{m.matchNo}{" "}
            <span className="text-slate-400 font-normal">
              | {m.court || "-"}
            </span>
          </div>
        </div>
        <div>{statusBadge}</div>
      </div>

      {/* Teams */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1">
          <div className="font-semibold text-slate-800 text-sm">
            {teamName(m.team1)}
          </div>
        </div>
        <div className="px-2 text-xs text-slate-400">vs</div>
        <div className="flex-1 text-right">
          <div className="font-semibold text-slate-800 text-sm">
            {teamName(m.team2)}
          </div>
        </div>
      </div>

      {/* Info Tag */}
      <div className="flex gap-2 mb-4 text-[10px] text-slate-500">
        <span className="bg-slate-100 px-2 py-1 rounded">
          {handShort(m.handLevel)}
        </span>
        <span className="bg-slate-100 px-2 py-1 rounded">{roundLabel(m)}</span>
      </div>

      {/* Inputs */}
      <div className="bg-slate-50 rounded-lg p-3 mb-4">
        <div className="flex justify-between text-[10px] text-slate-400 mb-2 px-1">
          <span>Team 1</span>
          <span>Team 2</span>
        </div>
        {[0, 1, 2].map((i) => {
          if (i >= maxSets) return null;
          return (
            <div
              key={i}
              className="flex items-center justify-between mb-2 last:mb-0"
            >
              <input
                type="number"
                pattern="\d*"
                className="w-14 h-10 text-center border border-slate-300 rounded-lg text-lg font-bold bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60 disabled:bg-slate-100"
                value={localSets[i].t1 || ""}
                onChange={(e) => updateSetScore(i, "t1", e.target.value)}
                disabled={!canEdit}
                placeholder="0"
              />
              <span className="text-xs font-bold text-slate-400">
                Set {i + 1}
              </span>
              <input
                type="number"
                pattern="\d*"
                className="w-14 h-10 text-center border border-slate-300 rounded-lg text-lg font-bold bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60 disabled:bg-slate-100"
                value={localSets[i].t2 || ""}
                onChange={(e) => updateSetScore(i, "t2", e.target.value)}
                disabled={!canEdit}
                placeholder="0"
              />
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="text-right">
        {!canEdit && m.status !== "finished" && (
          <span className="text-xs text-slate-400">
            ต้องจบแมตช์ก่อนจึงจะกรอกผลได้
          </span>
        )}
        {m.status === "finished" && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full py-2 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 text-sm"
          >
            {alreadyHasScore ? "แก้ไขผล" : "กรอกผล"}
          </button>
        )}
        {canEdit && (
          <div className="flex gap-2">
            <button
              onClick={cancel}
              disabled={saving}
              className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-600 font-semibold text-sm hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={triggerSave} // [CHANGE] เรียก triggerSave แทน save
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-sm"
            >
              {saving ? "บันทึก..." : "บันทึก"}
            </button>
          </div>
        )}
      </div>

      {/* [NEW] Render Modal */}
      <ShuttleSelectorModal
        isOpen={showShuttleModal}
        onClose={() => setShowShuttleModal(false)}
        onConfirm={confirmSave}
        loading={saving}
      />
    </div>
  );
}

/**
 * 💻 Desktop Row Component
 */
function MatchScoreRowDesktop({ m, loadData, configMaxScore }) {
  const logic = useMatchScoring(m, loadData, configMaxScore);
  const {
    maxSets,
    isEditing,
    canEdit,
    localSets,
    updateSetScore,
    triggerSave, // [CHANGE]
    confirmSave, // [NEW]
    showShuttleModal, // [NEW]
    setShowShuttleModal, // [NEW]
    cancel,
    alreadyHasScore,
    saving,
    setIsEditing,
  } = logic;

  let statusBadge = null;
  if (m.status === "finished") {
    statusBadge = hasScore(m) ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
        ✅ มีผล
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
        ⚠️ รอกรอก
      </span>
    );
  } else if (m.status === "in-progress") {
    statusBadge = (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-sky-50 text-sky-700 border border-sky-200">
        🔵 กำลังแข่ง
      </span>
    );
  } else {
    statusBadge = (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-slate-50 text-slate-600 border border-slate-200">
        ⚪ รอแข่ง
      </span>
    );
  }

  return (
    <>
      <tr className="border-t align-middle hover:bg-slate-50/50 transition-colors">
        <td className="p-2 text-center">
          <div className="font-bold text-slate-700">{m.matchNo ?? "-"}</div>
        </td>
        <td className="p-2">
          <div className="font-semibold text-slate-800 text-sm">
            {teamName(m.team1)}
          </div>
          <div className="text-[10px] text-slate-400">vs</div>
          <div className="font-semibold text-slate-800 text-sm">
            {teamName(m.team2)}
          </div>
        </td>
        <td className="p-2 text-center">
          <div className="font-bold text-indigo-600 text-xs">
            {handShort(m.handLevel)}
          </div>
        </td>
        <td className="p-2 text-center text-xs text-slate-600">
          {roundLabel(m)}
        </td>
        <td className="p-2 text-center font-bold text-slate-700 text-xs">
          {m.court || "-"}
        </td>
        <td className="p-2 text-center">
          <div className="text-xs font-medium text-slate-800 mb-1">
            {m.status === "finished"
              ? "จบแล้ว"
              : m.status === "in-progress"
              ? "กำลังแข่ง"
              : "รอ"}
          </div>
          {statusBadge}
        </td>

        {/* Sets Input */}
        {[0, 1, 2].map((i) => {
          if (i >= maxSets) {
            return (
              <td key={i} className="p-2 text-center bg-slate-50">
                <span className="text-slate-300 text-xs">-</span>
              </td>
            );
          }
          return (
            <td key={i} className="p-2">
              <div className="flex items-center justify-center gap-1">
                <input
                  type="text"
                  className="border border-slate-300 rounded px-1 py-1 w-10 text-center text-sm font-bold focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  value={localSets[i].t1 || ""}
                  onChange={(e) => updateSetScore(i, "t1", e.target.value)}
                  disabled={!canEdit}
                  placeholder="0"
                />
                <span className="text-slate-400 text-[10px]">:</span>
                <input
                  type="text"
                  className="border border-slate-300 rounded px-1 py-1 w-10 text-center text-sm font-bold focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  value={localSets[i].t2 || ""}
                  onChange={(e) => updateSetScore(i, "t2", e.target.value)}
                  disabled={!canEdit}
                  placeholder="0"
                />
              </div>
            </td>
          );
        })}

        <td className="p-2 text-center">
          {!canEdit && m.status !== "finished" && (
            <span className="text-[10px] text-slate-400">จบแมตช์ก่อน</span>
          )}
          {m.status === "finished" && !isEditing && (
            <button
              className="px-3 py-1 rounded border border-slate-300 text-xs font-medium hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-colors"
              onClick={() => setIsEditing(true)}
            >
              {alreadyHasScore ? "แก้ไข" : "กรอกผล"}
            </button>
          )}
          {canEdit && (
            <div className="flex flex-col gap-1 items-center">
              <button
                className="w-full px-2 py-1 rounded bg-indigo-600 text-white text-xs hover:bg-indigo-700 shadow-sm disabled:opacity-70"
                onClick={triggerSave} // [CHANGE] เรียก triggerSave
                disabled={saving}
              >
                บันทึก
              </button>
              <button
                className="w-full px-2 py-1 rounded text-slate-500 text-[10px] hover:text-red-500 underline decoration-slate-300 hover:decoration-red-300"
                onClick={cancel}
                disabled={saving}
              >
                ยกเลิก
              </button>
            </div>
          )}
        </td>
      </tr>

      {/* [NEW] Render Modal */}
      <ShuttleSelectorModal
        isOpen={showShuttleModal}
        onClose={() => setShowShuttleModal(false)}
        onConfirm={confirmSave}
        loading={saving}
      />
    </>
  );
}
