// src/pages/admin/CourtRunning.jsx
// (เวอร์ชันอัปเกรด DragOverlay)
import React, { useState, useEffect } from "react";
import { API, teamName } from "@/lib/api.js";
// 1. Import DragOverlay เพิ่ม
import { DndContext, DragOverlay, useDraggable, useDroppable } from "@dnd-kit/core";

// ฟังก์ชันสำหรับแปลงเวลา
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

// --- Component: คอร์ท (ที่วางได้) ---
function CourtBucket({ courtNumber, match, onFinish }) {
  const [saving, setSaving] = useState(false);
  
  const { isOver, setNodeRef } = useDroppable({
    id: courtNumber,
    disabled: !!match, 
  });

  async function handleFinish() {
    if (!match) return;
    setSaving(true);
    try {
      await API.updateSchedule(match._id, { status: "finished" });
      onFinish(); 
    } catch (e) {
      alert("Error finishing match: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      ref={setNodeRef} 
      className={`bg-white rounded-xl shadow border h-full flex flex-col transition-colors ${
        isOver ? "bg-green-100 border-green-400" : "" 
      } ${
        !!match ? "bg-gray-50 opacity-70" : "" 
      }`}
    >
      <div className="p-4 border-b bg-gray-50">
        <h3 className="font-bold text-lg">คอร์ท {courtNumber}</h3>
      </div>
      <div className="p-4 flex-grow">
        {!match ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            {isOver ? "วางที่นี่" : "-- ว่าง --"}
          </div>
        ) : (
          <div>
            <div className="text-sm text-indigo-600 font-semibold">{match.handLevel} / {match.group}</div>
            <div className="mt-1">
              <strong>{teamName(match.team1)}</strong>
              <span className="text-gray-400"> vs </span>
              <strong>{teamName(match.team2)}</strong>
            </div>
            <div className="text-xs text-gray-500 mt-1">{match.matchId}</div>
            <button
              className="w-full mt-4 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300"
              onClick={handleFinish}
              disabled={saving}
            >
              {saving ? "..." : "จบแมทช์นี้"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 2. สร้าง Component "การ์ด" (สำหรับแสดงผลอย่างเดียว) ---
function MatchItemCard({ match }) {
  return (
    <div className="p-3 border rounded-lg bg-white shadow-sm cursor-grab">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{formatTime(match.scheduledAt) || "N/A"}</span>
        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{match.handLevel}</span>
      </div>
      <div className="mt-1 text-sm">
        <strong>{teamName(match.team1)}</strong>
        <span className="text-gray-400"> vs </span>
        <strong>{teamName(match.team2)}</strong>
      </div>
    </div>
  );
}

// --- 3. "ตัวลาก" (Draggable) จะเรียกใช้ "การ์ด" ---
// (ตัวมันเองจะถูกซ่อนเมื่อลาก)
function DraggableMatchItem({ match }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: match._id,
  });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      // เมื่อลาก "ตัวจริง" จะโปร่งใส
      className={isDragging ? "opacity-0" : ""}
    >
      <MatchItemCard match={match} />
    </div>
  );
}

// --- Component: กล่องคิว ---
function MatchQueue({ matches }) {
  return (
    <div className="bg-white rounded-xl shadow border h-full flex flex-col">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="font-bold text-lg">คิวรอแข่ง (จาก Master List)</h3>
      </div>
      <div className="p-2 space-y-2 overflow-y-auto">
        {matches.length === 0 && <div className="p-4 text-center text-gray-400">ไม่มีแมทช์รอในคิว</div>}
        {matches.map((m) => (
          <DraggableMatchItem key={m._id} match={m} />
        ))}
      </div>
    </div>
  );
}

// --- Component หลัก ---
const NUM_COURTS = 14; 
export default function CourtRunningPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [queue, setQueue] = useState([]); 
  const [inProgress, setInProgress] = useState([]); 
  
  // --- 4. เพิ่ม State เพื่อเก็บ ID ของสิ่งที่กำลังลาก ---
  const [activeId, setActiveId] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setErr("");
    try {
      const queueRes = await API.listSchedule({ status: "scheduled", sort: "matchNo", pageSize: 50 });
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

  // --- 5. เพิ่มฟังก์ชัน 2 ตัวเพื่อควบคุม Overlay ---
  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  async function handleDragEnd(event) {
    setActiveId(null); // ซ่อน Overlay ทันทีที่ปล่อย
    
    const { active, over } = event;
    if (over && active.id) {
      const matchId = active.id;
      const courtNumber = over.id;

      const matchToMove = queue.find(m => m._id === matchId);
      if (!matchToMove) return;

      setQueue(currentQueue => currentQueue.filter(m => m._id !== matchId));
      
      const updatedMatch = {
        ...matchToMove,
        court: String(courtNumber),
        status: "in-progress",
        startedAt: new Date().toISOString(),
      };
      setInProgress(currentInProgress => [...currentInProgress, updatedMatch]);

      try {
        await API.updateSchedule(matchId, {
          court: String(courtNumber),
          status: "in-progress",
          startedAt: updatedMatch.startedAt,
        });
      } catch (e) {
        alert("Error: บันทึกการย้ายแมทช์ไม่สำเร็จ! " + e.message);
        setQueue(currentQueue => [matchToMove, ...currentQueue].sort((a,b) => (a.matchNo || 0) - (b.matchNo || 0)));
        setInProgress(currentInProgress => currentInProgress.filter(m => m._id !== matchId));
      }
    }
  }

  const courts = Array.from({ length: NUM_COURTS }, (_, i) => i + 1);
  
  // --- 6. หาแมทช์ที่กำลังลาก (เพื่อส่งให้ Overlay) ---
  const activeMatch = activeId ? queue.find(m => m._id === activeId) : null;

  return (
    // --- 7. เพิ่ม onDragStart และ onDragEnd ---
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-indigo-700">Court Running (Control Room)</h1>
          <button
            className="px-4 py-2 border rounded-md bg-white shadow-sm disabled:opacity-50"
            onClick={loadAll}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
        {err && <div className="text-red-600 bg-red-100 p-3 rounded-md mb-4">{err}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" style={{ height: 'calc(100vh - 180px)' }}>
          <div className="lg:col-span-1 h-full">
            <MatchQueue matches={queue} />
          </div>
          
          <div className="lg:col-span-3 h-full overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {courts.map(num => {
                const match = inProgress.find(m => m.court == num);
                return (
                  <CourtBucket
                    key={num}
                    courtNumber={num}
                    match={match}
                    onFinish={loadAll} 
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* --- 8. เพิ่ม DragOverlay ที่นี่ (อยู่นอก Layout) --- */}
      <DragOverlay>
        {activeMatch ? <MatchItemCard match={activeMatch} /> : null}
      </DragOverlay>
    </DndContext>
  );
}