// src/pages/public/PublicCourtRunning.jsx
import React, { useState, useEffect, useMemo } from "react";
import { API, teamName } from "@/lib/api.js";
import { useTournament } from "@/contexts/TournamentContext";

// --- Components ---

function CompactCourtCard({ courtNumber, match }) {
  const isLive = !!match;
  return (
    <div className={`relative bg-white border rounded-lg shadow-sm overflow-hidden flex items-stretch transition-all ${isLive ? 'border-indigo-200 ring-1 ring-indigo-50' : 'border-slate-200 bg-slate-50/50'}`}>
      <div className={`w-14 flex flex-col items-center justify-center border-r ${isLive ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
        <span className="text-[10px] font-bold uppercase opacity-70">Court</span>
        <span className="text-2xl font-black leading-none">{courtNumber}</span>
      </div>
      <div className="flex-grow p-3 min-w-0 flex flex-col justify-center">
        {!match ? (
          <div className="text-slate-400 text-sm font-medium italic text-center">-- ว่าง --</div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-1.5">
               <div className="flex items-center gap-2">
                 <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-200">
                    Match {match.matchNo}
                 </span>
                 <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block">{match.matchId}</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-red-500 uppercase">Live</span>
               </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-sm text-slate-800 leading-tight">
              <div className="font-bold truncate">{teamName(match.team1)}</div>
              <div className="text-[10px] text-slate-400 font-bold hidden sm:block">VS</div>
              <div className="font-bold truncate sm:text-right">{teamName(match.team2)}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function QueueItem({ match, index }) {
    return (
        <div className="bg-white border border-slate-200 rounded-md p-3 flex items-center gap-3 shadow-sm">
            <div className="relative bg-slate-800 text-white rounded flex flex-col items-center justify-center w-12 h-12 flex-shrink-0">
                <span className="text-[8px] uppercase font-bold opacity-70">Match</span>
                <span className="text-xl font-bold leading-none">{match.matchNo}</span>
                {/* บอกลำดับคิว */}
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center text-[9px] font-bold border border-white">
                    {index + 1}
                </div>
            </div>
            <div className="flex-grow min-w-0 overflow-hidden">
                <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-semibold border border-slate-200">
                        {match.handLevel}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                         {match.matchId}
                    </span>
                </div>
                <div className="text-sm font-medium text-slate-800 truncate">
                    {teamName(match.team1)} <span className="text-slate-400 text-xs">vs</span> {teamName(match.team2)}
                </div>
            </div>
        </div>
    )
}

// --- Main Page ---

export default function PublicCourtRunning() {
  const [loading, setLoading] = useState(true);
  const [inProgress, setInProgress] = useState([]); 
  const [nextQueue, setNextQueue] = useState([]); 
  const [activeTab, setActiveTab] = useState(0);

  const { selectedTournament } = useTournament();

  // --- Logic Config ---
  const totalCourts = selectedTournament?.settings?.totalCourts || 6;
  const COURTS_PER_TAB = 7;
  
  // จำนวน Tab ของสนาม (Court Tabs)
  const courtTabCount = Math.ceil(totalCourts / COURTS_PER_TAB);
  
  // Index ของ Tab "Coming Up" (อยู่ต่อจาก Tab สนามเสมอ)
  const queueTabIndex = courtTabCount; 

  const loadAll = async () => {
    setLoading(true);
    try {
      // 1. ดึงข้อมูลที่กำลังแข่ง
      const progressRes = await API.listSchedule({ status: "in-progress", pageSize: 50 });
      setInProgress(progressRes.items || []);

      // 2. ดึงคิวมาแสดง (จำนวนเท่ากับ totalCourts ตามที่ต้องการ)
      // เช่น มี 14 สนาม ก็ดึงคิวมา 14 คิว
      const queueRes = await API.listSchedule({ 
          status: "scheduled", 
          sort: "matchNo", 
          pageSize: totalCourts // ✅ ดึงเท่าจำนวนสนาม
      });
      setNextQueue(queueRes.items || []);

    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 15000);
    return () => clearInterval(interval);
  }, [totalCourts]); // เพิ่ม totalCourts ใน dependency เพื่อให้รีเฟรชเมื่อเปลี่ยนจำนวนสนาม

  const matchesByCourt = useMemo(() => {
    const map = {};
    for (const m of inProgress) {
      if (m.court) map[m.court] = m;
    }
    return map;
  }, [inProgress]);

  const allCourts = useMemo(() => Array.from({ length: totalCourts }, (_, i) => i + 1), [totalCourts]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Sticky Header + Tabs */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 px-4 py-3">
        <div className="max-w-md mx-auto w-full">
            <div className="flex justify-between items-center mb-3">
                <div>
                    <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        🏸 Live Score
                    </h1>
                    <p className="text-[10px] text-slate-500">{selectedTournament?.name}</p>
                </div>
                <button onClick={loadAll} disabled={loading} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full transition">
                    {loading ? "..." : "Refresh"}
                </button>
            </div>

            {/* ✅ TABS BAR (Always Show) */}
            <div className="bg-slate-100 p-1 rounded-lg flex gap-1 overflow-x-auto no-scrollbar shadow-inner">
                {/* 1. Court Tabs */}
                {Array.from({ length: courtTabCount }).map((_, idx) => {
                    const start = (idx * COURTS_PER_TAB) + 1;
                    const end = Math.min((idx + 1) * COURTS_PER_TAB, totalCourts);
                    const isActive = activeTab === idx;
                    return (
                        <button 
                            key={idx}
                            onClick={() => setActiveTab(idx)}
                            className={`flex-1 min-w-[80px] text-xs font-bold py-2 rounded-md transition-all whitespace-nowrap
                                ${isActive 
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                        >
                            Court {start}-{end}
                        </button>
                    );
                })}
                
                {/* 2. Queue Tab (Coming Up) */}
                <button 
                    onClick={() => setActiveTab(queueTabIndex)}
                    className={`flex-1 min-w-[90px] text-xs font-bold py-2 rounded-md transition-all whitespace-nowrap flex items-center justify-center gap-1.5
                        ${activeTab === queueTabIndex
                            ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-black/5' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                >
                    <span>Coming Up</span>
                    {nextQueue.length > 0 && (
                        <span className={`text-[9px] px-1.5 rounded-full font-mono ${activeTab === queueTabIndex ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-600'}`}>
                            {nextQueue.length}
                        </span>
                    )}
                </button>
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow p-4 pb-20 max-w-md mx-auto w-full">
         
         {/* CONTENT: COURTS */}
         {activeTab < courtTabCount && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-300" key={`court-${activeTab}`}>
                {allCourts.slice(activeTab * COURTS_PER_TAB, (activeTab + 1) * COURTS_PER_TAB).map((num) => (
                    <CompactCourtCard key={num} courtNumber={num} match={matchesByCourt[num]} />
                ))}
            </div>
         )}

         {/* CONTENT: QUEUE (Coming Up) */}
         {activeTab === queueTabIndex && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300" key="queue">
                <div className="flex items-center justify-between mb-4 px-1">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                           ⏳ Coming Up Next
                        </h2>
                        <p className="text-xs text-slate-500">
                           {nextQueue.length} รายการถัดไป (สำหรับ {totalCourts} สนาม)
                        </p>
                    </div>
                </div>

                {nextQueue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                        <span className="text-2xl mb-2">😴</span>
                        <span className="text-sm font-medium">ไม่มีรายการรอแข่ง</span>
                    </div>
                ) : (
                    <div className="space-y-2">
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