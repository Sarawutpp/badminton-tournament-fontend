// src/pages/admin/KnockoutScoringAdminPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useTournament } from "@/contexts/TournamentContext";

// --- Constants & Helpers ---

const ROUND_OPTIONS = [
  { label: "รอบ 16 ทีม (KO16)", value: "KO16" },
  { label: "Quarter-final (QF)", value: "QF" },
  { label: "Semi-final (SF)", value: "SF" },
  { label: "Final (F)", value: "F" },
];

const BRACKET_SIDE_FILTERS = [
  { label: "ทั้งหมด", value: "ALL" },
  { label: "สายบน", value: "TOP" },
  { label: "สายล่าง", value: "BOTTOM" },
];

function formatTimeFromISO(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

function normalizeBracketSide(value) {
  if (!value) return null;
  const v = String(value).toUpperCase();
  if (["TOP", "สายบน", "บน"].includes(v)) return "TOP";
  if (["BOTTOM", "สายล่าง", "ล่าง"].includes(v)) return "BOTTOM";
  return value;
}

function normalizeMatch(raw) {
  if (!raw) return null;
  const team1Raw = raw.team1 || {};
  const team2Raw = raw.team2 || {};
  const sets = Array.isArray(raw.sets) ? raw.sets : [];

  return {
    id: raw._id || raw.id,
    matchId: raw.matchId || raw.code || raw.id,
    matchNo: raw.matchNo ?? 0,
    handLevel: raw.handLevel,
    roundType: raw.roundType,
    round: raw.round,
    court: raw.court || "-",
    scheduledAt: raw.scheduledAt,
    startTime: formatTimeFromISO(raw.scheduledAt),
    status: raw.status || "pending",
    bracketSide: normalizeBracketSide(raw.bracketSide),
    team1: {
      id: team1Raw._id || team1Raw.id || null,
      name: team1Raw.teamName || team1Raw.name || "-",
    },
    team2: {
      id: team2Raw._id || team2Raw.id || null,
      name: team2Raw.teamName || team2Raw.name || "-",
    },
    games: sets.map((s) => ({
      t1: typeof s.t1 === "number" ? s.t1 : 0,
      t2: typeof s.t2 === "number" ? s.t2 : 0,
    })),
  };
}

function getMatchSummary(match) {
  const games = match.games || [];
  let t1Sets = 0,
    t2Sets = 0;
  games.forEach((g) => {
    if (!g) return;
    const a = Number(g.t1 ?? 0);
    const b = Number(g.t2 ?? 0);
    if (a === 0 && b === 0) return;
    if (a > b) t1Sets++;
    else if (b > a) t2Sets++;
  });
  let winnerTeamId = null;
  if (t1Sets > t2Sets) winnerTeamId = match.team1.id;
  else if (t2Sets > t1Sets) winnerTeamId = match.team2.id;
  return { t1Sets, t2Sets, winnerTeamId };
}

function getStatusConfig(match) {
  const { t1Sets, t2Sets, winnerTeamId } = getMatchSummary(match);
  const hasScore = t1Sets > 0 || t2Sets > 0 || winnerTeamId;
  const isFinished = match.status === "finished";
  const isInProgress = match.status === "in-progress";

  // Logic: Enable score ONLY if match is finished
  const canEnterScore = isFinished;

  let badge = null;
  let actionText = "รอแข่ง";
  let actionClass = "bg-slate-100 text-slate-400 cursor-not-allowed";
  let rowClass = "bg-white text-slate-500";

  if (isInProgress) {
    rowClass = "bg-amber-50";
    badge = (
      <span className="flex items-center gap-1 w-fit bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
        LIVE
      </span>
    );
    actionText = `แข่งอยู่ (C${match.court})`;
    actionClass = "bg-amber-100 text-amber-600 cursor-not-allowed font-medium";
  } else if (isFinished) {
    if (hasScore) {
      rowClass = "bg-emerald-50";
      badge = (
        <span className="w-fit bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
          จบแล้ว
        </span>
      );
      actionText = "แก้ไขผล";
      actionClass =
        "bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50";
    } else {
      rowClass = "bg-white"; // Highlight row slightly
      badge = (
        <span className="w-fit bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">
          รอผล
        </span>
      );
      actionText = "บันทึกผล";
      actionClass =
        "bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 font-bold";
    }
  }

  return {
    badge,
    actionText,
    actionClass,
    rowClass,
    canEnterScore,
    winnerTeamId,
    hasScore,
    t1Sets,
    t2Sets,
  };
}

// --- Components ---

// [NEW] Shuttle Selector Modal
function ShuttleSelectorModal({ isOpen, onClose, onConfirm, loading }) {
  if (!isOpen) return null;

  const options = [1, 2, 3, 4, 5];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-center">
          <h3 className="text-white text-lg font-bold">
            🏸 จำนวนลูกแบดที่ใช้?
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            ระบุจำนวนลูกเพื่อคำนวณคูปอง
          </p>
        </div>

        {/* Body */}
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
            <button
              onClick={() => onConfirm(0)}
              disabled={loading}
              className="aspect-square rounded-2xl bg-slate-50 border-2 border-slate-100 text-sm font-semibold text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-all flex flex-col items-center justify-center"
            >
              <span>ไม่ใช้</span>
              <span className="text-[10px]">(0)</span>
            </button>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="w-full py-3 rounded-xl border border-slate-200 text-slate-500 font-semibold hover:bg-slate-50 transition-colors"
          >
            ยกเลิก (กลับไปแก้ไขคะแนน)
          </button>
        </div>

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

// 1. Mobile Card View
function MatchCardMobile({ match, onClick }) {
  const {
    badge,
    actionText,
    actionClass,
    rowClass,
    canEnterScore,
    winnerTeamId,
    hasScore,
    t1Sets,
    t2Sets,
  } = getStatusConfig(match);

  return (
    <div
      className={`relative w-full rounded-2xl border border-slate-200 px-4 py-3 mb-3 flex flex-col gap-3 transition-all ${rowClass}`}
    >
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">{match.matchId}</span>
          {badge}
        </div>
        <span className="font-mono text-slate-400">{match.startTime}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span
              className={`font-bold text-sm ${
                match.team1.id === winnerTeamId
                  ? "text-emerald-700"
                  : "text-slate-700"
              }`}
            >
              {match.team1.name}
            </span>
            {hasScore && (
              <span className="text-xs font-mono bg-slate-100 px-1 rounded">
                {match.games.map((g) => g.t1).join("-")}
              </span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span
              className={`font-bold text-sm ${
                match.team2.id === winnerTeamId
                  ? "text-emerald-700"
                  : "text-slate-700"
              }`}
            >
              {match.team2.name}
            </span>
            {hasScore && (
              <span className="text-xs font-mono bg-slate-100 px-1 rounded">
                {match.games.map((g) => g.t2).join("-")}
              </span>
            )}
          </div>
        </div>
        {hasScore && (
          <div className="flex flex-col items-center justify-center pl-2 border-l border-slate-200 min-w-[50px]">
            <span className="text-[10px] text-slate-400 uppercase">Sets</span>
            <span className="text-lg font-black text-slate-800">
              {t1Sets}-{t2Sets}
            </span>
          </div>
        )}
      </div>

      <button
        disabled={!canEnterScore}
        onClick={onClick}
        className={`w-full py-2 rounded-xl text-xs flex items-center justify-center gap-2 ${actionClass}`}
      >
        {canEnterScore ? "✎ " : "🔒 "} {actionText}
      </button>
    </div>
  );
}

// 2. Desktop Table View
function MatchTableDesktop({ matches, onAction }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
      <table className="w-full text-sm text-left table-fixed">
        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 w-32">Match</th>
            <th className="px-4 py-3 w-20 text-center">เวลา</th>
            <th className="px-4 py-3 w-28 text-center">สถานะ</th>
            <th className="px-4 py-3 text-right w-[25%]">ทีม 1</th>
            <th className="px-2 py-3 w-44 text-center">ผลการแข่ง</th>
            <th className="px-4 py-3 text-left w-[25%]">ทีม 2</th>
            <th className="px-4 py-3 w-28 text-center">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {matches.map((match) => {
            const {
              badge,
              actionText,
              actionClass,
              canEnterScore,
              winnerTeamId,
              hasScore,
              t1Sets,
              t2Sets,
            } = getStatusConfig(match);

            return (
              <tr
                key={match.id}
                className={`hover:bg-slate-50 transition-colors ${
                  match.status === "in-progress" ? "bg-amber-50/60" : ""
                }`}
              >
                <td className="px-4 py-3 align-middle">
                  <div className="font-bold text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">
                    {match.matchId}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs text-center align-middle">
                  {match.startTime || "-"}
                </td>
                <td className="px-4 py-3 text-center align-middle">
                  <div className="flex justify-center">
                    {badge || <span className="text-slate-300">-</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right align-middle">
                  <div
                    className={`font-semibold text-sm truncate ${
                      match.team1.id === winnerTeamId
                        ? "text-emerald-700"
                        : "text-slate-700"
                    }`}
                  >
                    {match.team1.name}
                    {match.team1.id === winnerTeamId && " 🏆"}
                  </div>
                </td>
                <td className="px-2 py-3 text-center align-middle">
                  {hasScore ? (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center gap-3 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                        <span
                          className={`text-lg font-black ${
                            t1Sets > t2Sets
                              ? "text-emerald-600"
                              : "text-slate-700"
                          }`}
                        >
                          {t1Sets}
                        </span>
                        <span className="text-slate-400 text-xs font-bold">
                          VS
                        </span>
                        <span
                          className={`text-lg font-black ${
                            t2Sets > t1Sets
                              ? "text-emerald-600"
                              : "text-slate-700"
                          }`}
                        >
                          {t2Sets}
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                        {match.games.map((g, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap"
                          >
                            {g.t1}-{g.t2}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-300 font-bold text-xs">
                      VS
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-left align-middle">
                  <div
                    className={`font-semibold text-sm truncate ${
                      match.team2.id === winnerTeamId
                        ? "text-emerald-700"
                        : "text-slate-700"
                    }`}
                  >
                    {match.team2.id === winnerTeamId && "🏆 "}
                    {match.team2.name}
                  </div>
                </td>
                <td className="px-4 py-3 text-center align-middle">
                  <button
                    disabled={!canEnterScore}
                    onClick={() => onAction(match)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all w-full shadow-sm active:scale-95 ${actionClass}`}
                  >
                    {actionText}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// 3. Score Sheet Modal
function ScoreSheet({ open, match, onClose, onSave }) {
  const [localGames, setLocalGames] = useState([
    { t1: "", t2: "" },
    { t1: "", t2: "" },
    { t1: "", t2: "" },
  ]);

  useEffect(() => {
    if (open && match) {
      const games = match.games || [];
      const merged = [0, 1, 2].map((i) => {
        const g = games[i];
        if (!g) return { t1: "", t2: "" };
        return {
          t1: g.t1 === 0 && g.t2 === 0 ? "" : Number(g.t1),
          t2: g.t1 === 0 && g.t2 === 0 ? "" : Number(g.t2),
        };
      });
      setLocalGames(merged);
    }
  }, [open, match]);

  if (!open || !match) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const sets = localGames.map((g) => ({
      t1: g.t1 === "" ? 0 : Number(g.t1),
      t2: g.t2 === "" ? 0 : Number(g.t2),
    }));
    onSave(match.id, sets);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="bg-slate-900 px-5 py-4 flex justify-between items-center text-white">
          <h2 className="font-bold">🏸 บันทึกผล: {match.matchId}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="font-bold text-slate-800 w-1/3 text-center break-words">
              {match.team1.name}
            </div>
            <div className="text-slate-300 font-bold">VS</div>
            <div className="font-bold text-slate-800 w-1/3 text-center break-words">
              {match.team2.name}
            </div>
          </div>
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="w-12 text-xs font-bold text-slate-400 text-right">
                  SET {idx + 1}
                </span>
                <div className="flex flex-1 gap-2 justify-center items-center">
                  <input
                    type="number"
                    className="w-16 h-10 text-center border rounded-lg font-bold"
                    value={localGames[idx].t1}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLocalGames((p) =>
                        p.map((pg, pi) =>
                          pi === idx ? { ...pg, t1: val } : pg
                        )
                      );
                    }}
                    autoFocus={idx === 0}
                  />
                  <span>:</span>
                  <input
                    type="number"
                    className="w-16 h-10 text-center border rounded-lg font-bold"
                    value={localGames[idx].t2}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLocalGames((p) =>
                        p.map((pg, pi) =>
                          pi === idx ? { ...pg, t2: val } : pg
                        )
                      );
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function KnockoutScoringAdminPage() {
  const { selectedTournament } = useTournament();

  // ✅ ดึงจาก Settings เท่านั้น (ลบ Hardcode)
  const handOptions = useMemo(() => {
    const cats = selectedTournament?.settings?.categories || [];
    if (cats.length === 0) {
      // Fallback or warning (Optional)
    }
    return cats.map((c) => ({ label: c, value: c, labelShort: c }));
  }, [selectedTournament]);

  const [handLevel, setHandLevel] = useState(handOptions[0]?.value || "");
  const [roundCode, setRoundCode] = useState("QF");
  const [bracketSideFilter, setBracketSideFilter] = useState("ALL");
  const [searchText, setSearchText] = useState("");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);

  // [NEW] State for Shuttle Modal
  const [showShuttleModal, setShowShuttleModal] = useState(false);
  const [pendingScoreData, setPendingScoreData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Auto-select first option if current selection is invalid
    if (handOptions.length > 0) {
      const currentExists = handOptions.find((h) => h.value === handLevel);
      if (!currentExists) {
        setHandLevel(handOptions[0].value);
      }
    } else {
      setHandLevel("");
    }
  }, [handOptions, handLevel]);

  const loadMatches = async () => {
    if (!handLevel) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        roundType: "knockout",
        handLevel,
        round: roundCode,
        sort: "matchNo:asc",
        page: "1",
        pageSize: "300",
      });
      const res = await fetch(`/api/matches?${params.toString()}`);
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : data;
      const normalized = (items || []).map(normalizeMatch).filter(Boolean);
      setMatches(normalized);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [handLevel, roundCode]);

  const filteredMatches = useMemo(() => {
    let list = [...matches];

    // 1. Filter Side
    if (bracketSideFilter !== "ALL") {
      list = list.filter(
        (m) => m.bracketSide === bracketSideFilter || !m.bracketSide
      );
    }

    // 2. Search
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      list = list.filter(
        (m) =>
          (m.team1?.name || "").toLowerCase().includes(q) ||
          (m.team2?.name || "").toLowerCase().includes(q) ||
          (m.matchId || "").toLowerCase().includes(q)
      );
    }

    // 3. Deduplication Logic (แก้ปัญหาแมทช์ซ้อน)
    // Group by matchNo -> Pick the "best" one (Priority: Status > Team Names)
    const uniqueMap = new Map();
    list.forEach((m) => {
      const existing = uniqueMap.get(m.matchNo);
      if (!existing) {
        uniqueMap.set(m.matchNo, m);
      } else {
        const existingScore =
          (existing.status !== "pending" ? 2 : 0) +
          (existing.team1.name !== "-" ? 1 : 0);
        const currentScore =
          (m.status !== "pending" ? 2 : 0) + (m.team1.name !== "-" ? 1 : 0);

        if (currentScore > existingScore) {
          uniqueMap.set(m.matchNo, m);
        }
      }
    });

    const dedupedList = Array.from(uniqueMap.values());
    return dedupedList.sort((a, b) => (a.matchNo || 0) - (b.matchNo || 0));
  }, [matches, bracketSideFilter, searchText]);

  const handleOpenSheet = (match) => {
    if (match.status !== "finished") return;
    setEditingMatch(match);
    setSheetOpen(true);
  };

  // [NEW] Intermediate Step: ScoreSheet -> Shuttle Modal
  const handleScoreSubmit = (matchId, sets) => {
    setPendingScoreData({ matchId, sets });
    setSheetOpen(false); // ปิด ScoreSheet
    setShowShuttleModal(true); // เปิด Modal ถามลูก
  };

  // [NEW] Final Step: Save to API
  const handleFinalSave = async (shuttleCount) => {
    if (!pendingScoreData) return;
    const { matchId, sets } = pendingScoreData;

    setSaving(true);
    // Optimistic Update
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId ? { ...m, games: sets, status: "finished" } : m
      )
    );

    try {
      await fetch(`/api/matches/${matchId}/score`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sets,
          gamesToWin: 2,
          status: "finished",
          shuttlecockUsed: shuttleCount, // ส่งค่าลูกไปด้วย
        }),
      });
    } catch (err) {
      console.error(err);
      loadMatches(); // Revert on error
    } finally {
      setSaving(false);
      setShowShuttleModal(false);
      setPendingScoreData(null);
      setEditingMatch(null);
    }
  };

  const handleCancelShuttle = () => {
    setShowShuttleModal(false);
    setSheetOpen(true); // Re-open Score Sheet
  };

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-800">
            🏆 Knockout Scoring
          </h1>
          <button
            onClick={loadMatches}
            className="text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg"
          >
            Refresh
          </button>
        </div>

        {/* Hand Selection */}
        <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100">
          {handOptions.map((h) => (
            <button
              key={h.value}
              onClick={() => setHandLevel(h.value)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                h.value === handLevel
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {h.labelShort}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <select
            value={roundCode}
            onChange={(e) => setRoundCode(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border text-sm font-bold text-slate-700"
          >
            {ROUND_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <select
            value={bracketSideFilter}
            onChange={(e) => setBracketSideFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border text-sm font-bold text-slate-700"
          >
            {BRACKET_SIDE_FILTERS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="ค้นหาทีม..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border text-sm"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[300px]">
        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading...</div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-20 text-slate-400 bg-slate-50 rounded-xl border border-dashed">
            ไม่พบรายการแข่งขัน
          </div>
        ) : (
          <>
            {/* 1. Mobile View (Cards) */}
            <div className="md:hidden grid grid-cols-1 gap-3">
              {filteredMatches.map((m) => (
                <MatchCardMobile
                  key={m.id}
                  match={m}
                  onClick={() => handleOpenSheet(m)}
                />
              ))}
            </div>

            {/* 2. Desktop View (Table) */}
            <div className="hidden md:block">
              <MatchTableDesktop
                matches={filteredMatches}
                onAction={handleOpenSheet}
              />
            </div>
          </>
        )}
      </div>

      <ScoreSheet
        open={sheetOpen}
        match={editingMatch}
        onClose={() => setSheetOpen(false)}
        onSave={handleScoreSubmit}
      />

      {/* Modal ถามลูกแบด */}
      <ShuttleSelectorModal
        isOpen={showShuttleModal}
        onClose={handleCancelShuttle}
        onConfirm={handleFinalSave}
        loading={saving}
      />
    </div>
  );
}
