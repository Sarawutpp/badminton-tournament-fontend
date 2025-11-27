// src/pages/admin/Generator.jsx
// (เวอร์ชันแก้ไข: เพิ่ม Confirm Dialog)

import React from "react";
import { API, API_BASE } from "@/lib/api"; 

// สร้างตัวอักษรกลุ่ม A..Z ตามจำนวน
const letters = (n) => Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));

// --- Helper Components (เหมือนเดิม) ---
function Button({ children, onClick, disabled, variant = "primary" }) {
  const base = "px-4 py-2 rounded-lg font-semibold text-sm shadow-sm transition-colors disabled:opacity-50";
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    outline: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
    ghost: "bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200",
  };
  return (
    <button className={`${base} ${styles[variant]}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
function FormLabel({ children }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>;
}
function Input({ ...props }) {
  return <input className="block w-full border border-gray-300 rounded-md shadow-sm text-base px-3 py-2 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" {...props} />;
}
function Select({ children, ...props }) {
  return <select className="block w-full border border-gray-300 rounded-md shadow-sm text-base px-3 py-2 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" {...props}>{children}</select>;
}
// ---------------------------------

export default function GeneratorPage() {
  const [hand, setHand] = React.useState("N");
  const [groupCount, setGroupCount] = React.useState(4);
  const [loading, setLoading] = React.useState(false);
  const [unassigned, setUnassigned] = React.useState([]);
  const [groups, setGroups] = React.useState({});

  // (โค้ด Logic ... ไม่เปลี่ยนแปลง)
  React.useEffect(() => {
    const Ls = letters(Number(groupCount) || 0);
    setGroups((prev) => {
      const next = {};
      Ls.forEach((L) => (next[L] = prev[L] || []));
      return next;
    });
  }, [groupCount]);

  const loadTeams = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await API.listTeamsByHand(hand);
      const Ls = letters(Number(groupCount) || 0);
      const groupsInit = Object.fromEntries(Ls.map((L) => [L, []]));
      const remain = [];
      for (const t of data) {
        if (t.group && groupsInit[t.group]) groupsInit[t.group].push(t);
        else remain.push(t);
      }
      setGroups(groupsInit);
      setUnassigned(remain);
    } catch (e) { console.error(e); alert(e.message || "โหลดรายชื่อทีมไม่สำเร็จ");
    } finally { setLoading(false); }
  }, [hand, groupCount]);
  React.useEffect(() => { loadTeams(); }, [loadTeams]);
  const dragItem = React.useRef(null);
  function onDragStart(team, fromKey) { dragItem.current = { teamId: team._id, from: fromKey }; }
  function onDragOver(e) { e.preventDefault(); }
  function onDrop(toKey) {
    const payload = dragItem.current;
    if (!payload) return;
    if (payload.from === toKey) { dragItem.current = null; return; }
    if (payload.from === "unassigned") {
      const team = unassigned.find((t) => t._id === payload.teamId);
      if (!team) return;
      setUnassigned((a) => a.filter((t) => t._id !== payload.teamId));
      setGroups((g) => ({ ...g, [toKey]: [...g[toKey], team] }));
    } else if (toKey === "unassigned") {
      const team = (groups[payload.from] || []).find((t) => t._id === payload.teamId);
      if (!team) return;
      setGroups((g) => ({ ...g, [payload.from]: g[payload.from].filter((t) => t._id !== payload.teamId) }));
      setUnassigned((a) => [...a, team]);
    } else {
      const team = (groups[payload.from] || []).find((t) => t._id === payload.teamId);
      if (!team) return;
      setGroups((g) => {
        const next = { ...g };
        next[payload.from] = g[payload.from].filter((t) => t._id !== payload.teamId);
        next[toKey] = [...g[toKey], team];
        return next;
      });
    }
    dragItem.current = null;
  }
  
  // ============ [!! START: ส่วนที่แก้ไข !!] ============
  async function confirmAndGenerate() {
    const warning = "การยืนยันนี้จะล้างคะแนนและแมตช์รอบแบ่งกลุ่มเดิมทั้งหมดของมือนี้ (เพื่อสร้างใหม่) คุณแน่ใจหรือไม่?";
    if (!window.confirm(warning)) {
      return;
    }
  
    try {
      setLoading(true);
      const payload = {
        tournamentId: "default", handLevel: hand,
        groups: Object.fromEntries(Object.entries(groups).map(([L, arr]) => [L, arr.map((t) => t._id)])),
      };
      
      const res = await API.manualGroupAndGenerate(payload);
      
      // ✅ แก้ตรงนี้: ดึงตัวแปรใหม่มาแสดง
      const groupCount = res.matches || 0;
      const koCount = res.knockoutMatches || 0;
      
      alert(
        `✅ ดำเนินการเสร็จสิ้น!\n` +
        `- สร้างแมตช์แบ่งกลุ่ม: ${groupCount} คู่\n` +
        `- สร้างโครงร่าง Knockout รอไว้: ${koCount} คู่`
      );

    } catch (e) { 
      console.error(e); 
      alert(e.message || "สร้างกลุ่ม/แมตช์ไม่สำเร็จ");
    } finally { 
      setLoading(false); 
    }
  }
  // ============ [!! END: ส่วนที่แก้ไข !!] ============

  function autoDistribute() {
    const Ls = Object.keys(groups);
    if (!Ls.length) return;
    const all = [...unassigned, ...Ls.flatMap((L) => groups[L])];
    all.sort(() => Math.random() - 0.5);
    const next = Object.fromEntries(Ls.map((L) => [L, []]));
    all.forEach((t, i) => next[Ls[i % Ls.length]].push(t));
    setGroups(next);
    setUnassigned([]);
  }
  // (จบ Logic)

  const groupLetters = Object.keys(groups);
  const totalTeams = unassigned.length + groupLetters.reduce((n, L) => n + groups[L].length, 0);

  return (
    <div className="flex flex-col gap-4"> {/* "gen-wrap" */}
      <div className="text-xs text-slate-400">API: {API_BASE}</div>

      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"> {/* "gen-header" */}
        <div className="flex items-center gap-3"> {/* "gen-title" */}
          <span className="text-2xl text-indigo-500">✨</span>
          <h2 className="text-2xl font-bold">Generator — จัดกลุ่ม</h2>
        </div>
        <div className="flex gap-2 flex-shrink-0"> {/* "gen-actions" */}
          <Button variant="outline" onClick={autoDistribute} disabled={loading || totalTeams === 0}>
            กระจายอัตโนมัติ
          </Button>
          <Button variant="primary" onClick={confirmAndGenerate} disabled={loading}>
            {loading ? "กำลังสร้าง…" : "ยืนยันและสร้างแมตช์"}
          </Button>
        </div>
      </header>

      {/* (Toolbar และส่วนที่เหลือของไฟล์เหมือนเดิม) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end"> 
          <div>
            <FormLabel>ประเภทมือ</FormLabel>
            <Select value={hand} onChange={(e) => setHand(e.target.value)} disabled={loading}>
              {["Baby", "BG-", "BG(Mix)", "BG(Men)", "N", "S", "Single NB", "Single N"].map((lv) => (
                <option key={lv} value={lv}>{lv}</option>
              ))}
            </Select>
          </div>
          <div>
            <FormLabel>จำนวนกลุ่ม</FormLabel>
            <Input
              type="number" min={1} max={12}
              value={groupCount}
              onChange={(e) => setGroupCount(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
              disabled={loading}
            />
          </div>
          <div className="px-3 py-2 rounded-full bg-gray-100 text-sm text-center">
            รวมทีมทั้งหมด <strong>{totalTeams}</strong>
          </div>
          <Button variant="ghost" onClick={loadTeams} disabled={loading}>Refresh</Button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <section className="bg-white rounded-xl shadow-sm border" onDragOver={onDragOver} onDrop={() => onDrop("unassigned")}> 
          <header className="flex items-center justify-between p-4 border-b"> 
            <div className="flex items-baseline gap-2">
              <strong>ยังไม่จัดกลุ่ม</strong>
              <span className="text-gray-500 text-sm">— ว่าง —</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">{unassigned.length} teams</span> 
          </header>
          <div className="p-3 min-h-[120px] bg-gray-50/50"> 
            {unassigned.length === 0 ? (
              <div className="text-center text-gray-400 text-sm p-4">ลากทีมจากกลุ่มอื่นกลับมาที่นี่ได้</div> 
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2"> 
                {unassigned.map((t) => (
                  <Chip key={t._id} team={t} onDragStart={() => onDragStart(t, "unassigned")} />
                ))}
              </div>
            )}
          </div>
        </section>
        {groupLetters.map((L) => (
          <section key={L} className="bg-white rounded-xl shadow-sm border" onDragOver={onDragOver} onDrop={() => onDrop(L)}> 
            <header className="flex items-center justify-between p-4 border-b">
              <strong>Group {L}</strong>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">{groups[L].length} teams</span> 
            </header>
            <div className="p-3 min-h-[120px] bg-gray-50/50"> 
              {groups[L].length === 0 ? (
                <div className="text-center text-gray-400 text-sm p-4">ลากทีมมาวางที่นี่</div> 
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2"> 
                  {groups[L].map((t) => (
                    <Chip key={t._id} team={t} onDragStart={() => onDragStart(t, L)} />
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Chip({ team, ...props }) {
  return (
    <div className="grid gap-0.5 p-2 border bg-white rounded-lg shadow-sm cursor-grab active:cursor-grabbing" draggable title={team.teamName} {...props}>
      <div>
        <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-1.5" /> 
        <span className="font-bold text-sm">{team.teamName}</span> 
      </div>
      {team.players?.length ? (
        <span className="text-gray-500 text-xs truncate"> 
          {team.players.map((p) => p.nickname || p.fullName).join(" / ")}
        </span>
      ) : null}
    </div>
  );
}