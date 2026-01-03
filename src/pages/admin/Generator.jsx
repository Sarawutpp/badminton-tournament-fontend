// src/pages/admin/Generator.jsx
import React from "react";
import { API, API_BASE } from "@/lib/api";
import { useTournament } from "@/contexts/TournamentContext";

// Helper: สร้างตัวอักษรกลุ่ม A..Z ตามจำนวน
const letters = (n) =>
  Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));

// --- Helper Components ---
function Button({ children, onClick, disabled, variant = "primary" }) {
  const base =
    "px-4 py-2 rounded-lg font-semibold text-xs md:text-sm shadow-sm transition-colors disabled:opacity-50";
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    outline: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
    ghost: "bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200",
  };
  return (
    <button
      className={`${base} ${styles[variant]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// ปรับ Label ให้ดู Modern ขึ้น
function FormLabel({ children }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
      {children}
    </label>
  );
}

// ปรับ Input เป็น text-sm เพื่อความสมดุล
function Input({ ...props }) {
  return (
    <input
      className="block w-full border border-gray-300 rounded-lg shadow-sm text-sm px-3 py-2 text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:ring-opacity-50 outline-none transition-all"
      {...props}
    />
  );
}

function Select({ children, ...props }) {
  return (
    <select
      className="block w-full border border-gray-300 rounded-lg shadow-sm text-sm px-3 py-2 text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:ring-opacity-50 outline-none transition-all"
      {...props}
    >
      {children}
    </select>
  );
}

// --- Main Component ---
export default function GeneratorPage() {
  const { selectedTournament } = useTournament();

  const CATEGORIES =
    selectedTournament?.settings?.categories?.length > 0
      ? selectedTournament.settings.categories
      : [
          "Baby",
          "BG-",
          "BG(Mix)",
          "BG(Men)",
          "N",
          "S",
          "Single NB",
          "Single N",
        ];

  const [hand, setHand] = React.useState(CATEGORIES[0] || "");
  const [groupCount, setGroupCount] = React.useState(4);
  const [loading, setLoading] = React.useState(false);
  const [unassigned, setUnassigned] = React.useState([]);
  const [groups, setGroups] = React.useState({});

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

      let maxGroupIndex = -1;
      data.forEach((t) => {
        if (t.group && t.group.length === 1) {
          const idx = t.group.charCodeAt(0) - 65;
          if (idx > maxGroupIndex) maxGroupIndex = idx;
        }
      });

      const detectedCount =
        maxGroupIndex > -1 ? maxGroupIndex + 1 : Number(groupCount) || 4;

      if (maxGroupIndex > -1 && detectedCount !== groupCount) {
        setGroupCount(detectedCount);
      }

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
  }, [hand]);

  React.useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  // --- Drag & Drop Logic ---
  const dragItem = React.useRef(null);
  function onDragStart(team, fromKey) {
    dragItem.current = { teamId: team._id, from: fromKey };
  }
  function onDragOver(e) {
    e.preventDefault();
  }

  function onDrop(toKey) {
    const payload = dragItem.current;
    if (!payload) return;
    if (payload.from === toKey) {
      dragItem.current = null;
      return;
    }

    const findAndRemove = (list, id) => {
      const item = list.find((t) => t._id === id);
      return { item, list: list.filter((t) => t._id !== id) };
    };

    if (payload.from === "unassigned") {
      const { item, list } = findAndRemove(unassigned, payload.teamId);
      if (!item) return;
      setUnassigned(list);
      setGroups((prev) => ({ ...prev, [toKey]: [...prev[toKey], item] }));
    } else if (toKey === "unassigned") {
      const { item, list } = findAndRemove(
        groups[payload.from] || [],
        payload.teamId
      );
      if (!item) return;
      setGroups((prev) => ({ ...prev, [payload.from]: list }));
      setUnassigned((prev) => [...prev, item]);
    } else {
      const { item, list } = findAndRemove(
        groups[payload.from] || [],
        payload.teamId
      );
      if (!item) return;
      setGroups((prev) => ({
        ...prev,
        [payload.from]: list,
        [toKey]: [...prev[toKey], item],
      }));
    }
    dragItem.current = null;
  }

  async function confirmAndGenerate() {
    const warning =
      "การยืนยันนี้จะล้างคะแนนและแมตช์รอบแบ่งกลุ่มเดิมทั้งหมดของมือนี้ (เพื่อสร้างใหม่) คุณแน่ใจหรือไม่?";
    if (!window.confirm(warning)) return;

    try {
      setLoading(true);
      const validGroups = {};
      Object.entries(groups).forEach(([key, teamArr]) => {
        if (teamArr && teamArr.length > 0) {
          validGroups[key] = teamArr.map((t) => t._id);
        }
      });

      const payload = {
        tournamentId: selectedTournament?._id || "default",
        handLevel: hand,
        groups: validGroups,
      };

      const res = await API.manualGroupAndGenerate(payload);

      alert(
        `✅ ดำเนินการเสร็จสิ้น!\n- สร้างแมตช์แบ่งกลุ่ม: ${
          res.matches || 0
        } คู่\n- สร้างโครงร่าง Knockout รอไว้: ${res.knockoutMatches || 0} คู่`
      );
      loadTeams();
    } catch (e) {
      console.error(e);
      alert(e.message || "สร้างกลุ่ม/แมตช์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

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

  const groupLetters = Object.keys(groups);
  const totalTeams =
    unassigned.length + groupLetters.reduce((n, L) => n + groups[L].length, 0);

  return (
    <div className="flex flex-col gap-5 pb-20">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-xl shadow-sm border border-indigo-200">
            ✨
          </div>
          {/* ปรับ Font Header เป็น ExtraBold */}
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">
            Generator — จัดกลุ่ม
          </h2>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={autoDistribute}
            disabled={loading || totalTeams === 0}
          >
            กระจายอัตโนมัติ
          </Button>
          <Button
            variant="primary"
            onClick={confirmAndGenerate}
            disabled={loading}
          >
            {loading ? "กำลังสร้าง…" : "ยืนยันและสร้างแมตช์"}
          </Button>
        </div>
      </header>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <FormLabel>ประเภทมือ (Category)</FormLabel>
            <Select
              value={hand}
              onChange={(e) => setHand(e.target.value)}
              disabled={loading}
            >
              {CATEGORIES.map((lv) => (
                <option key={lv} value={lv}>
                  {lv}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FormLabel>จำนวนกลุ่ม (Groups)</FormLabel>
            <Input
              type="number"
              min={1}
              max={12}
              value={groupCount}
              onChange={(e) =>
                setGroupCount(
                  Math.max(1, Math.min(12, Number(e.target.value) || 1))
                )
              }
              disabled={loading}
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600">
            <span className="text-slate-400">Total:</span>
            <strong className="text-slate-800 font-bold text-lg">
              {totalTeams}
            </strong>
            <span className="text-slate-400">Teams</span>
          </div>
          <Button variant="ghost" onClick={loadTeams} disabled={loading}>
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Drag & Drop Areas */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Unassigned Column */}
        <section
          className="bg-slate-50 rounded-xl shadow-inner border border-slate-200/60"
          onDragOver={onDragOver}
          onDrop={() => onDrop("unassigned")}
        >
          <header className="flex items-center justify-between p-3 border-b border-slate-200 bg-white/50 rounded-t-xl">
            <span className="font-bold text-slate-600 text-sm flex items-center gap-2">
              📂 ยังไม่จัดกลุ่ม
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600 border border-slate-300">
              {unassigned.length}
            </span>
          </header>
          <div className="p-3 min-h-[120px]">
            {unassigned.map((t) => (
              <Chip
                key={t._id}
                team={t}
                onDragStart={() => onDragStart(t, "unassigned")}
              />
            ))}
            {unassigned.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-300 text-xs italic py-4">
                ว่างเปล่า
              </div>
            )}
          </div>
        </section>

        {/* Group Columns */}
        {groupLetters.map((L) => (
          <section
            key={L}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
            onDragOver={onDragOver}
            onDrop={() => onDrop(L)}
          >
            <header className="flex items-center justify-between p-3 border-b border-slate-100 bg-indigo-50/30">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold border border-indigo-200">
                  {L}
                </div>
                <span className="font-bold text-slate-700 text-sm">
                  Group {L}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 text-[10px] font-medium shadow-sm">
                {groups[L].length} teams
              </span>
            </header>
            <div className="p-3 min-h-[120px] bg-slate-50/30">
              {groups[L].map((t) => (
                <Chip
                  key={t._id}
                  team={t}
                  onDragStart={() => onDragStart(t, L)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Chip({ team, ...props }) {
  return (
    <div
      className="group flex flex-col gap-0.5 p-2.5 border border-slate-200 bg-white rounded-lg shadow-sm hover:shadow-md hover:border-indigo-300 cursor-grab active:cursor-grabbing mb-2 transition-all relative overflow-hidden"
      draggable
      title={team.teamName}
      {...props}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 group-hover:bg-indigo-500 transition-colors"></div>
      <div className="pl-2">
        {/* ชื่อทีม: font-semibold (De-bolding) */}
        <div className="font-semibold text-sm text-slate-800 leading-tight mb-0.5 group-hover:text-indigo-700 transition-colors">
          {team.teamName}
        </div>
        {/* รายชื่อนักกีฬา: text-xs */}
        {team.players?.length ? (
          <div className="text-slate-500 text-[11px] font-medium truncate">
            {team.players.map((p) => p.nickname || p.fullName).join(" / ")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
