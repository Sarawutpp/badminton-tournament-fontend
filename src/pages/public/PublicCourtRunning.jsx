// src/pages/public/PublicCourtRunning.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { API, teamName } from "@/lib/api.js";
import { useTournament } from "@/contexts/TournamentContext";

// --- Helper Functions ---
// (เหมือนเดิม ไม่ต้องแก้)
function getPlayerNames(team) {
  if (!team || !team.players || !Array.isArray(team.players)) return "";
  const names = team.players
    .map((p) => p.nickname || p.fullName)
    .filter(Boolean);
  if (names.length === 0) return "";
  return `(${names.join(", ")})`;
}

function getRoundLabel(match) {
  if (!match) return "";
  if (match.roundType === "knockout") {
    const r = (match.round || "").toUpperCase();
    if (r === "F" || r === "FINAL") return "🏆 รอบชิงชนะเลิศ";
    if (r === "SF" || r === "SEMI FINAL") return "🔥 รอบรองฯ";
    if (r === "QF") return "รอบ 8 ทีม";
    return match.round;
  }
  if (match.roundType === "group") {
    return `รอบแบ่งกลุ่ม (${match.group || "-"})`;
  }
  return match.round || "";
}

// --- Components ---

// ✅ [แก้ไขครั้งใหญ่] ปรับน้ำหนักฟอนต์ใน Card นี้
function CompactCourtCard({ courtNumber, match, isTvMode = false }) {
  const isLive = !!match;

  const containerClass = isTvMode
    ? `h-full min-h-[140px] flex-col`
    : `min-h-[90px] flex-row`;

  const courtBoxClass = isTvMode
    ? `w-full h-10 flex-row gap-2 border-b`
    : `w-12 flex-col border-r`;

  return (
    <div
      className={`relative bg-white border rounded-xl shadow-sm overflow-hidden flex transition-all ${
        isLive
          ? "border-indigo-500 ring-1 ring-indigo-500 shadow-md"
          : "border-slate-200 bg-slate-50/50"
      } ${containerClass}`}
    >
      {/* 1. Court Number Label */}
      <div
        className={`flex items-center justify-center shrink-0 ${
          isLive
            ? "bg-indigo-600 text-white border-indigo-600"
            : "bg-slate-100 text-slate-400 border-slate-200"
        } ${courtBoxClass}`}
      >
        {/* ปรับ font-bold เป็น font-semibold */}
        <span
          className={`font-semibold uppercase opacity-80 tracking-wider ${
            isTvMode ? "text-xs" : "text-[9px]"
          }`}
        >
          Court
        </span>
        {/* ปรับ font-black เป็น font-extrabold (ลดความตันลงนิดนึง) */}
        <span
          className={`${
            isTvMode ? "text-xl" : "text-2xl"
          } font-extrabold leading-none ${!isTvMode && "-mt-1"}`}
        >
          {courtNumber}
        </span>
      </div>

      {/* 2. Content */}
      <div className="flex-grow p-2.5 min-w-0 flex flex-col justify-center relative">
        {!match ? (
          <div className="text-slate-400 text-sm font-medium italic text-center py-2 h-full flex items-center justify-center">
            -- สนามว่าง --
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-wrap gap-1 items-center pr-8">
                {/* ป้ายรุ่น: ปรับ font-bold เป็น font-semibold */}
                <span className="bg-orange-100 text-orange-800 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-orange-200 whitespace-nowrap">
                  {match.handLevel}
                </span>
                <span
                  className={`font-medium text-slate-500 truncate max-w-[120px] ${
                    isTvMode ? "text-xs" : "text-[10px]"
                  }`}
                >
                  {getRoundLabel(match)}
                </span>
              </div>

              {/* Match No & Live Badge */}
              <div className="absolute top-2 right-2 flex flex-col items-end">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                  </span>
                  {/* LIVE badge ปล่อย font-bold ไว้ได้ เพราะต้องการเตือน */}
                  <span className="text-[9px] font-bold text-red-500 uppercase tracking-wide">
                    LIVE
                  </span>
                </div>
                {/* Match No: ปรับ font-bold เป็น font-semibold */}
                <div className="text-xs font-semibold text-slate-600 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                  #{match.matchNo}
                </div>
              </div>
            </div>

            {/* Teams Info */}
            <div
              className={`space-y-1 ${
                isTvMode ? "flex-grow flex flex-col justify-center gap-1" : ""
              }`}
            >
              {/* Team 1 */}
              <div className="leading-tight">
                {/* ✅ ชื่อทีม: ปรับ font-bold เป็น font-semibold และเพิ่มขนาดนิดนึงในโหมดปกติ */}
                <div
                  className={`${
                    isTvMode ? "text-lg" : "text-[15px]"
                  } font-semibold text-slate-800 truncate`}
                >
                  {teamName(match.team1)}
                </div>
                <div className="text-[10px] text-slate-500 truncate pl-0.5 font-medium">
                  {getPlayerNames(match.team1)}
                </div>
              </div>

              {/* VS Divider */}
              <div className="flex items-center gap-2 my-0.5">
                <div className="h-px bg-slate-100 flex-grow"></div>
                {/* VS: ทำให้เล็กลงและจางลง เพื่อให้ชื่อทีมเด่นขึ้น */}
                <span className="text-[8px] font-semibold text-slate-300 uppercase">
                  VS
                </span>
                <div className="h-px bg-slate-100 flex-grow"></div>
              </div>

              {/* Team 2 */}
              <div className="leading-tight">
                {/* ✅ ชื่อทีม: ปรับ font-bold เป็น font-semibold */}
                <div
                  className={`${
                    isTvMode ? "text-lg" : "text-[15px]"
                  } font-semibold text-slate-800 truncate`}
                >
                  {teamName(match.team2)}
                </div>
                <div className="text-[10px] text-slate-500 truncate pl-0.5 font-medium">
                  {getPlayerNames(match.team2)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ✅ [แก้ไขเพิ่มเติม] ปรับ QueueItem ให้สไตล์ตรงกัน
function QueueItem({ match, index }) {
  const isHold = match.isHold === true;

  return (
    <div
      className={`border rounded-xl p-3 flex items-center gap-3 shadow-sm transition-all
        ${
          isHold
            ? "bg-amber-50 border-amber-300 shadow-none opacity-90" // สีเหลืองเมื่อ Hold
            : "bg-white border-slate-200 hover:shadow-md"
        }
    `}
    >
      {/* Box เลข Match ด้านซ้าย */}
      <div
        className={`relative rounded-lg flex flex-col items-center justify-center w-12 h-12 flex-shrink-0
         ${isHold ? "bg-amber-500 text-white" : "bg-slate-800 text-white"}
      `}
      >
        {isHold ? (
          // ไอคอนนาฬิกาเมื่อ Extend
          <span className="text-2xl">⏳</span>
        ) : (
          <>
            <span className="text-[8px] uppercase font-semibold opacity-60">
              Match
            </span>
            <span className="text-lg font-extrabold leading-none">
              {match.matchNo}
            </span>
          </>
        )}

        {/* ลำดับคิว (แสดงเฉพาะตอนไม่ Hold) */}
        {!isHold && (
          <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm">
            {index + 1}
          </div>
        )}
      </div>

      <div className="flex-grow min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          {/* ✅ ป้ายสถานะ เปลี่ยนคำเป็น "เลื่อน (Extend)" */}
          {isHold ? (
            <span className="text-[10px] px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full font-bold border border-amber-300 animate-pulse">
              เลื่อน (Extend)
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded font-semibold border border-orange-100">
              {match.handLevel}
            </span>
          )}

          <span className="text-[10px] text-slate-400 truncate border-l border-slate-200 pl-2">
            {getRoundLabel(match)}
          </span>
        </div>

        {/* ชื่อทีม (ถ้า Hold ให้สีจางลงนิดหน่อย) */}
        <div
          className={`text-sm font-semibold truncate ${
            isHold ? "text-slate-500" : "text-slate-800"
          }`}
        >
          {teamName(match.team1)}
        </div>
        <div className="text-[10px] text-slate-400 font-medium pl-0.5 truncate">
          {getPlayerNames(match.team1)}
        </div>
        <div className="text-[10px] text-slate-400 my-0.5 italic">vs</div>
        <div
          className={`text-sm font-semibold truncate ${
            isHold ? "text-slate-500" : "text-slate-800"
          }`}
        >
          {teamName(match.team2)}
        </div>
        <div className="text-[10px] text-slate-400 font-medium pl-0.5 truncate">
          {getPlayerNames(match.team2)}
        </div>
      </div>
    </div>
  );
}

// --- Main Page (ส่วนนี้เหมือนเดิม ไม่ต้องแก้) ----

export default function PublicCourtRunning() {
  const [loading, setLoading] = useState(true);
  const [inProgress, setInProgress] = useState([]);
  const [nextQueue, setNextQueue] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  const [isTvMode, setIsTvMode] = useState(false);
  const pageRef = useRef(null);

  const { selectedTournament } = useTournament();

  const totalCourts = selectedTournament?.settings?.totalCourts || 6;
  const COURTS_PER_TAB = 7;
  const courtTabCount = Math.ceil(totalCourts / COURTS_PER_TAB);
  const queueTabIndex = courtTabCount;

  const loadAll = async () => {
    setLoading(true);
    try {
      const progressRes = await API.listSchedule({
        status: "in-progress",
        pageSize: 50,
      });
      setInProgress(progressRes.items || []);
      const queueRes = await API.listSchedule({
        status: "scheduled",
        sort: "matchNo",
        pageSize: totalCourts,
      });
      setNextQueue(queueRes.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 10000);
    return () => clearInterval(interval);
  }, [totalCourts]);

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement) setIsTvMode(false);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleTvMode = () => {
    if (!isTvMode) {
      if (pageRef.current?.requestFullscreen) {
        pageRef.current.requestFullscreen().catch((err) => {
          alert("Error enabling fullscreen: " + err.message);
        });
        setIsTvMode(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsTvMode(false);
    }
  };

  const matchesByCourt = useMemo(() => {
    const map = {};
    for (const m of inProgress) {
      if (m.court) map[m.court] = m;
    }
    return map;
  }, [inProgress]);

  const allCourts = useMemo(
    () => Array.from({ length: totalCourts }, (_, i) => i + 1),
    [totalCourts]
  );

  // ============================================
  // 📺 RENDER: TV MODE
  // ============================================
  if (isTvMode) {
    return (
      <div
        ref={pageRef}
        // ✅ ตรงนี้ไม่ต้องใส่ font-kanit หรือ font-sans แล้ว เพราะเราแก้ที่ tailwind.config.js แล้ว
        className="w-full h-screen bg-slate-900 text-white p-4 overflow-hidden flex flex-col"
      >
        {/* Header TV */}
        <div className="flex justify-between items-center mb-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-2xl">
              🏸
            </div>
            <div>
              {/* ปรับ Header TV เป็น extrabold */}
              <h1 className="text-2xl font-extrabold">
                {selectedTournament?.name}
              </h1>
              <p className="text-indigo-300 text-sm font-medium">
                Live Court Status
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xl font-mono bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
              {new Date().toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <button
              onClick={toggleTvMode}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-colors"
            >
              Exit TV Mode
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-grow flex gap-4 overflow-hidden">
          {/* Left: Courts (Grid) */}
          <div className="flex-grow bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {allCourts.map((num) => (
                <CompactCourtCard
                  key={num}
                  courtNumber={num}
                  match={matchesByCourt[num]}
                  isTvMode={true}
                />
              ))}
            </div>
          </div>

          {/* Right: Queue (List) */}
          <div className="w-[25%] min-w-[300px] bg-slate-800 rounded-2xl p-4 border border-slate-700 flex flex-col">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-400">
              <span>⏳ Next Matches</span>
            </h2>
            <div className="flex-grow overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {nextQueue.length === 0 ? (
                <div className="text-slate-500 text-center mt-10">
                  No matches in queue
                </div>
              ) : (
                nextQueue.map((match, i) => (
                  <QueueItem key={match._id} match={match} index={i} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // 📱 RENDER: MOBILE / STANDARD MODE
  // ============================================
  return (
    <div ref={pageRef} className="min-h-screen bg-slate-100 flex flex-col">
      {/* Sticky Header + Tabs */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 px-4 py-3">
        <div className="max-w-md mx-auto w-full">
          <div className="flex justify-between items-center mb-3">
            <div>
              {/* ปรับ Header มือถือเป็น extrabold */}
              <h1 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                🏸 Live Score
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">
                {selectedTournament?.name}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleTvMode}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-full transition shadow-sm flex items-center gap-1"
              >
                <span>📺</span> TV Mode
              </button>
              <button
                onClick={loadAll}
                disabled={loading}
                className="text-xs bg-slate-50 hover:bg-slate-100 text-indigo-600 font-medium px-3 py-1.5 rounded-full transition border border-indigo-100"
              >
                {loading ? "..." : "↻"}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 overflow-x-auto no-scrollbar shadow-inner">
            {Array.from({ length: courtTabCount }).map((_, idx) => {
              const start = idx * COURTS_PER_TAB + 1;
              const end = Math.min((idx + 1) * COURTS_PER_TAB, totalCourts);
              const isActive = activeTab === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  // ปรับ font tab เป็น semibold
                  className={`flex-1 min-w-[80px] text-xs font-semibold py-2 rounded-lg transition-all whitespace-nowrap
                                ${
                                  isActive
                                    ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                }`}
                >
                  Court {start}-{end}
                </button>
              );
            })}
            <button
              onClick={() => setActiveTab(queueTabIndex)}
              // ปรับ font tab เป็น semibold
              className={`flex-1 min-w-[90px] text-xs font-semibold py-2 rounded-lg transition-all whitespace-nowrap flex items-center justify-center gap-1.5
                        ${
                          activeTab === queueTabIndex
                            ? "bg-indigo-600 text-white shadow-sm ring-1 ring-black/5"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                        }`}
            >
              <span>Coming Up</span>
              {nextQueue.length > 0 && (
                <span
                  className={`text-[9px] px-1.5 rounded-full font-mono ${
                    activeTab === queueTabIndex
                      ? "bg-white/20 text-white"
                      : "bg-slate-300 text-slate-600"
                  }`}
                >
                  {nextQueue.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow p-4 pb-24 max-w-md mx-auto w-full">
        {activeTab < courtTabCount && (
          <div
            className="space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-300"
            key={`court-${activeTab}`}
          >
            {allCourts
              .slice(
                activeTab * COURTS_PER_TAB,
                (activeTab + 1) * COURTS_PER_TAB
              )
              .map((num) => (
                <CompactCourtCard
                  key={num}
                  courtNumber={num}
                  match={matchesByCourt[num]}
                />
              ))}
          </div>
        )}

        {activeTab === queueTabIndex && (
          <div
            className="animate-in fade-in slide-in-from-right-4 duration-300"
            key="queue"
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                  ⏳ Coming Up Next
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {nextQueue.length} รายการถัดไป
                </p>
              </div>
            </div>
            {nextQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                <span className="text-2xl mb-2">😴</span>
                <span className="text-sm font-medium">ไม่มีรายการรอแข่ง</span>
              </div>
            ) : (
              <div className="space-y-3">
                {nextQueue.map((match, i) => (
                  <QueueItem key={match._id} match={match} index={i} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
