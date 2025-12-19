// src/pages/admin/Teams.jsx
import React from "react";
import { API } from "@/lib/api.js";
import { useTournament } from "@/contexts/TournamentContext"; 

// ... (Helper Components: Button, FormLabel, Input, Select) - เหมือนเดิม
function Button({ children, onClick, disabled, variant = "primary", type = "button" }) {
  const base = "px-4 py-2 rounded-lg font-semibold text-sm shadow-sm transition-colors disabled:opacity-50";
  const styles = { 
    primary: "bg-indigo-600 text-white hover:bg-indigo-700", 
    outline: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
    danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50"
  };
  return <button type={type} className={`${base} ${styles[variant]}`} onClick={onClick} disabled={disabled}>{children}</button>;
}
function FormLabel({ children }) { return <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>; }
function Input({ ...props }) { return <input className="block w-full border border-gray-300 rounded-md shadow-sm text-base px-3 py-2 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" {...props} />; }
function Select({ children, ...props }) { return <select className="block w-full border border-gray-300 rounded-md shadow-sm text-base px-3 py-2 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" {...props}>{children}</select>; }

export default function TeamsPage() {
  const { selectedTournament } = useTournament(); 
  
  // Dynamic Categories
  const HAND_LEVEL_OPTIONS = selectedTournament?.settings?.categories?.length > 0 
      ? selectedTournament.settings.categories 
      : ["Baby", "BG-", "BG(Mix)", "BG(Men)", "N", "S", "Single NB", "Single N"];

  const [players, setPlayers] = React.useState([]);
  const [teams, setTeams] = React.useState([]);
  
  // Filter & Search
  const [q, setQ] = React.useState(""); // ค้นหาทีม (ตารางด้านล่าง)
  const [hand, setHand] = React.useState("ALL"); // Filter ทีม (ตารางด้านล่าง)
  
  // [NEW] Search สำหรับเลือกผู้เล่นในฟอร์ม
  const [playerSearch, setPlayerSearch] = React.useState("");

  const [err, setErr] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);

  const [form, setForm] = React.useState({
    teamName: "", 
    competitionType: "Doubles", 
    handLevel: "", 
    players: [], 
    managerName: "", 
    phone: "", 
    lineId: "",
  });

  // โหลดข้อมูล
  React.useEffect(() => {
    (async () => {
      try {
        setErr("");
        const [ps, ts] = await Promise.all([API.listPlayers(), API.listTeams()]);
        setPlayers(ps); 
        setTeams(ts);
      } catch (e) { 
        setErr(e && e.message ? e.message : "โหลดข้อมูลไม่สำเร็จ"); 
      }
    })();
  }, [selectedTournament?._id]);

  // Map Player ID -> Player Object (ใช้บ่อยมาก)
  const playerMap = React.useMemo(() => {
    const m = {}; (players || []).forEach((p) => { m[p._id] = p; }); return m;
  }, [players]);

  // [NEW] กรองรายชื่อผู้เล่นในฟอร์มตามคำค้นหา
  const filteredPlayersForSelection = React.useMemo(() => {
    if (!playerSearch) return players;
    const kw = playerSearch.toLowerCase();
    return players.filter(p => 
      (p.fullName || "").toLowerCase().includes(kw) || 
      (p.nickname || "").toLowerCase().includes(kw) ||
      (p.playerCode || "").toLowerCase().includes(kw)
    );
  }, [players, playerSearch]);

  // [NEW] รายชื่อผู้เล่นที่ถูกเลือก (Object) เพื่อนำมาแสดงผล
  const selectedPlayerObjects = React.useMemo(() => {
    return form.players.map(id => playerMap[id]).filter(Boolean);
  }, [form.players, playerMap]);

  // Filter ทีม (ตารางด้านล่าง)
  const filteredTeams = React.useMemo(() => {
    let list = teams || [];
    if (hand !== "ALL") list = list.filter((t) => String(t.handLevel).toUpperCase() === hand.toUpperCase());
    
    if (q) {
      const kw = q.toLowerCase();
      list = list.filter((t) => {
        const playerNames = (t.players || []).map(p => {
            if (typeof p === 'object' && p.fullName) return p.fullName;
            return playerMap[p]?.fullName || "";
        }).join(" ");
        return `${t.teamCode || ""} ${t.teamName || ""} ${playerNames}`.toLowerCase().includes(kw);
      });
    }
    return list;
  }, [teams, hand, q, playerMap]);

  function togglePlayer(id) {
    setForm((f) => {
      const newPlayers = [...f.players];
      const idx = newPlayers.indexOf(id);
      if (idx > -1) {
        newPlayers.splice(idx, 1);
      } else {
        const max = f.competitionType === "Doubles" ? 2 : 1;
        if (newPlayers.length < max) {
            newPlayers.push(id);
        } else {
            // ถ้าเต็มแล้ว ให้เอาคนแรกออก แล้วใส่คนใหม่เข้าไปแทน (FIFO)
            newPlayers.shift(); 
            newPlayers.push(id);
        }
      }
      return { ...f, players: newPlayers };
    });
  }

  // --- Functions: Edit & Delete ---
  const handleEdit = (team) => {
    setErr("");
    setEditingId(team._id);
    const playerIds = (team.players || []).map(p => (typeof p === 'object' ? p._id : p));
    setForm({
      teamName: team.teamName || "",
      competitionType: team.competitionType || "Doubles",
      handLevel: team.handLevel || "",
      players: playerIds,
      managerName: team.managerName || "",
      phone: team.phone || "",
      lineId: team.lineId || ""
    });
    setPlayerSearch(""); // Reset search
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ teamName: "", competitionType: "Doubles", handLevel: "", players: [], managerName: "", phone: "", lineId: "" });
    setErr("");
    setPlayerSearch("");
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`ต้องการลบทีม "${name}" ใช่หรือไม่?`)) return;
    try {
      await API.deleteTeam(id);
      setTeams((prev) => prev.filter((t) => t._id !== id));
    } catch (e) {
      alert("ลบไม่สำเร็จ: " + (e.message || "เกิดข้อผิดพลาด"));
    }
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.teamName || !form.teamName.trim()) { setErr("กรอกชื่อทีม"); return; }
    if (!form.competitionType) { setErr("เลือกประเภทการแข่งขัน"); return; }
    if (!form.handLevel) { setErr("เลือกประเภทมือ"); return; }
    if (form.competitionType === "Singles" && form.players.length !== 1) { setErr("Singles ต้องเลือกผู้เล่น 1 คน"); return; }
    if (form.competitionType === "Doubles" && (form.players.length < 1 || form.players.length > 2)) { setErr("Doubles เลือก 1–2 คน"); return; }

    const payload = { 
        ...form, 
        teamName: form.teamName.trim(),
        tournamentId: selectedTournament._id 
    };
    
    setSubmitting(true);
    try {
      if (editingId) {
        const updated = await API.updateTeam(editingId, payload);
        setTeams((prev) => prev.map(t => t._id === editingId ? updated : t));
        handleCancelEdit();
      } else {
        const created = await API.createTeam(payload);
        setTeams((prev) => [created, ...(prev || [])]);
        handleCancelEdit();
      }
    } catch (e) { 
        setErr(e && e.message ? e.message : "บันทึกไม่สำเร็จ"); 
    } finally { 
        setSubmitting(false); 
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 pb-20">
      <h2 className="text-2xl font-bold text-slate-800">จัดการทีม (Teams)</h2>
      
      {/* Form Section */}
      <form onSubmit={onSubmit} className={`bg-white rounded-xl shadow-sm border p-5 transition-colors ${editingId ? "border-indigo-500 ring-1 ring-indigo-200" : "border-slate-200"}`}>
        <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className={`text-sm font-bold uppercase tracking-wider ${editingId ? "text-indigo-600" : "text-slate-400"}`}>
                {editingId ? "✏️ แก้ไขทีม" : "สร้างทีมใหม่"}
            </h3>
            {editingId && (
                 <button type="button" onClick={handleCancelEdit} className="text-xs text-red-500 hover:underline">
                    ยกเลิกการแก้ไข
                 </button>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <FormLabel>ชื่อทีม <span className="text-red-500">*</span></FormLabel>
            <Input 
                value={form.teamName} 
                onChange={(e) => setForm({ ...form, teamName: e.target.value })} 
                required 
                placeholder="เช่น แก๊งลูกหมู"
            />
          </div>
          <div>
            <FormLabel>ประเภทการแข่งขัน</FormLabel>
            <Select 
                value={form.competitionType} 
                onChange={(e) => setForm({ ...form, competitionType: e.target.value, players: [] })}
            >
              <option value="Doubles">คู่ (Doubles)</option>
              <option value="Singles">เดี่ยว (Singles)</option>
            </Select>
          </div>
          <div>
            <FormLabel>ระดับมือ</FormLabel>
            <Select 
                value={form.handLevel} 
                onChange={(e) => setForm({ ...form, handLevel: e.target.value })}
            >
              <option value="">-- เลือก --</option>
              {HAND_LEVEL_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
            </Select>
          </div>
        </div>

        {/* --- ส่วนเลือกผู้เล่นที่ปรับปรุงใหม่ --- */}
        <div className="mt-6 border-t pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
             {/* Left: Label */}
             <FormLabel>
                เลือกผู้เล่น {form.competitionType === "Doubles" ? "(เลือก 2 คน)" : "(เลือก 1 คน)"}
                <span className="text-xs font-normal text-slate-400 ml-2 hidden sm:inline">
                   *หากยังไม่มีชื่อ ให้ไปเพิ่มที่หน้า Players ก่อน
                </span>
             </FormLabel>
             
             {/* Right: Selected Players Display (Area วงสีแดง) */}
             {selectedPlayerObjects.length > 0 && (
                 <div className="flex flex-wrap gap-2 justify-end">
                    {selectedPlayerObjects.map(p => (
                        <div key={p._id} className="flex items-center gap-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium border border-indigo-200 animate-fadeIn">
                            <span>{p.fullName}</span>
                            <button 
                                type="button"
                                onClick={() => togglePlayer(p._id)}
                                className="w-5 h-5 flex items-center justify-center bg-indigo-200 hover:bg-indigo-300 rounded-full text-indigo-800 transition-colors"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                 </div>
             )}
          </div>

          {/* Search Box สำหรับกรองผู้เล่น */}
          <div className="relative mb-2">
            <input 
                type="text"
                placeholder="🔍 พิมพ์ค้นหาชื่อ หรือชื่อเล่น..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
            />
          </div>

          {/* Grid ผู้เล่น */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-3 border border-slate-200 rounded-lg bg-slate-50">
            {filteredPlayersForSelection.map((p) => {
              const checked = form.players.includes(p._id);
              return (
                <label key={p._id} className={`flex items-center gap-3 rounded-md border p-2 text-sm cursor-pointer select-none transition-all ${checked ? "bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300 shadow-sm" : "bg-white hover:bg-white border-slate-200"}`}>
                  <input 
                    type="checkbox" 
                    checked={checked} 
                    onChange={() => togglePlayer(p._id)} 
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5" 
                  />
                  <div className="flex flex-col truncate">
                     <span className={`font-medium truncate ${checked ? "text-indigo-900" : "text-slate-700"}`}>
                        {p.fullName}
                     </span>
                     <span className="text-[10px] text-slate-400">
                        {p.nickname ? `(${p.nickname})` : ""} {p.playerCode}
                     </span>
                  </div>
                </label>
              );
            })}
            
            {filteredPlayersForSelection.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-400 text-sm">
                   {playerSearch ? `ไม่พบรายชื่อที่ตรงกับ "${playerSearch}"` : "📭 ไม่พบรายชื่อนักกีฬา"}
                </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4 border-t pt-4">
          <Button variant="primary" type="submit" disabled={submitting}>
             {submitting ? "กำลังบันทึก…" : (editingId ? "บันทึกการแก้ไข" : "+ สร้างทีม")}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={handleCancelEdit} disabled={submitting}>ยกเลิก</Button>
          )}
          {err && <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">{err}</span>}
        </div>
      </form>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mt-2">
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-sm font-bold text-slate-700 mr-1">Filter:</span>
          <button 
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${hand === "ALL" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`} 
            onClick={() => setHand("ALL")}
          >
            ALL
          </button>
          {HAND_LEVEL_OPTIONS.map((h) => (
            <button 
                key={h} 
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${hand === h ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`} 
                onClick={() => setHand(h)}
            >
                {h}
            </button>
          ))}
        </div>
        <Input 
            className="max-w-xs bg-white" 
            placeholder="🔍 ค้นหาทีม..." 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
                <th className="p-3 text-left w-32 font-semibold">Team ID</th>
                <th className="p-3 text-left font-semibold">ชื่อทีม</th>
                <th className="p-3 text-center font-semibold w-24">ประเภท</th>
                <th className="p-3 text-center font-semibold w-24">ระดับมือ</th>
                <th className="p-3 text-left font-semibold">ผู้เล่นในทีม</th>
                <th className="p-3 text-right font-semibold">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(filteredTeams || []).map((t) => (
              <tr key={t._id} className={`transition-colors ${editingId === t._id ? "bg-indigo-50" : "hover:bg-slate-50"}`}>
                <td className="p-3">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono border border-gray-200">
                        {t.teamCode || "-"}
                    </span>
                </td>
                <td className="p-3 font-medium text-slate-800">{t.teamName || "-"}</td>
                <td className="p-3 text-center text-slate-500 text-xs">
                    {t.competitionType === 'Singles' ? 'เดี่ยว' : 'คู่'}
                </td>
                <td className="p-3 text-center">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
                        {String(t.handLevel)}
                    </span>
                </td>
                <td className="p-3 text-slate-600">
                    {(t.players || []).map((p) => {
                        if (typeof p === 'object' && p.fullName) return p.fullName;
                        if (playerMap[p]) return playerMap[p].fullName;
                        return "Unknown";
                    }).join(" / ")}
                </td>
                <td className="p-3 text-right space-x-2">
                    <button 
                        onClick={() => handleEdit(t)} 
                        className="text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
                    >
                        แก้ไข
                    </button>
                    <button 
                        onClick={() => handleDelete(t._id, t.teamName)} 
                        className="text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-100 transition-colors"
                    >
                        ลบ
                    </button>
                </td>
              </tr>
            ))}
            {filteredTeams.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">ไม่พบข้อมูลทีม</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}