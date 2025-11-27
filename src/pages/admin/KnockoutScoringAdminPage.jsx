// src/pages/admin/KnockoutScoringAdminPage.jsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * มือที่ใช้ในระบบ (ตามที่หมูเด้งให้มา)
 */
const HAND_LEVEL_OPTIONS = [
  { label: "Baby", value: "Baby", labelShort: "Baby" },
  { label: "BG-", value: "BG-", labelShort: "BG-" },
  { label: "BG(Mix)", value: "BG(Mix)", labelShort: "Mix" },
  { label: "BG(Men)", value: "BG(Men)", labelShort: "Men" },
  { label: "N", value: "N", labelShort: "N" },
  { label: "S", value: "S", labelShort: "S" },
  { label: "Single NB", value: "Single NB", labelShort: "NB" },
  { label: "Single N", value: "Single N", labelShort: "SN" },
];

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
  return d.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * ปรับค่า bracketSide จาก backend ให้เป็น TOP/BOTTOM เสมอ
 * backend อาจเก็บ "TOP" / "BOTTOM" หรือ "สายบน" / "สายล่าง"
 */
function normalizeBracketSide(value) {
  if (!value) return null;
  const v = String(value).toUpperCase();
  if (["TOP", "สายบน", "บน"].includes(v)) return "TOP";
  if (["BOTTOM", "สายล่าง", "ล่าง"].includes(v)) return "BOTTOM";
  return value;
}

/**
 * แปลง match จาก backend → object ที่ UI ใช้
 * อิงจาก match.model.js (field: matchId, handLevel, roundType, round, sets, status, team1, team2, court, scheduledAt, bracketSide, matchNo)
 */
function normalizeMatch(raw) {
  if (!raw) return null;

  // team1 / team2: ต้องให้ backend populate แล้วได้ { _id, teamName } มา
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

/**
 * สรุปผลแมตช์จาก sets:
 * - นับเฉพาะเซ็ตที่ t1,t2 ไม่ใช่ 0-0 (เพราะ backend default = 0)
 */
function getMatchSummary(match) {
  const games = match.games || [];

  let t1Sets = 0;
  let t2Sets = 0;
  let t1Points = 0;
  let t2Points = 0;

  games.forEach((g) => {
    if (g == null) return;
    const a = Number(g.t1 ?? 0);
    const b = Number(g.t2 ?? 0);

    // 0-0 แปลว่ายังไม่กรอก
    if (a === 0 && b === 0) return;

    t1Points += a;
    t2Points += b;

    if (a > b) t1Sets += 1;
    else if (b > a) t2Sets += 1;
  });

  let winnerTeamId = null;
  if (t1Sets > t2Sets) winnerTeamId = match.team1.id;
  else if (t2Sets > t1Sets) winnerTeamId = match.team2.id;

  return { t1Sets, t2Sets, t1Points, t2Points, winnerTeamId };
}

function getSetScoreLabel(match) {
  const { t1Sets, t2Sets } = getMatchSummary(match);
  if (t1Sets === 0 && t2Sets === 0) return "ยังไม่กรอกคะแนน";
  return `${t1Sets} - ${t2Sets} เซ็ต`;
}

function getWinnerName(match) {
  const summary = getMatchSummary(match);
  if (!summary.winnerTeamId) return "ยังไม่มีผู้ชนะ";
  return summary.winnerTeamId === match.team1.id
    ? match.team1.name
    : match.team2.name;
}

/**
 * Card แสดงแต่ละแมตช์ใน list
 */
function MatchCard({ match, onClick }) {
  const setLabel = useMemo(() => getSetScoreLabel(match), [match]);
  const winnerName = useMemo(() => getWinnerName(match), [match]);
  const { t1Sets, t2Sets, winnerTeamId } = getMatchSummary(match);

  // ตรวจสอบสถานะจริงจากคะแนน
  const hasScore = t1Sets > 0 || t2Sets > 0 || winnerTeamId;
  const isFinished = match.status === "finished" && hasScore;
  const isScheduled = match.status === "scheduled";
  const isInProgress = match.status === "in-progress";

  let statusLabel = "รอจัดการ";
  let statusColor = "bg-slate-50 text-slate-500 border-slate-100";

  if (isFinished) {
    statusLabel = "บันทึกคะแนนแล้ว";
    statusColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
  } else if (isInProgress) {
    statusLabel = "กำลังแข่ง";
    statusColor = "bg-amber-50 text-amber-700 border-amber-100";
  } else if (isScheduled) {
    // ถ้า scheduled แต่มีคะแนนแล้ว (อาจจะลืมจบแมตช์)
    if (hasScore) {
       statusLabel = "มีคะแนน (รอจบ)";
       statusColor = "bg-blue-50 text-blue-700 border-blue-100";
    } else {
       statusLabel = "ยังไม่แข่ง"; // เปลี่ยนคำให้สื่อความหมายชัดเจนขึ้น
       statusColor = "bg-slate-100 text-slate-600 border-slate-200";
    }
  }

  const sideLabel =
    match.bracketSide === "TOP"
      ? "สายบน"
      : match.bracketSide === "BOTTOM"
      ? "สายล่าง"
      : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl bg-white border border-slate-200 shadow-sm shadow-slate-100 px-4 py-3 mb-3 flex flex-col gap-2 hover:border-indigo-400 hover:shadow-md transition"
    >
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900">
            {match.matchId || `M${match.matchNo}`}
          </span>
          {match.round && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {match.round}
            </span>
          )}
          {sideLabel && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
              {sideLabel}
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400">
          {match.court || "-"} · {match.startTime || "-"}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 flex flex-col gap-1 text-sm">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${match.team1.id === winnerTeamId ? "text-emerald-700" : "text-slate-900"}`}>
              {match.team1.name}
            </span>
            {match.team1.id === winnerTeamId && <span className="text-emerald-600">🏆</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${match.team2.id === winnerTeamId ? "text-emerald-700" : "text-slate-900"}`}>
              {match.team2.name}
            </span>
            {match.team2.id === winnerTeamId && <span className="text-emerald-600">🏆</span>}
          </div>
        </div>
        <div className="flex flex-col items-end min-w-[90px] text-xs text-slate-500">
          <span className="font-semibold text-slate-900 mb-1">
            {setLabel}
          </span>
          {/* ซ่อนชื่อผู้ชนะตรงนี้ เพราะใส่ถ้วยรางวัลหลังชื่อทีมแล้ว */}
        </div>
      </div>

      <div className="flex items-center justify-between mt-1">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ${statusColor}`}
        >
          {statusLabel}
        </span>
        <span className="text-[11px] text-indigo-600 font-medium">
          {isFinished ? "แก้ไขคะแนน" : "บันทึกผล"}
        </span>
      </div>
    </button>
  );
}

/**
 * Bottom sheet กรอกคะแนนเป็นเซ็ต (ใช้ sets ของ backend)
 */
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
        // 0-0 ถือว่ายังไม่กรอก → แสดงเป็นช่องว่าง
        const a = Number(g.t1 ?? 0);
        const b = Number(g.t2 ?? 0);
        return {
          t1: a === 0 && b === 0 ? "" : a,
          t2: a === 0 && b === 0 ? "" : b,
        };
      });
      setLocalGames(merged);
    }
  }, [open, match]);

  if (!open || !match) return null;

  const handleChange = (idx, field, value) => {
    const v = value.trim();
    setLocalGames((prev) =>
      prev.map((g, i) =>
        i === idx ? { ...g, [field]: v === "" ? "" : Number(v) } : g
      )
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const sets = localGames.map((g) => ({
      t1: g.t1 === "" ? 0 : Number(g.t1),
      t2: g.t2 === "" ? 0 : Number(g.t2),
    }));
    onSave(match.id, sets);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30">
      <div className="w-full max-w-2xl rounded-t-3xl bg-white shadow-xl p-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              กรอกคะแนน Knockout
            </h2>
            <p className="text-xs text-slate-500">
              {match.matchId || `M${match.matchNo}`} · {match.handLevel} ·{" "}
              {match.round}
            </p>
          </div>
          <button
            type="button"
            className="text-xs text-slate-400 hover:text-slate-600"
            onClick={onClose}
          >
            ปิด
          </button>
        </div>

        <div className="rounded-2xl border bg-slate-50 px-3 py-2 mb-3 text-xs text-slate-600">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{match.team1.name}</span>
              <span className="text-[11px] text-slate-400">ทีม 1</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">{match.team2.name}</span>
              <span className="text-[11px] text-slate-400">ทีม 2</span>
            </div>
          </div>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2"
            >
              <div className="flex-1 text-xs text-slate-500">
                <span className="font-semibold text-slate-900">
                  เกมที่ {idx + 1}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-center text-sm"
                  value={localGames[idx].t1}
                  onChange={(e) =>
                    handleChange(idx, "t1", e.target.value || "")
                  }
                />
                <span className="text-xs text-slate-400">:</span>
                <input
                  type="number"
                  min="0"
                  className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-center text-sm"
                  value={localGames[idx].t2}
                  onChange={(e) =>
                    handleChange(idx, "t2", e.target.value || "")
                  }
                />
              </div>
            </div>
          ))}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={onClose}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl text-xs bg-indigo-600 text-white font-medium hover:bg-indigo-700"
            >
              บันทึกคะแนน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * หน้า Admin กรอกคะแนน Knockout
 * ใช้ endpoint:
 *   GET /api/matches?roundType=knockout&handLevel=...&round=...
 *   PUT /api/matches/:id/score
 */
export default function KnockoutScoringAdminPage() {
  const [handLevel, setHandLevel] = useState(HAND_LEVEL_OPTIONS[0].value);
  const [roundCode, setRoundCode] = useState("QF");
  const [bracketSideFilter, setBracketSideFilter] = useState("ALL");
  const [searchText, setSearchText] = useState("");

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);

  const loadMatches = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        roundType: "knockout",
        handLevel,
        round: roundCode,
        sort: "matchNo:asc",
        page: "1",
        pageSize: "200",
      });

      const res = await fetch(`/api/matches?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : data;
      const normalized = (items || [])
        .map((m) => normalizeMatch(m))
        .filter(Boolean);

      setMatches(normalized);
    } catch (err) {
      console.error("Failed to load knockout matches", err);
      setError("โหลดรายการแมตช์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handLevel, roundCode]);

  const filteredMatches = useMemo(() => {
    let list = [...matches];

    if (bracketSideFilter !== "ALL") {
      list = list.filter(
        (m) => m.bracketSide === bracketSideFilter || !m.bracketSide
      );
    }

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      list = list.filter(
        (m) =>
          (m.team1?.name || "").toLowerCase().includes(q) ||
          (m.team2?.name || "").toLowerCase().includes(q) ||
          (m.matchId || "").toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => (a.matchNo || 0) - (b.matchNo || 0));
  }, [matches, bracketSideFilter, searchText]);

  const handleOpenSheet = (match) => {
    setEditingMatch(match);
    setSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setSheetOpen(false);
    setEditingMatch(null);
  };

  const handleSaveScore = async (matchId, sets) => {
    // optimistic update
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
          allowDraw: false,
          status: "finished",
        }),
      });
    } catch (err) {
      console.error("save score error", err);
      // ถ้า error → reload จาก server อีกรอบ
      loadMatches();
    } finally {
      handleCloseSheet();
    }
  };

  const currentHandLabel =
    HAND_LEVEL_OPTIONS.find((h) => h.value === handLevel)?.labelShort ||
    handLevel;
  const currentRoundLabel =
    ROUND_OPTIONS.find((r) => r.value === roundCode)?.label || roundCode;

  return (
    <div className="px-6 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            กรอกคะแนนรอบ Knockout
          </h1>
          <p className="text-xs text-slate-500">
            เลือกมือและรอบ แล้วกดที่แมตช์เพื่อกรอกคะแนนเป็นเซ็ต
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 space-y-3">
        {/* มือ */}
        <div className="flex flex-wrap gap-2">
          {HAND_LEVEL_OPTIONS.map((h) => {
            const active = h.value === handLevel;
            return (
              <button
                key={h.value}
                type="button"
                onClick={() => setHandLevel(h.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  active
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {h.labelShort}
              </button>
            );
          })}
        </div>

        {/* รอบ + สาย + search */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">รอบ:</span>
            <select
              className="rounded-xl border border-slate-200 px-2 py-1 text-xs bg-white"
              value={roundCode}
              onChange={(e) => setRoundCode(e.target.value)}
            >
              {ROUND_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">สาย:</span>
            <select
              className="rounded-xl border border-slate-200 px-2 py-1 text-xs bg-white"
              value={bracketSideFilter}
              onChange={(e) => setBracketSideFilter(e.target.value)}
            >
              {BRACKET_SIDE_FILTERS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[180px]">
            <div className="relative">
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 px-3 py-1.5 pr-9 text-xs"
                placeholder="ค้นหาทีม / Match ID"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                🔍
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={loadMatches}
            className="px-3 py-1.5 rounded-xl text-xs bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
          >
            รีเฟรช
          </button>
        </div>

        {/* Summary */}
        <div className="text-[11px] text-slate-500">
          มือ{" "}
          <span className="font-semibold text-slate-900">{currentHandLabel}</span>{" "}
          · รอบ{" "}
          <span className="font-semibold text-slate-900">
            {currentRoundLabel}
          </span>{" "}
          · ทั้งหมด{" "}
          <span className="font-semibold text-slate-900">
            {filteredMatches.length}
          </span>{" "}
          แมตช์
        </div>
      </div>

      {/* Match list */}
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-4 min-h-[220px]">
        {loading && (
          <div className="py-10 text-center text-xs text-slate-500">
            กำลังโหลดข้อมูล...
          </div>
        )}

        {!loading && error && (
          <div className="py-10 text-center text-xs text-red-500">{error}</div>
        )}

        {!loading && !error && filteredMatches.length === 0 && (
          <div className="py-10 text-center text-xs text-slate-500">
            ยังไม่มีแมตช์ในรอบ / มือ นี้
            <div className="mt-1 text-[11px] text-slate-400">
              ตรวจสอบการสร้างสาย Knockout ก่อน
            </div>
          </div>
        )}

        {!loading &&
          !error &&
          filteredMatches.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              onClick={() => handleOpenSheet(m)}
            />
          ))}
      </div>

      <ScoreSheet
        open={sheetOpen}
        match={editingMatch}
        onClose={handleCloseSheet}
        onSave={handleSaveScore}
      />
    </div>
  );
}
