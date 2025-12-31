// src/pages/admin/KnockoutBracketAdminPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import { API } from "@/lib/api";
import { useTournament } from "@/contexts/TournamentContext";
import SpinWheel from "@/components/SpinWheel";

// ลำดับความสำคัญของรอบ
const ROUND_ORDER = {
  KO32: 1,
  KO16: 2,
  QF: 3,
  SF: 4,
  F: 5,
};

// Map เพื่อหาว่ารอบก่อนหน้าคือรอบไหน
const PREVIOUS_ROUND_MAP = {
  KO16: "KO32",
  QF: "KO16",
  SF: "QF",
  F: "SF",
};

// --- Components ย่อย ---

function SeedingTable({ upper, lower }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!upper || !lower) return null;

  const renderRows = (teams, label, badgeColor, dotColor) => (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
        <h4 className="font-bold text-slate-700 text-sm">
          {label} ({teams.length})
        </h4>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-3 py-2 w-8 text-center">#</th>
              <th className="px-3 py-2">ทีม</th>
              <th className="px-3 py-2 text-center">กลุ่ม</th>
              <th className="px-3 py-2 text-center">แต้ม</th>
              <th className="px-3 py-2 text-center">ต่าง</th>
              <th className="px-3 py-2 text-right">Tier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {teams.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-slate-400"
                >
                  ไม่มีทีม
                </td>
              </tr>
            ) : (
              teams.map((t, i) => (
                <tr key={t._id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-center font-mono text-slate-400">
                    {i + 1}
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-900 truncate max-w-[120px]">
                    {t.teamName}
                    {t.manualRank > 0 && (
                      <span className="ml-1 text-[9px] bg-yellow-100 text-yellow-700 px-1 rounded">
                        MR{t.manualRank}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="bg-slate-100 text-slate-600 px-1.5 rounded text-[10px]">
                      {t.group}
                      {t.groupRank}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center font-bold text-indigo-600">
                    {t.points}
                  </td>
                  <td className="px-3 py-2 text-center text-slate-500">
                    {t.scoreDiff > 0 ? `+${t.scoreDiff}` : t.scoreDiff}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[9px] ${badgeColor}`}
                    >
                      {t.tier}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-indigo-800 font-bold hover:opacity-80 transition-opacity"
      >
        <span className="flex items-center gap-2">
          📊 ตารางอันดับการวางสาย (Seeding Rankings)
        </span>
        <span className="text-xl leading-none">{isOpen ? "−" : "+"}</span>
      </button>

      {isOpen && (
        <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
          <div className="grid md:grid-cols-2 gap-4">
            {renderRows(
              upper,
              "สายบน (Upper Pool)",
              "bg-emerald-100 text-emerald-700 border border-emerald-200",
              "bg-emerald-500"
            )}
            {renderRows(
              lower,
              "สายล่าง (Lower Pool)",
              "bg-amber-100 text-amber-700 border border-amber-200",
              "bg-amber-500"
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamSelectorModal({
  isOpen,
  onClose,
  onSelect,
  availableTeams,
  currentTeamId,
  slotName,
}) {
  const [mode, setMode] = useState("list");

  if (!isOpen) return null;
  const isTooMany = availableTeams.length > 20;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800">เลือกทีมลง {slotName}</h3>
          </div>
          <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <button
              onClick={() => setMode("list")}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                mode === "list"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-slate-500"
              }`}
            >
              รายชื่อ
            </button>
            <button
              onClick={() => setMode("wheel")}
              disabled={isTooMany}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                mode === "wheel"
                  ? "bg-amber-100 text-amber-700"
                  : "text-slate-500 disabled:opacity-30"
              }`}
            >
              วงล้อสุ่ม
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 text-xl ml-2"
          >
            &times;
          </button>
        </div>
        <div className="p-2 overflow-y-auto custom-scrollbar bg-slate-50/50 flex-1 min-h-[300px]">
          {availableTeams.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <span className="text-3xl">🏁</span>
              <span>ไม่มีทีมคงเหลือให้เลือก</span>
            </div>
          ) : mode === "list" ? (
            <div className="grid gap-2">
              {availableTeams.map((team) => (
                <button
                  key={team._id}
                  onClick={() => onSelect(team)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all group ${
                    currentTeamId === team._id
                      ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500"
                      : "bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 ${
                        team.tier === "BOTTOM"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {team.group}
                      {team.groupRank}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm">
                        {team.teamName}
                      </span>
                      <span className="text-[10px] text-slate-500 flex gap-2">
                        <span>{team.points} pts</span>
                        {team.tier && (
                          <span className="opacity-50">• {team.tier}</span>
                        )}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <SpinWheel
              teams={availableTeams}
              onWinnerFound={(team) => {
                onSelect(team);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ✅ UPDATED: แสดงผล Seed #Rank ที่ด้านขวาของทีม
function MatchEditorCard({
  match,
  onOpenSelection,
  isFirstRound,
  t1Seed,
  t2Seed,
}) {
  const t1 = match.team1 || {};
  const t2 = match.team2 || {};
  const hasT1 = !!t1._id;
  const hasT2 = !!t2._id;

  const isAutoAdvancedMatch = !isFirstRound;

  // 1. การ์ดสำหรับรอบ Auto (Auto Advance) - อันนี้ล็อกทั้งใบอยู่แล้ว
  if (isAutoAdvancedMatch) {
    return (
      <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm opacity-70 hover:opacity-100 transition-opacity">
        <div className="w-10 bg-slate-100 border-r border-slate-200 flex flex-col items-center justify-center text-[10px] text-slate-500 font-bold">
          #{match.matchNo}
        </div>
        <div className="flex-1 flex flex-col divide-y divide-slate-100">
          <div className="px-3 py-2 flex items-center justify-between bg-white h-1/2">
            <span
              className={`text-xs font-bold ${
                hasT1 ? "text-slate-800" : "text-slate-400 italic"
              }`}
            >
              {hasT1 ? t1.teamName || t1.name : "รอผู้ชนะ..."}
            </span>
          </div>
          <div className="px-3 py-2 flex items-center justify-between bg-white h-1/2">
            <span
              className={`text-xs font-bold ${
                hasT2 ? "text-slate-800" : "text-slate-400 italic"
              }`}
            >
              {hasT2 ? t2.teamName || t2.name : "รอผู้ชนะ..."}
            </span>
          </div>
        </div>
        <div className="bg-slate-50 px-2 flex items-center justify-center border-l border-slate-100">
          <span className="text-[9px] text-slate-400 -rotate-90 whitespace-nowrap font-medium tracking-widest">
            AUTO
          </span>
        </div>
      </div>
    );
  }

  // Helper สำหรับปุ่มเลือกทีม (Slot Button)
  const renderSlotButton = (team, hasTeam, seedRank, slotKey) => {
    // 🔥 LOGIC LIG: ถ้ามี Seed Rank ให้ถือว่าเป็น "ช่องล็อกตายตัว" (Disabled)
    const isLocked = !!seedRank;

    const baseStyle =
      "w-full flex items-center justify-between px-2 py-2 rounded-lg border transition-all";

    // Style กรณีล็อก (Fixed Seed)
    const lockedStyle =
      "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed";

    // Style กรณีเลือกได้ (Selectable)
    const activeStyle = hasTeam
      ? "bg-white border-indigo-200 text-indigo-700 shadow-sm border-solid"
      : "bg-slate-50 border-slate-300 border-dashed text-slate-400 hover:bg-white hover:border-indigo-400 hover:text-indigo-600";

    return (
      <button
        onClick={() => !isLocked && onOpenSelection(match, slotKey)}
        disabled={isLocked}
        className={`${baseStyle} ${isLocked ? lockedStyle : activeStyle}`}
      >
        {hasTeam ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 overflow-hidden">
              {/* Badge Group Rank */}
              {(team.groupRank === 1 || team.groupRank === 2) && (
                <span
                  className={`text-[8px] px-1 rounded font-bold border shrink-0 ${
                    isLocked
                      ? "bg-slate-200 text-slate-600 border-slate-300"
                      : "bg-yellow-100 text-yellow-700 border-yellow-200"
                  }`}
                >
                  {team.group}
                  {team.groupRank}
                </span>
              )}
              <span
                className={`text-xs font-bold text-left truncate ${
                  isLocked ? "text-slate-600" : "text-slate-800"
                }`}
              >
                {team.teamName || team.name}
              </span>
            </div>

            {/* 🔥 แสดง Seed Rank & Lock Icon */}
            {seedRank && (
              <div className="flex items-center gap-1">
                <span className="text-[10px]">🔒</span>
                <span className="text-xs font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                  #{seedRank}
                </span>
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs flex items-center gap-1 opacity-70">
            + เลือกทีม
          </span>
        )}
      </button>
    );
  };

  const isLower = match.bracketSide === "BOTTOM";
  const cardStyle = isLower
    ? "ring-1 ring-amber-50 border-amber-100"
    : "hover:shadow-md border-slate-200";
  const indexBg = isLower
    ? "bg-amber-50 text-amber-600 border-amber-100"
    : "bg-slate-50 text-slate-500 border-slate-100";

  return (
    <div
      className={`flex items-stretch border rounded-xl overflow-hidden bg-white shadow-sm transition-all ${cardStyle}`}
    >
      {/* Match Number */}
      <div
        className={`w-10 border-r flex flex-col items-center justify-center text-[10px] gap-1 font-bold ${indexBg}`}
      >
        <span>#{match.matchNo}</span>
      </div>

      {/* Team Selection Slots */}
      <div className="flex-1 flex flex-col divide-y divide-slate-50">
        <div className="flex-1 px-1 py-1">
          {renderSlotButton(t1, hasT1, t1Seed, "team1")}
        </div>
        <div className="flex-1 px-1 py-1">
          {renderSlotButton(t2, hasT2, t2Seed, "team2")}
        </div>
      </div>
    </div>
  );
}

export default function KnockoutBracketAdminPage() {
  const { selectedTournament } = useTournament();

  const [handLevel, setHandLevel] = useState("Baby");
  const [roundCode, setRoundCode] = useState("KO16");
  const [matches, setMatches] = useState([]);

  const [isFirstRound, setIsFirstRound] = useState(false);
  const [entryRoundMap, setEntryRoundMap] = useState({
    upper: "KO16",
    lower: "KO16",
  });

  const [upperPool, setUpperPool] = useState([]);
  const [lowerPool, setLowerPool] = useState([]);
  const [allQualifiedTeams, setAllQualifiedTeams] = useState([]);

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectingSlot, setSelectingSlot] = useState("team2");

  // --- Logic การโหลดข้อมูล ---
  const loadData = async () => {
    if (!selectedTournament) return;
    setLoading(true);
    try {
      const matchesRes = await API.listSchedule({
        handLevel,
        roundType: "knockout",
        sort: "matchNo",
        pageSize: 200,
      });
      const allKoMatches = matchesRes.items || [];
      const filteredMatches = allKoMatches.filter((m) => m.round === roundCode);
      setMatches(filteredMatches);

      const standingsRes = await API.getStandings(
        handLevel,
        selectedTournament._id
      );
      const groups = standingsRes.groups || [];

      let flatTeams = [];
      groups.forEach((g) => {
        g.teams.forEach((t) => flatTeams.push({ ...t, group: g.groupName }));
      });
      const totalTeams = flatTeams.length;
      const groupCount = groups.length;

      let startUpper = "KO16";
      let startLower = "KO16";
      let is24TeamsModel = false;
      let is8TeamsStandard = false;

      const settings = selectedTournament?.settings || {};
      const isMini = settings.qualificationType === "MINI_SPLIT";

      if (groupCount === 2) {
        if (isMini) {
          startUpper = "SF";
          startLower = "SF";
        } else {
          startUpper = "QF";
          startLower = "QF";
          is8TeamsStandard = true;
        }
      } else if (groupCount === 4) {
        startUpper = "QF";
        startLower = "QF";
      } else if (groupCount === 6) {
        startUpper = "KO16";
        startLower = "QF";
        is24TeamsModel = true;
      } else if (groupCount >= 8) {
        startUpper = "KO16";
        startLower = "KO16";
      } else {
        if (totalTeams <= 8) {
          if (!isMini && totalTeams > 4) {
            startUpper = "QF";
            startLower = "QF";
            is8TeamsStandard = true;
          } else {
            startUpper = "SF";
            startLower = "SF";
          }
        } else if (totalTeams <= 16) {
          startUpper = "QF";
          startLower = "QF";
        } else {
          startUpper = "KO16";
          startLower = "KO16";
        }
      }

      setEntryRoundMap({ upper: startUpper, lower: startLower });
      setIsFirstRound(roundCode === startUpper);

      let initialUpper = [];
      let initialLower = [];

      if (is24TeamsModel) {
        const r1 = flatTeams
          .filter((t) => t.groupRank === 1)
          .map((t) => ({ ...t, tier: "TOP" }));
        const r2 = flatTeams
          .filter((t) => t.groupRank === 2)
          .map((t) => ({ ...t, tier: "TOP" }));
        const r3 = flatTeams
          .filter((t) => t.groupRank === 3)
          .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return (b.scoreDiff || 0) - (a.scoreDiff || 0);
          });
        const best3rd = r3.slice(0, 4).map((t) => ({ ...t, tier: "TOP" }));
        const lower3rd = r3.slice(4).map((t) => ({ ...t, tier: "BOTTOM" }));
        const r4 = flatTeams
          .filter((t) => t.groupRank === 4)
          .map((t) => ({ ...t, tier: "BOTTOM" }));

        initialUpper = [...r1, ...r2, ...best3rd];
        initialLower = [...lower3rd, ...r4];
      } else if (is8TeamsStandard) {
        initialUpper = flatTeams.map((t) => ({ ...t, tier: "TOP" }));
        initialLower = [];
      } else {
        initialUpper = flatTeams
          .filter((t) => t.groupRank <= 2)
          .map((t) => ({ ...t, tier: "TOP" }));
        initialLower = flatTeams
          .filter((t) => t.groupRank > 2)
          .map((t) => ({ ...t, tier: "BOTTOM" }));
      }

      let finalUpper = [];
      let finalLower = [];
      const prevRoundCode = PREVIOUS_ROUND_MAP[roundCode];

      const getWinnersFromPrev = (side) => {
        if (!prevRoundCode) return [];
        const prevMatches = allKoMatches.filter(
          (m) => m.round === prevRoundCode
        );
        const winnerIds = new Set();
        const finishedPrevMatches = prevMatches.filter(
          (m) => m.status === "finished" && m.winner
        );
        finishedPrevMatches.forEach((m) => {
          const targetSide = m.bracketSide === "BOTTOM" ? "BOTTOM" : "TOP";
          if (side && targetSide !== side) return;
          const wId = m.winner._id
            ? m.winner._id
            : m.winner === m.team1?._id
            ? m.team1?._id
            : m.team2?._id;
          if (wId) winnerIds.add(String(wId));
        });
        return flatTeams
          .filter((t) => winnerIds.has(String(t._id)))
          .map((t) => ({ ...t, tier: side }));
      };

      if (roundCode === startUpper) {
        finalUpper = initialUpper;
      } else {
        finalUpper = getWinnersFromPrev("TOP");
      }

      if (roundCode === startLower) {
        finalLower = initialLower;
      } else {
        finalLower = getWinnersFromPrev("BOTTOM");
      }

      const compare = (a, b) => {
        // 1. Group Rank (Ascending: 1 -> 2 -> 3) สำคัญที่สุด!
        if (a.groupRank !== b.groupRank) {
          return a.groupRank - b.groupRank;
        }
        // 2. Points (Descending)
        if (b.points !== a.points) return b.points - a.points;
        // 3. Score Diff (Descending)
        return (b.scoreDiff || 0) - (a.scoreDiff || 0);
      };

      if (roundCode === startUpper) {
        finalUpper.sort(compare);
      } else {
        // รอบลึกๆ แล้ว เรียงตามชื่อแมตช์หรือชื่อทีมก็ได้
        finalUpper.sort((a, b) =>
          (a.teamName || "").localeCompare(b.teamName || "")
        );
      }

      if (roundCode === startLower) {
        finalLower.sort(compare);
      } else {
        finalLower.sort((a, b) =>
          (a.teamName || "").localeCompare(b.teamName || "")
        );
      }

      setUpperPool(finalUpper);
      setLowerPool(finalLower);
      setAllQualifiedTeams([...finalUpper, ...finalLower]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [handLevel, roundCode, selectedTournament]);

  const handlePrepareSeeds = async () => {
    if (
      !confirm(
        `ยืนยันการ "ดึงทีมวาง" สำหรับรุ่น ${handLevel} รอบ ${roundCode}?\n\n⚠️ ข้อมูลการจับคู่เดิมในรอบนี้จะถูกล้างใหม่หมด!`
      )
    )
      return;
    setLoading(true);
    try {
      await API.prepareKnockoutSeeds({
        handLevel,
        tournamentId: selectedTournament._id,
      });
      await loadData();
      alert("✅ ดึงทีมวางเรียบร้อย!");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleResetKnockout = async () => {
    const confirmMsg = `⚠️ อันตราย: คุณต้องการ "ล้างข้อมูล" รอบ Knockout ของรุ่น ${handLevel} ทั้งหมดใช่ไหม?

สิ่งที่ระบบจะทำ:
1. เอาชื่อทีมออกจากทุกแมตช์ (รวมถึงแมตช์ที่แข่งจบแล้ว)
2. ลบผลคะแนนและผู้ชนะทั้งหมด
3. สถานะแมตช์จะกลับไปเป็น "รอแข่ง"

(โครงสร้างสายแข่งจะยังอยู่เหมือนเดิม)`;

    if (!window.confirm(confirmMsg)) return;

    if (!window.confirm("ยืนยันครั้งสุดท้าย: ล้างข้อมูลจริงหรือไม่?")) return;

    setLoading(true);
    try {
      await API.resetKnockoutMatches({
        handLevel,
        tournamentId: selectedTournament._id,
      });
      await loadData();
      alert("✅ ล้างข้อมูลเรียบร้อย! แมตช์กลับสู่สถานะว่างเปล่า");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSelection = (match, slot) => {
    setSelectedMatch(match);
    setSelectingSlot(slot);
    setIsModalOpen(true);
  };

  const handleConfirmSelection = async (team) => {
    if (!selectedMatch) return;
    try {
      const updatePayload = {};
      if (selectingSlot === "team1") updatePayload.team1Id = team._id;
      else updatePayload.team2Id = team._id;

      await API.updateMatchPairing(selectedMatch._id, updatePayload);
      setMatches((prev) =>
        prev.map((m) => {
          if (m._id === selectedMatch._id) {
            const teamObj = {
              _id: team._id,
              teamName: team.teamName,
              name: team.teamName,
              tier: team.tier,
              group: team.group,
              groupRank: team.groupRank,
            };
            if (selectingSlot === "team1") return { ...m, team1: teamObj };
            else return { ...m, team2: teamObj };
          }
          return m;
        })
      );
      setIsModalOpen(false);
      setSelectedMatch(null);
    } catch (err) {
      alert("บันทึกไม่สำเร็จ: " + err.message);
    }
  };

  const availableTeams = useMemo(() => {
    const assignedIds = new Set();
    matches.forEach((m) => {
      if (m.team1?._id) assignedIds.add(String(m.team1._id));
      if (m.team2?._id) assignedIds.add(String(m.team2._id));
    });
    let pool = allQualifiedTeams.filter((t) => !assignedIds.has(String(t._id)));
    if (selectedMatch) {
      if (selectedMatch.bracketSide === "BOTTOM")
        pool = pool.filter((t) => t.tier === "BOTTOM");
      else if (selectedMatch.bracketSide === "TOP")
        pool = pool.filter((t) => t.tier === "TOP");
    }
    return pool;
  }, [allQualifiedTeams, matches, selectedMatch]);

  const topMatches = matches.filter((m) => m.bracketSide === "TOP");
  const bottomMatches = matches.filter((m) => m.bracketSide === "BOTTOM");

  const handOptions = useMemo(() => {
    const cats = selectedTournament?.settings?.categories || [];
    return cats.map((c) => ({ value: c, label: c }));
  }, [selectedTournament]);

  const isUpperStart = roundCode === entryRoundMap.upper;
  const isLowerStart = roundCode === entryRoundMap.lower;

  // 🔥 Helper: คำนวณ Seed Rank (เฉพาะรอบแรก และเป็น 8 ทีมแรกของสายบน)
  const getSeedRank = (teamId) => {
    if (!isUpperStart || !teamId) return null;
    // upperPool เรียงตามคะแนนแล้ว (ที่ 1 คือ Seed 1)
    const index = upperPool.findIndex((t) => t._id === teamId);
    if (index !== -1 && index < 8) return index + 1; // แสดงเฉพาะ 1-8
    return null;
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span>🎲</span> จัดสายการแข่งขัน (Draw)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            จัดการทีมวางและจับสลากคู่แข่งขันในรอบ Knockout
          </p>
        </div>

        <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
          <button
            onClick={handleResetKnockout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors border border-red-200 text-sm"
            title="ล้างทีมและคะแนนทั้งหมดในรุ่นนี้"
          >
            <span>🗑️</span>{" "}
            <span className="hidden sm:inline">ล้างข้อมูล (Reset)</span>
          </button>

          {/* เส้นคั่น (Divider) */}
          <div className="w-px bg-slate-200 my-1 mx-1"></div>

          {isFirstRound && (
            <>
              <button
                onClick={handlePrepareSeeds}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-100 text-violet-700 font-bold hover:bg-violet-200 transition-colors border border-violet-200 text-sm"
                title="ล้างกระดานและดึงทีมวางใหม่ (Reset & Seed)"
              >
                <span>⚡</span>{" "}
                <span className="hidden sm:inline">ดึงทีมวาง (Auto Seed)</span>
              </button>
              <div className="w-px bg-slate-200 my-1"></div>
            </>
          )}

          <select
            className="px-3 py-2 rounded-xl bg-slate-50 border-transparent font-semibold text-slate-700 outline-none text-sm hover:bg-slate-100 cursor-pointer"
            value={handLevel}
            onChange={(e) => setHandLevel(e.target.value)}
          >
            {handOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className="px-3 py-2 rounded-xl bg-slate-50 border-transparent font-semibold text-slate-700 outline-none text-sm hover:bg-slate-100 cursor-pointer"
            value={roundCode}
            onChange={(e) => setRoundCode(e.target.value)}
          >
            <option value="KO16">รอบ 16 ทีม</option>
            <option value="QF">รอบ 8 ทีม (QF)</option>
            <option value="SF">รอบรองฯ (SF)</option>
            <option value="F">รอบชิงฯ (F)</option>
          </select>

          <button
            onClick={loadData}
            className="w-10 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            🔄
          </button>
        </div>
      </div>

      <SeedingTable upper={upperPool} lower={lowerPool} />

      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
              <h3 className="font-bold text-slate-700 text-lg">
                สายบน (Upper Bracket)
              </h3>
              <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">
                {topMatches.length} คู่
              </span>
            </div>
            {topMatches.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                ไม่มีแมตช์ในรอบนี้
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {topMatches.map((match) => {
                  // 🔥 FIX: ค้นหาข้อมูลทีมฉบับเต็ม (ที่มี groupRank) จาก Pool มาใส่แทนข้อมูลดิบจาก Match
                  const t1Full =
                    allQualifiedTeams.find((t) => t._id === match.team1?._id) ||
                    match.team1;
                  const t2Full =
                    allQualifiedTeams.find((t) => t._id === match.team2?._id) ||
                    match.team2;

                  // สร้าง object match ใหม่ที่ข้อมูลทีมครบถ้วน
                  const enrichedMatch = {
                    ...match,
                    team1: t1Full,
                    team2: t2Full,
                  };

                  return (
                    <MatchEditorCard
                      key={match._id}
                      match={enrichedMatch} // ส่งตัวที่แก้แล้วเข้าไป
                      onOpenSelection={handleOpenSelection}
                      isFirstRound={isUpperStart}
                      t1Seed={getSeedRank(match.team1?._id)}
                      t2Seed={getSeedRank(match.team2?._id)}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {bottomMatches.length > 0 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 mb-4 pt-4 border-t border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></span>
                <h3 className="font-bold text-slate-700 text-lg">
                  สายล่าง (Lower Bracket)
                </h3>
                <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">
                  {bottomMatches.length} คู่
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {bottomMatches.map((match) => {
                  // 🔥 FIX: ทำเหมือนกันกับสายล่าง
                  const t1Full =
                    allQualifiedTeams.find((t) => t._id === match.team1?._id) ||
                    match.team1;
                  const t2Full =
                    allQualifiedTeams.find((t) => t._id === match.team2?._id) ||
                    match.team2;
                  const enrichedMatch = {
                    ...match,
                    team1: t1Full,
                    team2: t2Full,
                  };

                  return (
                    <MatchEditorCard
                      key={match._id}
                      match={enrichedMatch}
                      onOpenSelection={handleOpenSelection}
                      isFirstRound={isLowerStart}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>📊</span> สถานะทีม (Pools)
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-emerald-800">
                    Upper Pool
                  </span>
                </div>
                <span className="text-xl font-black text-emerald-700">
                  {upperPool.length}{" "}
                  <span className="text-[10px] font-normal text-emerald-600">
                    ทีม
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-xs font-bold text-amber-800">
                    Lower Pool
                  </span>
                </div>
                <span className="text-xl font-black text-amber-700">
                  {lowerPool.length}{" "}
                  <span className="text-[10px] font-normal text-amber-600">
                    ทีม
                  </span>
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  ทีมที่รอจับคู่ (รอบนี้)
                </span>
                <span className="text-xs font-bold text-indigo-600">
                  {availableTeams.length} ทีม
                </span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {availableTeams.length > 0 ? (
                  availableTeams.map((t) => (
                    <span
                      key={t._id}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border shadow-sm whitespace-nowrap ${
                        t.tier === "BOTTOM"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {t.teamName}
                    </span>
                  ))
                ) : (
                  <div className="w-full py-4 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    ✨ จับคู่ครบแล้ว
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <TeamSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableTeams={availableTeams}
        onSelect={handleConfirmSelection}
        currentTeamId={
          selectingSlot === "team1"
            ? selectedMatch?.team1?._id
            : selectedMatch?.team2?._id
        }
        slotName={selectingSlot === "team1" ? "ทีม 1" : "ทีม 2"}
      />
    </div>
  );
}
