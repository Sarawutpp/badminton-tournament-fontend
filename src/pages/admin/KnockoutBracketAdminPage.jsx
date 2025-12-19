// src/pages/admin/KnockoutBracketAdminPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { API } from "@/lib/api";
import { useTournament } from "@/contexts/TournamentContext"; // 1. Import Context

// --- Constants & Helpers ---

// Fallback ค่าเดิมเผื่อไม่มี Config หรือยังโหลดไม่เสร็จ
const DEFAULT_HAND_OPTIONS = [
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

function formatTimeFromISO(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
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
  };
}

// --- Components ---

function BracketMatchRow({ match }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs mb-2 shadow-sm shadow-slate-100">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 text-[11px]">
            {match.matchId || `M${match.matchNo}`}
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-500 text-[10px]">
            {match.court || "-"}
          </span>
        </div>
        <span className="text-[10px] text-slate-400">
          {match.startTime || "-"}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900">
            {match.team1.name}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900">
            {match.team2.name}
          </span>
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function KnockoutBracketAdminPage() {
  const { selectedTournament } = useTournament(); // 2. ดึง Config

  // 3. คำนวณ Hand Options จาก Config
  const handOptions = useMemo(() => {
    const cats = selectedTournament?.settings?.categories;
    if (cats && cats.length > 0) {
      return cats.map((c) => ({
        label: c,
        value: c,
        labelShort: c,
      }));
    }
    return DEFAULT_HAND_OPTIONS;
  }, [selectedTournament]);

  // ตั้งค่า Default handLevel
  const [handLevel, setHandLevel] = useState(handOptions[0]?.value || "");
  const [roundCode, setRoundCode] = useState("QF");

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // 4. Update handLevel เมื่อ Config โหลดเสร็จ หรือเปลี่ยน
  useEffect(() => {
    // ถ้าค่าปัจจุบันไม่อยู่ใน list ใหม่ ให้ reset เป็นค่าแรก
    if (handOptions.length > 0 && !handOptions.find((h) => h.value === handLevel)) {
      setHandLevel(handOptions[0].value);
    }
  }, [handOptions, handLevel]);

  const loadMatches = async () => {
    if (!handLevel) return;

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
      console.error("Failed to load knockout bracket", err);
      setError("โหลดสาย Knockout ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handLevel, roundCode]);

  const handleAutoGenerate = async () => {
    const confirmMsg =
      `ยืนยันการจัดสายการแข่ง (Update)?\n` +
      `- มือ: ${handLevel}\n` +
      `- รอบ: ${roundCode}\n\n` +
      `ระบบจะนำทีมที่มีคะแนนดีที่สุด ไปหยอดใส่ตาราง Knockout ที่สร้างรอไว้แล้ว`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setIsGenerating(true);
    try {
      const data = await API.generateKnockoutAuto({
        handLevel,
        round: roundCode,
      });

      const count = data.updatedMatches || 0;
      const total = data.totalSkeleton || 0;

      alert(
        `✅ จัดสายเรียบร้อย!\nจับคู่ทีมลงตารางแล้ว ${count} คู่ (จากที่ว่างทั้งหมด ${total} ช่อง)`
      );

      loadMatches();
    } catch (err) {
      alert(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const { topMatches, bottomMatches } = useMemo(() => {
    const top = matches
      .filter((m) => m.bracketSide === "TOP")
      .sort((a, b) => (a.matchNo || 0) - (b.matchNo || 0));
    const bottom = matches
      .filter((m) => m.bracketSide === "BOTTOM")
      .sort((a, b) => (a.matchNo || 0) - (b.matchNo || 0));
    return { topMatches: top, bottomMatches: bottom };
  }, [matches]);

  const currentHandLabel =
    handOptions.find((h) => h.value === handLevel)?.labelShort || handLevel;
  const currentRoundLabel =
    ROUND_OPTIONS.find((r) => r.value === roundCode)?.label || roundCode;

  return (
    <div className="px-6 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            จัดสาย Knockout
          </h1>
          <p className="text-xs text-slate-500">
            ดูสายบน / สายล่าง ของแต่ละมือและรอบ
          </p>
        </div>

        {/* ปุ่ม Generate */}
        <div>
          <button
            onClick={handleAutoGenerate}
            disabled={isGenerating || loading}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 shadow-sm transition-colors flex items-center gap-2"
          >
            {isGenerating ? (
              <span>⏳ กำลังประมวลผล...</span>
            ) : (
              <>
                <span>✨ ดึงทีมจากรอบแบ่งกลุ่ม</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter card */}
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 space-y-3">
        {/* Dynamic Hand Options */}
        <div className="flex flex-wrap gap-2">
          {handOptions.map((h) => {
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

          <button
            type="button"
            onClick={loadMatches}
            className="px-3 py-1.5 rounded-xl text-xs bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
          >
            รีเฟรช
          </button>
        </div>

        <div className="text-[11px] text-slate-500">
          มือ{" "}
          <span className="font-semibold text-slate-900">
            {currentHandLabel}
          </span>{" "}
          · รอบ{" "}
          <span className="font-semibold text-slate-900">
            {currentRoundLabel}
          </span>{" "}
          · ทั้งหมด{" "}
          <span className="font-semibold text-slate-900">
            {matches.length}
          </span>{" "}
          แมตช์
        </div>
      </div>

      {/* Bracket view */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* สายบน */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 min-h-[200px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-semibold text-slate-700">
                สายบน (Upper Bracket)
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {topMatches.length} แมตช์
            </span>
          </div>
          {loading && (
            <div className="py-6 text-center text-[11px] text-slate-500">
              กำลังโหลดข้อมูล...
            </div>
          )}
          {!loading && error && (
            <div className="py-6 text-center text-[11px] text-red-500">
              {error}
            </div>
          )}
          {!loading && !error && topMatches.length === 0 && (
            <div className="py-6 text-center text-[11px] text-slate-500">
              ยังไม่มีสายบนในรอบนี้
            </div>
          )}
          {!loading &&
            !error &&
            topMatches.map((m) => <BracketMatchRow key={m.id} match={m} />)}
        </div>

        {/* สายล่าง */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 min-h-[200px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-xs font-semibold text-slate-700">
                สายล่าง (Lower Bracket)
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {bottomMatches.length} แมตช์
            </span>
          </div>
          {loading && (
            <div className="py-6 text-center text-[11px] text-slate-500">
              กำลังโหลดข้อมูล...
            </div>
          )}
          {!loading && error && (
            <div className="py-6 text-center text-[11px] text-red-500">
              {error}
            </div>
          )}
          {!loading && !error && bottomMatches.length === 0 && (
            <div className="py-6 text-center text-[11px] text-slate-500">
              ยังไม่มีสายล่างในรอบนี้
            </div>
          )}
          {!loading &&
            !error &&
            bottomMatches.map((m) => (
              <BracketMatchRow key={m.id} match={m} />
            ))}
        </div>
      </div>
    </div>
  );
}