// src/pages/admin/Generator.jsx
import React from "react";
import { API, API_BASE } from "@/lib/api"; 
import { useTournament } from "@/contexts/TournamentContext"; 

// Helper: สร้างตัวอักษรกลุ่ม A..Z ตามจำนวน
const letters = (n) => Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));

// --- Helper Components ---
function Button({ children, onClick, disabled, variant = "primary" }) {
  const base = "px-4 py-2 rounded-lg font-semibold text-sm shadow-sm transition-colors disabled:opacity-50";
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    outline: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
    ghost: "bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200",
  };
  return <button className={`${base} ${styles[variant]}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

function FormLabel({ children }) { return <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>; }
function Input({ ...props }) { return <input className="block w-full border border-gray-300 rounded-md shadow-sm text-base px-3 py-2 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" {...props} />; }
function Select({ children, ...props }) { return <select className="block w-full border border-gray-300 rounded-md shadow-sm text-base px-3 py-2 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" {...props}>{children}</select>; }

// --- Main Component ---
export default function GeneratorPage() {
  const { selectedTournament } = useTournament(); 
  
  // ดึง Categories จาก Tournament Settings หรือใช้ Default
  const CATEGORIES = selectedTournament?.settings?.categories?.length > 0 
      ? selectedTournament.settings.categories 
      : ["Baby", "BG-", "BG(Mix)", "BG(Men)", "N", "S", "Single NB", "Single N"];

  const [hand, setHand] = React.useState(CATEGORIES[0] || "");
  const [groupCount, setGroupCount] = React.useState(4); // Default เริ่มต้น
  const [loading, setLoading] = React.useState(false);
  const [unassigned, setUnassigned] = React.useState([]);
  const [groups, setGroups] = React.useState({});

  // Effect: เมื่อ User เปลี่ยนตัวเลขจำนวนกลุ่ม (groupCount) ให้ขยาย/ลด Slot กลุ่ม
  React.useEffect(() => {
    const Ls = letters(Number(groupCount) || 0);
    setGroups((prev) => {
      const next = {}; 
      // Preserve existing teams in groups, create new slots if needed
      Ls.forEach((L) => (next[L] = prev[L] || [])); 
      return next;
    });
  }, [groupCount]);

  // Function: โหลดทีมและจัดลงกลุ่มตามข้อมูลใน DB
  const loadTeams = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await API.listTeamsByHand(hand);
      
      // 1. ตรวจสอบว่ามีข้อมูลกลุ่มใน DB สูงสุดที่ตัวอักษรอะไร (เช่น B -> Index 1)
      let maxGroupIndex = -1;
      data.forEach(t => {
        if (t.group && t.group.length === 1) {
          const idx = t.group.charCodeAt(0) - 65; 
          if (idx > maxGroupIndex) maxGroupIndex = idx;
        }
      });

      // 2. คำนวณจำนวนกลุ่มที่ควรจะเป็น (Auto-detect)
      // ถ้ามีข้อมูลใน DB ให้ใช้ (maxIndex + 1)
      // ถ้าไม่มีข้อมูลเลย (maxIndex = -1) ให้ใช้ค่าเดิมที่มีอยู่ (default 4 หรือที่ user เลือก)
      const detectedCount = maxGroupIndex > -1 ? maxGroupIndex + 1 : (Number(groupCount) || 4);

      // update UI groupCount ให้ตรงกับความจริง
      if (maxGroupIndex > -1 && detectedCount !== groupCount) {
         setGroupCount(detectedCount);
      }

      // 3. จัดทีมลง Bucket ตามจำนวนกลุ่มที่คำนวณได้ใหม่
      const Ls = letters(detectedCount);
      const groupsInit = Object.fromEntries(Ls.map((L) => [L, []]));
      const remain = [];

      for (const t of data) {
        if (t.group && groupsInit[t.group]) {
          groupsInit[t.group].push(t);
        } else {
          remain.push(t);
        }
      }

      setGroups(groupsInit);
      setUnassigned(remain);

    } catch (e) { 
      console.error(e); 
      alert(e.message || "โหลดรายชื่อทีมไม่สำเร็จ"); 
    } finally { 
      setLoading(false); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hand]); // เอา groupCount ออกจาก dependency เพื่อป้องกัน Loop และให้ยึดตาม Data เป็นหลัก

  React.useEffect(() => { loadTeams(); }, [loadTeams]);

  // --- Drag & Drop Logic ---
  const dragItem = React.useRef(null);
  function onDragStart(team, fromKey) { dragItem.current = { teamId: team._id, from: fromKey }; }
  function onDragOver(e) { e.preventDefault(); }
  
  function onDrop(toKey) {
    const payload = dragItem.current; if (!payload) return;
    if (payload.from === toKey) { dragItem.current = null; return; }

    // Helper ในการหาทีม
    const findAndRemove = (list, id) => {
        const item = list.find(t => t._id === id);
        return { item, list: list.filter(t => t._id !== id) };
    };

    // Case 1: From Unassigned -> Group
    if (payload.from === "unassigned") {
       const { item, list } = findAndRemove(unassigned, payload.teamId);
       if (!item) return;
       setUnassigned(list);
       setGroups(prev => ({ ...prev, [toKey]: [...prev[toKey], item] }));
    } 
    // Case 2: From Group -> Unassigned
    else if (toKey === "unassigned") {
       const { item, list } = findAndRemove(groups[payload.from] || [], payload.teamId);
       if (!item) return;
       setGroups(prev => ({ ...prev, [payload.from]: list }));
       setUnassigned(prev => [...prev, item]);
    } 
    // Case 3: From Group -> Group
    else {
       const { item, list } = findAndRemove(groups[payload.from] || [], payload.teamId);
       if (!item) return;
       setGroups(prev => ({
         ...prev,
         [payload.from]: list,
         [toKey]: [...prev[toKey], item]
       }));
    }
    dragItem.current = null;
  }
  
  // --- Actions ---
  async function confirmAndGenerate() {
    const warning = "การยืนยันนี้จะล้างคะแนนและแมตช์รอบแบ่งกลุ่มเดิมทั้งหมดของมือนี้ (เพื่อสร้างใหม่) คุณแน่ใจหรือไม่?";
    if (!window.confirm(warning)) return;
    
    try {
      setLoading(true);

      // [FILTER FIX] กรองเฉพาะกลุ่มที่มีทีมจริงๆ เท่านั้นก่อนส่งไป
      // ป้องกันการส่งกลุ่มว่าง (เช่น C, D ที่ไม่มีทีม) ไปให้ backend ซึ่งจะทำให้โครงสร้างสายเพี้ยน
      const validGroups = {};
      Object.entries(groups).forEach(([key, teamArr]) => {
          if (teamArr && teamArr.length > 0) {
              validGroups[key] = teamArr.map(t => t._id);
          }
      });

      const payload = {
        tournamentId: selectedTournament?._id || "default",
        handLevel: hand,
        groups: validGroups, // ส่งไปเฉพาะกลุ่มที่มีคน
      };

      const res = await API.manualGroupAndGenerate(payload);
      
      alert(`✅ ดำเนินการเสร็จสิ้น!\n- สร้างแมตช์แบ่งกลุ่ม: ${res.matches || 0} คู่\n- สร้างโครงร่าง Knockout รอไว้: ${res.knockoutMatches || 0} คู่`);
      
      // Reload Data เพื่อความชัวร์
      loadTeams();

    } catch (e) { 
      console.error(e); 
      alert(e.message || "สร้างกลุ่ม/แมตช์ไม่สำเร็จ"); 
    } finally { 
      setLoading(false); 
    }
  }

  function autoDistribute() {
    // Logic: กระจายทีม unassigned ไปยังกลุ่มที่มีอยู่ (groups) แบบสุ่ม
    const Ls = Object.keys(groups); 
    if (!Ls.length) return;
    
    const all = [...unassigned, ...Ls.flatMap((L) => groups[L])]; 
    all.sort(() => Math.random() - 0.5); // Shuffle
    
    const next = Object.fromEntries(Ls.map((L) => [L, []])); 
    all.forEach((t, i) => next[Ls[i % Ls.length]].push(t));
    
    setGroups(next); 
    setUnassigned([]);
  }

  const groupLetters = Object.keys(groups);
  const totalTeams = unassigned.length + groupLetters.reduce((n, L) => n + groups[L].length, 0);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
            <span className="text-2xl text-indigo-500">✨</span>
            <h2 className="text-2xl font-bold">Generator — จัดกลุ่ม</h2>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" onClick={autoDistribute} disabled={loading || totalTeams === 0}>กระจายอัตโนมัติ</Button>
          <Button variant="primary" onClick={confirmAndGenerate} disabled={loading}>{loading ? "กำลังสร้าง…" : "ยืนยันและสร้างแมตช์"}</Button>
        </div>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end"> 
          <div>
            <FormLabel>ประเภทมือ</FormLabel>
            <Select value={hand} onChange={(e) => setHand(e.target.value)} disabled={loading}>
              {CATEGORIES.map((lv) => <option key={lv} value={lv}>{lv}</option>)}
            </Select>
          </div>
          <div>
            <FormLabel>จำนวนกลุ่ม</FormLabel>
            <Input 
                type="number" 
                min={1} 
                max={12} 
                value={groupCount} 
                onChange={(e) => setGroupCount(Math.max(1, Math.min(12, Number(e.target.value) || 1)))} 
                disabled={loading} 
            />
          </div>
          <div className="px-3 py-2 rounded-full bg-gray-100 text-sm text-center">รวมทีมทั้งหมด <strong>{totalTeams}</strong></div>
          <Button variant="ghost" onClick={loadTeams} disabled={loading}>Refresh</Button>
        </div>
      </div>
      
      {/* Drag & Drop Areas */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
         {/* Unassigned Column */}
         <section className="bg-white rounded-xl shadow-sm border" onDragOver={onDragOver} onDrop={() => onDrop("unassigned")}> 
            <header className="flex items-center justify-between p-4 border-b"> 
              <strong>ยังไม่จัดกลุ่ม</strong>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">{unassigned.length} teams</span> 
            </header>
            <div className="p-3 min-h-[120px] bg-gray-50/50"> 
               {unassigned.map((t) => <Chip key={t._id} team={t} onDragStart={() => onDragStart(t, "unassigned")} />)}
            </div>
         </section>

         {/* Group Columns */}
         {groupLetters.map((L) => (
            <section key={L} className="bg-white rounded-xl shadow-sm border" onDragOver={onDragOver} onDrop={() => onDrop(L)}> 
               <header className="flex items-center justify-between p-4 border-b">
                 <strong>Group {L}</strong>
                 <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">{groups[L].length} teams</span> 
               </header>
               <div className="p-3 min-h-[120px] bg-gray-50/50"> 
                 {groups[L].map((t) => <Chip key={t._id} team={t} onDragStart={() => onDragStart(t, L)} />)}
               </div>
            </section>
         ))}
      </div>
    </div>
  );
}

function Chip({ team, ...props }) {
  return (
    <div className="grid gap-0.5 p-2 border bg-white rounded-lg shadow-sm cursor-grab active:cursor-grabbing mb-2" draggable title={team.teamName} {...props}>
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