// src/pages/admin/CourtRunning.jsx
import React, { useState, useEffect } from "react";
import { API, teamName } from "@/lib/api.js";
import { useTournament } from "@/contexts/TournamentContext"; // [Phase 4] Import

// ----------------------------------------------------------------------------------
// Helper Components (ส่วนนี้เหมือนเดิม แต่รวมไว้ให้ครบในไฟล์เดียวเพื่อความสะดวก)
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

function CourtSelectionModal({ match, freeCourts, onClose, onSelect }) {
  if (!match) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
          <div>
            <h3 className="text-lg font-bold">เลือกสนามแข่ง</h3>
            <div className="text-indigo-100 text-sm mt-1">
              {teamName(match.team1)} <span className="opacity-70">vs</span> {teamName(match.team2)}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>
        <div className="p-6">
          {freeCourts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">ไม่มีคอร์ทว่างในขณะนี้</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {freeCourts.map((courtNum) => (
                <button
                  key={courtNum}
                  onClick={() => onSelect(match, courtNum)}
                  className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition active:scale-95"
                >
                  <span className="text-sm text-slate-500">คอร์ท</span>
                  <span className="text-2xl font-bold text-indigo-700">{courtNum}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="bg-gray-50 p-3 text-right">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}

function CourtBucket({ courtNumber, match, onFinish, onCancel }) {
  const [processing, setProcessing] = useState(false);

  async function handleFinish() {
    if (!match) return;
    if (!window.confirm(`ยืนยันจบการแข่งขันคอร์ท ${courtNumber}?`)) return;
    setProcessing(true);
    try {
      await API.updateSchedule(match._id, { status: "finished" });
      onFinish();
    } catch (e) { alert("Error finishing match: " + e.message); } finally { setProcessing(false); }
  }

  async function handleCancel() {
    if (!match) return;
    if (!window.confirm(`ยืนยัน "ยกเลิก" แมตช์นี้?\n(แมตช์จะกลับไปเข้าคิวรอแข่งใหม่)`)) return;
    setProcessing(true);
    try { await onCancel(match); } catch (e) { alert("Error cancelling match: " + e.message); } finally { setProcessing(false); }
  }

  return (
    <div className={`bg-white rounded-xl shadow border h-full flex flex-col transition-all duration-300 ${!!match ? "border-indigo-200 shadow-md ring-1 ring-indigo-50" : "border-slate-200"}`}>
      <div className={`px-4 py-3 border-b flex justify-between items-center ${match ? 'bg-indigo-50/50' : 'bg-gray-50'}`}>
        <h3 className={`font-bold text-lg ${match ? 'text-indigo-700' : 'text-gray-700'}`}>คอร์ท {courtNumber}</h3>
        {match && <span className="text-xs font-mono text-indigo-400">Live</span>}
      </div>
      <div className="p-4 flex-grow flex flex-col justify-center">
        {!match ? (
          <div className="flex items-center justify-center h-full text-gray-300 text-sm italic">-- ว่าง --</div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{match.handLevel}</span>
                <span className="text-xs text-gray-400">{match.matchId}</span>
              </div>
              <div className="space-y-1 mb-4">
                <div className="font-semibold text-gray-900 leading-tight">{teamName(match.team1)}</div>
                <div className="text-xs text-gray-400 font-medium">VS</div>
                <div className="font-semibold text-gray-900 leading-tight">{teamName(match.team2)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-dashed">
              <button className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors disabled:opacity-50" onClick={handleCancel} disabled={processing}>
                {processing ? "..." : "ยกเลิก / ถอย"}
              </button>
              <button className="px-3 py-2 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-200 rounded-lg transition-colors disabled:opacity-50" onClick={handleFinish} disabled={processing}>
                {processing ? "..." : "จบแมทช์ ✅"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MatchItemCard({ match, onClick }) {
  return (
    <div onClick={() => onClick(match)} className="group p-3 border border-slate-200 rounded-lg bg-white shadow-sm hover:shadow-md hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-all duration-200 active:scale-[0.98]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{formatTime(match.scheduledAt) || "Wait"}</span>
        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold uppercase tracking-wider">{match.handLevel}</span>
      </div>
      <div className="text-sm space-y-0.5">
        <div className="font-medium text-slate-800 group-hover:text-indigo-900">{teamName(match.team1)}</div>
        <div className="text-[10px] text-slate-400 flex items-center gap-2"><span>vs</span></div>
        <div className="font-medium text-slate-800 group-hover:text-indigo-900">{teamName(match.team2)}</div>
      </div>
    </div>
  );
}

function MatchQueue({ matches, onSelectMatch }) {
  return (
    <div className="bg-white rounded-xl shadow border border-slate-200 h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b bg-white z-10 shadow-sm">
        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
          <span>คิวรอแข่ง</span>
          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">{matches.length}</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">คลิกที่การ์ดเพื่อส่งลงสนาม</p>
      </div>
      <div className="p-3 space-y-2 overflow-y-auto flex-grow bg-slate-50 scrollbar-thin scrollbar-thumb-slate-200">
        {matches.length === 0 && <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm"><div className="mb-2">😴</div>ไม่มีแมทช์รอในคิว</div>}
        {matches.map((m) => <MatchItemCard key={m._id} match={m} onClick={onSelectMatch} />)}
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

  // [Phase 4] ดึง Config จาก Context
  const { selectedTournament } = useTournament();
  
  // กำหนดจำนวนคอร์ท: ใช้ค่าจาก DB หรือ Default 6
  const NUM_COURTS = selectedTournament?.settings?.totalCourts || 6; 

  const loadAll = async () => {
    setLoading(true);
    setErr("");
    try {
      const queueRes = await API.listSchedule({ status: "scheduled", sort: "matchNo", pageSize: 100 });
      setQueue(queueRes.items || []);
      const progressRes = await API.listSchedule({ status: "in-progress", pageSize: 50 });
      setInProgress(progressRes.items || []);
    } catch (e) {
      setErr(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleMatchClick = (match) => { setSelectedMatch(match); };

  const handleAssignCourt = async (match, courtNumber) => {
    const matchId = match._id;
    setQueue((prev) => prev.filter((m) => m._id !== matchId));
    const updatedMatch = { ...match, court: String(courtNumber), status: "in-progress", startedAt: new Date().toISOString() };
    setInProgress((prev) => [...prev, updatedMatch]);
    setSelectedMatch(null);
    try {
      await API.updateSchedule(matchId, { court: String(courtNumber), status: "in-progress", startedAt: updatedMatch.startedAt });
    } catch (e) { alert("Error: " + e.message); loadAll(); }
  };

  const handleCancelMatch = async (match) => {
    const matchId = match._id;
    setInProgress((prev) => prev.filter((m) => m._id !== matchId));
    const revertedMatch = { ...match, court: null, status: "scheduled", startedAt: null };
    setQueue((prev) => [...prev, revertedMatch].sort((a, b) => (a.matchNo || 0) - (b.matchNo || 0)));
    try {
      await API.updateSchedule(matchId, { court: null, status: "scheduled", startedAt: null });
    } catch (e) { alert("Error: " + e.message); loadAll(); }
  };

  // [Phase 4] Generate Courts Array Dynamic
  const courts = Array.from({ length: NUM_COURTS }, (_, i) => i + 1);
  const busyCourts = inProgress.map(m => String(m.court));
  const freeCourts = courts.filter(c => !busyCourts.includes(String(c)));

  return (
    <>
      <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Court Running (Control Room)</h1>
            <p className="text-sm text-slate-500">
                รายการ: <span className="font-semibold text-indigo-600">{selectedTournament?.name}</span> • 
                จำนวนคอร์ท: {NUM_COURTS}
            </p>
          </div>
          <button className="px-4 py-2 border border-slate-300 rounded-lg bg-white shadow-sm hover:bg-slate-50 text-slate-700 font-medium transition disabled:opacity-50 flex items-center gap-2" onClick={loadAll} disabled={loading}>
             {loading && <span className="animate-spin text-lg">⟳</span>}
             {loading ? "กำลังโหลด..." : "Refresh ข้อมูล"}
          </button>
        </div>

        {err && <div className="text-red-700 bg-red-100 border border-red-200 p-4 rounded-lg mb-6 shadow-sm">{err}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <div className="lg:col-span-1 h-[calc(100vh-180px)] sticky top-4">
            <MatchQueue matches={queue} onSelectMatch={handleMatchClick} />
          </div>
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {courts.map(num => {
                const match = inProgress.find(m => String(m.court) === String(num));
                return (
                  <CourtBucket key={num} courtNumber={num} match={match} onFinish={loadAll} onCancel={handleCancelMatch} />
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {selectedMatch && <CourtSelectionModal match={selectedMatch} freeCourts={freeCourts} onClose={() => setSelectedMatch(null)} onSelect={handleAssignCourt} />}
    </>
  );
}