// src/pages/admin/CourtRunning.jsx
import React, { useState, useEffect, useMemo } from "react";
import { API, teamName } from "@/lib/api.js";
import { useTournament } from "@/contexts/TournamentContext";

// ----------------------------------------------------------------------------------
// Helper Components
// ----------------------------------------------------------------------------------

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

// ✅ Helper ใหม่: ดึงชื่อเล่นนักกีฬามาแสดง
function getPlayerNames(team) {
  if (!team || !team.players || !Array.isArray(team.players)) return "";
  const names = team.players
    .map((p) => p.nickname || p.fullName)
    .filter(Boolean);
  if (names.length === 0) return "";
  return `(${names.join(", ")})`;
}

// Modal เลือกสนาม (แก้ไขเพิ่มปุ่ม Extend)
function CourtSelectionModal({
  match,
  freeCourts,
  onClose,
  onSelect,
  onToggleHold,
}) {
  if (!match) return null;
  const isHold = match.isHold === true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className={`rounded-xl shadow-2xl w-full max-w-xl overflow-hidden transform transition-all scale-100 ${
          isHold ? "bg-amber-50" : "bg-white"
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 text-white flex justify-between items-start ${
            isHold ? "bg-amber-500" : "bg-slate-800"
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  isHold
                    ? "bg-white text-amber-700"
                    : "bg-indigo-500 text-white"
                }`}
              >
                Match {match.matchNo}
              </span>
              {/* ป้ายเตือนใน Modal */}
              {isHold && (
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded border border-white/30">
                  ⚠️ EXTEND
                </span>
              )}
              <span
                className={`${
                  isHold ? "text-amber-100" : "text-slate-300"
                } text-sm`}
              >
                {match.matchId}
              </span>
            </div>
            <h3 className="text-lg font-bold leading-tight">
              {teamName(match.team1)}{" "}
              <span
                className={`${
                  isHold ? "text-amber-200" : "text-slate-400"
                } mx-1`}
              >
                vs
              </span>{" "}
              {teamName(match.team2)}
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`${
              isHold
                ? "text-amber-100 hover:text-white"
                : "text-slate-400 hover:text-white"
            } transition`}
          >
            <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* ✅ ปุ่ม Action: กดเพื่อเลื่อน/ยกเลิกเลื่อน */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => onToggleHold(match)}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition shadow-sm border
                  ${
                    isHold
                      ? "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      : "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"
                  }`}
            >
              {isHold ? "▶️ ยกเลิก Extend (พร้อมแข่ง)" : "⏳ เลื่อน (Extend)"}
            </button>
          </div>

          <h4 className="text-center text-slate-500 mb-4 text-sm font-medium">
            {isHold
              ? "⚠️ แมทช์นี้ถูกเลื่อนออกไป (หากพร้อมแล้วให้กดเลือกสนามด้านล่าง)"
              : "เลือกสนามที่ว่างเพื่อเริ่มการแข่งขัน"}
          </h4>

          {freeCourts.length === 0 ? (
            <div className="text-center text-red-500 py-6 bg-red-50 rounded-lg border border-red-100">
              ❌ ขณะนี้ไม่มีคอร์ทว่าง
            </div>
          ) : (
            <div
              className={`grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar p-1 ${
                isHold ? "opacity-50 hover:opacity-100 transition-opacity" : ""
              }`}
            >
              {freeCourts.map((courtNum) => (
                <button
                  key={courtNum}
                  onClick={() => {
                    // กันลั่น: ถ้า Hold อยู่ ต้อง Confirm ก่อน
                    if (
                      isHold &&
                      !window.confirm(
                        "แมทช์นี้ถูกกด Extend ไว้\nยืนยันที่จะเรียกลงสนาม?"
                      )
                    )
                      return;
                    onSelect(match, courtNum);
                  }}
                  className="group flex flex-col items-center justify-center p-3 rounded-xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition active:scale-95 bg-white"
                >
                  <span className="text-xs text-slate-400 group-hover:text-indigo-600 font-medium">
                    คอร์ท
                  </span>
                  <span className="text-3xl font-black text-slate-700 group-hover:text-indigo-700">
                    {courtNum}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// การ์ดสนาม (Control Panel) - ปรับปรุง Layout
function CourtBucket({ courtNumber, match, onFinish, onCancel }) {
  const [processing, setProcessing] = useState(false);

  async function handleFinish() {
    if (!match) return;
    if (!window.confirm(`ยืนยันจบการแข่งขันคอร์ท ${courtNumber}?`)) return;
    setProcessing(true);
    try {
      await API.updateSchedule(match._id, { status: "finished" });
      onFinish(false); // เรียก loadAll แบบ manual (show loading) หรือ false ก็ได้ตามชอบ
    } catch (e) {
      alert("Error finishing match: " + e.message);
    } finally {
      setProcessing(false);
    }
  }

  async function handleCancel() {
    if (!match) return;
    if (
      !window.confirm(
        `ยืนยัน "ยกเลิก" แมตช์นี้?\n(แมตช์จะกลับไปเข้าคิวรอแข่งใหม่)`
      )
    )
      return;
    setProcessing(true);
    try {
      await onCancel(match);
    } catch (e) {
      alert("Error cancelling match: " + e.message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div
      className={`relative bg-white rounded-xl shadow border h-full flex flex-col transition-all duration-300 ${
        !!match
          ? "border-indigo-500 ring-2 ring-indigo-100 shadow-lg"
          : "border-slate-200"
      }`}
    >
      {/* Header เลขคอร์ท */}
      <div
        className={`px-4 py-3 border-b flex justify-between items-center rounded-t-xl ${
          match ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-600"
        }`}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-lg">คอร์ท {courtNumber}</h3>
          {match && (
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">
              LIVE
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex-grow flex flex-col justify-center">
        {!match ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 space-y-2 py-6">
            <span className="text-4xl opacity-20">🏸</span>
            <span className="text-sm font-medium">ว่าง (Available)</span>
          </div>
        ) : (
          <div className="flex flex-col h-full relative">
            {/* ✅ MATCH ID (ย้ายไปมุมซ้ายบน) */}
            <div className="absolute top-0 left-0">
              <span
                className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200 block w-fit max-w-[150px] truncate"
                title={`${match.handLevel} / ${match.matchId}`}
              >
                {match.handLevel} / {match.matchId}
              </span>
            </div>

            {/* ✅ MATCH NO (มุมขวาบน) */}
            <div className="absolute top-0 right-0">
              <div className="flex flex-col items-center bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-1 rounded-lg shadow-sm">
                <span className="text-[8px] uppercase font-bold leading-none tracking-wider text-indigo-400">
                  Match
                </span>
                <span className="text-xl font-black leading-none">
                  {match.matchNo}
                </span>
              </div>
            </div>

            {/* Content (ดันลงมาด้วย pt-10 เพื่อไม่ให้ชนป้ายด้านบน) */}
            <div className="flex-grow pt-10">
              <div className="space-y-4 mb-4">
                {/* Team 1 */}
                <div>
                  <div className="font-bold text-gray-900 text-lg leading-tight">
                    {teamName(match.team1)}
                  </div>
                  <div className="text-sm text-indigo-600 font-medium mt-0.5">
                    {getPlayerNames(match.team1)}
                  </div>
                </div>

                <div className="text-xs text-gray-300 font-bold italic pl-1">
                  VS
                </div>

                {/* Team 2 */}
                <div>
                  <div className="font-bold text-gray-900 text-lg leading-tight">
                    {teamName(match.team2)}
                  </div>
                  <div className="text-sm text-indigo-600 font-medium mt-0.5">
                    {getPlayerNames(match.team2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-dashed border-gray-200">
              <button
                className="px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors disabled:opacity-50"
                onClick={handleCancel}
                disabled={processing}
              >
                {processing ? "..." : "↩ ยกเลิก"}
              </button>
              <button
                className="px-3 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-200 rounded-lg transition-colors disabled:opacity-50"
                onClick={handleFinish}
                disabled={processing}
              >
                {processing ? "..." : "จบแมทช์ ✓"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// รายการในคิว (แก้ไขแสดงผลสีเหลืองถ้า Hold)
function MatchQueueItem({ match, onClick }) {
  const isHold = match.isHold === true;

  return (
    <div
      onClick={() => onClick(match)}
      className={`group relative flex items-stretch border rounded-lg shadow-sm cursor-pointer transition-all active:scale-[0.98] overflow-hidden
        ${
          isHold
            ? "bg-amber-50 border-amber-300 ring-1 ring-amber-200" // สีเหลืองเมื่อ Hold
            : "bg-white border-slate-200 hover:shadow-md hover:border-indigo-400 hover:ring-1 hover:ring-indigo-100"
        }
      `}
    >
      <div
        className={`w-14 flex flex-col items-center justify-center flex-shrink-0 transition-colors
        ${
          isHold
            ? "bg-amber-400 text-amber-900"
            : "bg-slate-800 text-white group-hover:bg-indigo-600"
        }
      `}
      >
        {isHold ? (
          <>
            <span className="text-xl">⏳</span>
            <span className="text-[8px] font-bold mt-1">EXTEND</span>
          </>
        ) : (
          <>
            <span className="text-[9px] uppercase font-bold opacity-70">
              Match
            </span>
            <span className="text-xl font-bold leading-none">
              {match.matchNo}
            </span>
          </>
        )}
      </div>

      <div className="flex-grow p-2.5 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border 
            ${
              isHold
                ? "bg-amber-100 text-amber-800 border-amber-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {match.handLevel}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {formatTime(match.scheduledAt)}
          </span>
        </div>

        <div className="text-sm font-medium text-slate-800 leading-tight truncate pr-1">
          <span
            className={`${
              isHold ? "" : "group-hover:text-indigo-700"
            } transition-colors`}
          >
            {teamName(match.team1)}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 my-0.5">vs</div>
        <div className="text-sm font-medium text-slate-800 leading-tight truncate pr-1">
          <span
            className={`${
              isHold ? "" : "group-hover:text-indigo-700"
            } transition-colors`}
          >
            {teamName(match.team2)}
          </span>
        </div>

        {/* ป้ายเตือนมุมขวาล่าง */}
        {isHold ? (
          <div className="absolute right-2 bottom-2">
            <span className="bg-amber-200 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-300 animate-pulse">
              เลื่อน (Extend)
            </span>
          </div>
        ) : (
          <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow">
              เลือก
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------------------

export default function CourtRunningPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [queue, setQueue] = useState([]);
  const [inProgress, setInProgress] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);

  // ✅ เพิ่ม State สำหรับแสดงเวลาอัปเดต
  const [lastUpdated, setLastUpdated] = useState(null);

  const { selectedTournament } = useTournament();

  const totalCourts = selectedTournament?.settings?.totalCourts || 6;

  const courts = useMemo(() => {
    return Array.from({ length: totalCourts }, (_, i) => i + 1);
  }, [totalCourts]);

  // ✅ ปรับปรุง loadAll ให้รองรับ "Silent Mode" (ไม่หมุนติ้วๆ ถ้าระบบ Auto Refresh เอง)
  const loadAll = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    // setErr(""); // Option: อาจจะไม่เคลียร์ error ใน background เพื่อให้เห็น error ค้างไว้ถ้ามีปัญหา

    try {
      const [queueRes, progressRes] = await Promise.all([
        API.listSchedule({
          status: "scheduled",
          sort: "matchNo",
          pageSize: 100,
        }),
        API.listSchedule({
          status: "in-progress",
          pageSize: 50,
        }),
      ]);

      setQueue(queueRes.items || []);
      setInProgress(progressRes.items || []);
      setLastUpdated(new Date()); // อัปเดตเวลาล่าสุด
    } catch (e) {
      console.error("Auto Refresh Error:", e);
      if (!isBackground) setErr(e.message || "Failed to load data");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // ✅ useEffect สำหรับ Initial Load และ Auto Refresh Interval
  useEffect(() => {
    // 1. โหลดครั้งแรก (Show Loading)
    loadAll(false);

    // 2. ตั้งเวลาโหลดทุก 5 วินาที (Silent Mode)
    const intervalId = setInterval(() => {
      loadAll(true);
    }, 5000);

    // Cleanup เมื่อปิดหน้า
    return () => clearInterval(intervalId);
  }, []);

  const handleMatchClick = (match) => {
    setSelectedMatch(match);
  };

  // ✅ เพิ่มฟังก์ชันสลับสถานะ Hold (Extend)
  const handleToggleHold = async (match) => {
    const newHoldStatus = !match.isHold;

    // 1. Optimistic Update (แก้ที่หน้าจอทันที)
    setQueue((prev) =>
      prev.map((m) => {
        if (m._id === match._id) return { ...m, isHold: newHoldStatus };
        return m;
      })
    );

    // อัปเดต Modal ถ้าเปิดอยู่
    if (selectedMatch && selectedMatch._id === match._id) {
      setSelectedMatch((prev) => ({ ...prev, isHold: newHoldStatus }));
    }

    try {
      // 2. ส่งไป Backend
      await API.updateSchedule(match._id, { isHold: newHoldStatus });
      loadAll(true); // โหลดซ้ำเพื่อความชัวร์
    } catch (e) {
      alert("Error: " + e.message);
      loadAll(false); // ถ้าพังให้โหลดใหม่
    }
  };

  const handleAssignCourt = async (match, courtNumber) => {
    const matchId = match._id;

    // Optimistic Update: ทำทันทีให้ User รู้สึกเร็ว
    setQueue((prev) => prev.filter((m) => m._id !== matchId));
    const updatedMatch = {
      ...match,
      court: String(courtNumber),
      status: "in-progress",
      startedAt: new Date().toISOString(),
      isHold: false, // ✅ Clear Hold เมื่อลงสนาม
    };
    setInProgress((prev) => [...prev, updatedMatch]);
    setSelectedMatch(null);

    try {
      await API.updateSchedule(matchId, {
        court: String(courtNumber),
        status: "in-progress",
        startedAt: updatedMatch.startedAt,
        isHold: false, // ✅ ส่งไป Backend ให้เอา Hold ออก
      });
      // หลังทำเสร็จ อาจจะ Force Refresh อีกทีเพื่อให้ข้อมูลชัวร์สุด
      loadAll(true);
    } catch (e) {
      alert("Error: " + e.message);
      loadAll(false); // ถ้า Error ให้โหลดใหม่แบบเต็มรูปแบบ
    }
  };

  const handleCancelMatch = async (match) => {
    const matchId = match._id;
    // Optimistic Update
    setInProgress((prev) => prev.filter((m) => m._id !== matchId));
    const revertedMatch = {
      ...match,
      court: null,
      status: "scheduled",
      startedAt: null,
    };
    setQueue((prev) =>
      [...prev, revertedMatch].sort(
        (a, b) => (a.matchNo || 0) - (b.matchNo || 0)
      )
    );

    try {
      await API.updateSchedule(matchId, {
        court: null,
        status: "scheduled",
        startedAt: null,
      });
      loadAll(true);
    } catch (e) {
      alert("Error: " + e.message);
      loadAll(false);
    }
  };

  const busyCourts = inProgress.map((m) => String(m.court));
  const freeCourts = courts.filter((c) => !busyCourts.includes(String(c)));

  return (
    <>
      <div className="p-4 bg-slate-100 min-h-screen font-sans">
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
              🎛️ Control Room
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              จัดการลำดับการลงสนาม • {selectedTournament?.name || "Tournament"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* ✅ แสดงเวลาอัปเดตล่าสุด */}
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs text-slate-400">ข้อมูลล่าสุด</span>
              <span className="text-xs font-mono text-slate-600">
                {lastUpdated ? lastUpdated.toLocaleTimeString("th-TH") : "-"}
              </span>
            </div>

            <div className="hidden md:flex flex-col items-end mr-2 pl-4 border-l">
              <span className="text-xs text-slate-400">คิวรอแข่ง</span>
              <span className="text-lg font-bold text-indigo-600">
                {queue.length} แมทช์
              </span>
            </div>
            <button
              onClick={() => loadAll(false)} // กดเองให้โหลดแบบ Show Loading
              disabled={loading}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition flex items-center gap-2 text-sm font-bold"
            >
              {loading ? (
                <span>Loading...</span>
              ) : (
                <>
                  ↻ <span className="hidden sm:inline">Refresh</span>
                </>
              )}
            </button>
          </div>
        </div>

        {err && (
          <div className="text-red-700 bg-red-100 p-4 rounded-lg mb-4 text-sm">
            {err}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-140px)]">
          {/* LEFT: Queue (Sidebar) */}
          <div className="lg:col-span-1 flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-3 border-b bg-slate-50 flex justify-between items-center">
              <span className="font-bold text-slate-700">
                คิวรอเรียก (Queue)
              </span>
              <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                {queue.length}
              </span>
            </div>

            <div className="flex-grow overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-300">
              {queue.length === 0 && (
                <div className="text-center text-slate-400 py-10 text-sm">
                  {loading ? "กำลังโหลด..." : "-- ว่าง --"}
                  <br />
                  {!loading && "(ไม่มีแมทช์รอแข่ง)"}
                </div>
              )}
              {queue.map((m) => (
                <MatchQueueItem
                  key={m._id}
                  match={m}
                  onClick={handleMatchClick}
                />
              ))}
            </div>
          </div>

          {/* RIGHT: Active Courts */}
          <div className="lg:col-span-3 overflow-y-auto pb-10">
            {/* Grid ปรับตามจำนวนสนามอัตโนมัติ */}
            <div
              className={`grid gap-4 ${
                totalCourts > 6
                  ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                  : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              }`}
            >
              {courts.map((num) => {
                const match = inProgress.find(
                  (m) => String(m.court) === String(num)
                );
                return (
                  <CourtBucket
                    key={num}
                    courtNumber={num}
                    match={match}
                    onFinish={(val) => loadAll(val ?? false)}
                    onCancel={handleCancelMatch}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal - เพิ่ม props onToggleHold */}
      {selectedMatch && (
        <CourtSelectionModal
          match={selectedMatch}
          freeCourts={freeCourts}
          onClose={() => setSelectedMatch(null)}
          onSelect={handleAssignCourt}
          onToggleHold={handleToggleHold}
        />
      )}
    </>
  );
}
