// src/pages/public/PublicKnockoutBracket.jsx

import React, { useState, useEffect, useMemo } from "react";
import { API, teamName } from "@/lib/api.js";
import { HAND_LEVEL_OPTIONS } from "@/lib/types.js";

// --- Constants & Configuration ---

const CATEGORIES_24_TEAMS = ["BG(Men)", "BG(Mix)"];

const ROUND_FLOW = ["KO32", "KO16", "QF", "SF", "F"];

const ROUND_PRIORITY = {
  KO32: 1,
  KO16: 2,
  QF: 3,
  SF: 4,
  F: 5,
};

const ROUND_LABELS = {
  KO32: "รอบ 32 ทีม",
  KO16: "รอบ 16 ทีม",
  QF: "Quarter Final",
  SF: "Semi Final",
  F: "Final",
};

// --- Helper Functions ---

function fillBracketStructure(existingRounds) {
  if (!existingRounds.length) return [];

  const startRoundCode = existingRounds[0].code; 
  const startIndex = ROUND_FLOW.indexOf(startRoundCode);
  
  if (startIndex === -1) return existingRounds;

  const fullStructure = [...existingRounds];
  const roundMap = {};
  existingRounds.forEach(r => roundMap[r.code] = r);

  for (let i = startIndex + 1; i < ROUND_FLOW.length; i++) {
    const code = ROUND_FLOW[i];
    if (roundMap[code]) continue;

    const prevRoundCode = ROUND_FLOW[i-1];
    const prevRoundData = fullStructure.find(r => r.code === prevRoundCode);
    
    const prevCountTop = prevRoundData ? prevRoundData.top.length : 0;
    const prevCountBottom = prevRoundData ? prevRoundData.bottom.length : 0;

    const newTopCount = Math.ceil(prevCountTop / 2);
    const newBottomCount = Math.ceil(prevCountBottom / 2);

    const ghostTop = Array(newTopCount).fill(0).map((_, idx) => ({ _id: `ghost-${code}-top-${idx}`, isPlaceholder: true }));
    const ghostBottom = Array(newBottomCount).fill(0).map((_, idx) => ({ _id: `ghost-${code}-bottom-${idx}`, isPlaceholder: true }));

    if (code === 'F') {
        fullStructure.push({
            code,
            top: [],
            bottom: [],
            unknown: [{ _id: `ghost-final`, isPlaceholder: true }]
        });
    } else {
        fullStructure.push({
            code,
            top: ghostTop,
            bottom: ghostBottom,
            unknown: []
        });
    }
  }

  return fullStructure;
}

// Logic เปรียบเทียบความเก่ง (เหมือนใน backend)
function compareStatsOnly(a, b) {
  if (b.points !== a.points) return b.points - a.points;
  if (b.setsDiff !== a.setsDiff) return b.setsDiff - a.setsDiff;
  if (b.scoreDiff !== a.scoreDiff) return b.scoreDiff - a.scoreDiff;
  if (b.scoreFor !== a.scoreFor) return b.scoreFor - a.scoreFor;
  return a.teamName.localeCompare(b.teamName);
}

function compareInGroup(a, b) {
  const rankA = (a.manualRank && a.manualRank > 0) ? a.manualRank : 999;
  const rankB = (b.manualRank && b.manualRank > 0) ? b.manualRank : 999;
  if (rankA !== rankB) return rankA - rankB;
  return compareStatsOnly(a, b);
}

// --- Components ---

// ✅ แก้ไข: แสดง "เซ็ต" แทน "คะแนน"
function KnockoutMatchCard({ match, compact = false }) {
  if (match.isPlaceholder) {
    return (
      <div className={`relative rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center text-slate-400 text-[10px] select-none ${compact ? "w-[160px] h-[60px] md:w-[180px]" : "w-full h-20"}`}>
        รอคู่แข่งขัน...
      </div>
    );
  }

  // คำนวณจำนวนเซ็ต (จาก sets array)
  let t1Sets = 0;
  let t2Sets = 0;
  
  if (Array.isArray(match.sets)) {
      match.sets.forEach(s => {
          const t1 = Number(s.t1 || 0);
          const t2 = Number(s.t2 || 0);
          if (t1 > t2) t1Sets++;
          else if (t2 > t1) t2Sets++;
      });
  }

  // กรณีแข่งไม่จบ หรือยังไม่แข่ง อาจจะไม่มี winner
  // แต่ถ้ามี winner แล้ว ให้ยึดตามนั้น
  const isTeam1Win = match.winner && match.winner === match.team1?._id;
  const isTeam2Win = match.winner && match.winner === match.team2?._id;
  const isLive = match.status === "in-progress";
  
  const textSize = compact ? "text-[11px]" : "text-sm";
  const pY = compact ? "py-1" : "py-1.5";
  const widthClass = compact ? "min-w-[160px] w-[160px] md:w-[180px]" : "w-full";

  return (
    <div
      className={`relative rounded-lg border shadow-sm bg-white overflow-hidden transition-all ${widthClass} ${
        isLive ? "border-amber-400 ring-2 ring-amber-100" : "border-slate-300"
      }`}
    >
      {isLive && (
        <div className="bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 text-center uppercase tracking-wider">
          Live Now
        </div>
      )}

      <div className="p-2">
        {/* TEAM 1 */}
        <div className={`flex justify-between items-center ${pY} border-b border-slate-100`}>
          <div className={`flex items-center gap-1.5 truncate ${isTeam1Win ? "font-bold text-slate-900" : "text-slate-500"}`}>
            <span className={`truncate ${textSize}`}>{teamName(match.team1)}</span>
            {isTeam1Win && <span className="text-[10px]">🏆</span>}
          </div>
          {/* ✅ แสดงจำนวนเซ็ต */}
          <span className={`${textSize} font-mono ${isTeam1Win ? "font-bold text-slate-900" : "text-slate-400"}`}>
            {t1Sets}
          </span>
        </div>
        
        {/* TEAM 2 */}
        <div className={`flex justify-between items-center ${pY}`}>
          <div className={`flex items-center gap-1.5 truncate ${isTeam2Win ? "font-bold text-slate-900" : "text-slate-500"}`}>
            <span className={`truncate ${textSize}`}>{teamName(match.team2)}</span>
            {isTeam2Win && <span className="text-[10px]">🏆</span>}
          </div>
          {/* ✅ แสดงจำนวนเซ็ต */}
          <span className={`${textSize} font-mono ${isTeam2Win ? "font-bold text-slate-900" : "text-slate-400"}`}>
            {t2Sets}
          </span>
        </div>
      </div>
      
      <div className="bg-slate-50 px-2 py-0.5 flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-100">
        <span>#{match.matchNo}</span>
        {match.court && <span>คอร์ท {match.court}</span>}
      </div>
    </div>
  );
}

function BracketTreeView({ roundsData, title, colorClass }) {
  if (!roundsData || roundsData.length === 0) return null;

  return (
    <div className="mb-6 p-3 md:p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-inner overflow-hidden">
      <div className="flex items-center gap-2 mb-3 sticky left-0">
         <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`}></span>
         <h3 className="font-bold text-sm md:text-base text-slate-700">{title}</h3>
      </div>
      
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex items-stretch gap-6 md:gap-8 px-2 min-w-max">
          
          {roundsData.map((round, rIndex) => {
            const isUpper = title.includes("Upper");
            let displayMatches = isUpper ? round.top : round.bottom;
            
            if (round.code === 'F') {
               displayMatches = [...displayMatches, ...round.unknown];
            }

            if (displayMatches.length === 0) return null;

            return (
              <div key={round.code} className="flex flex-col">
                <div className="text-center mb-4 h-7">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] md:text-xs font-semibold text-slate-500 shadow-sm whitespace-nowrap">
                    {ROUND_LABELS[round.code] || round.code}
                  </span>
                </div>

                <div className="flex flex-col justify-around h-full gap-3">
                  {displayMatches.map((m, mIndex) => (
                    <div key={m._id || mIndex} className="relative flex items-center">
                       {rIndex > 0 && (
                         <div className="absolute -left-6 md:-left-8 w-6 md:w-8 flex items-center">
                            <div className="w-full h-px bg-slate-300"></div>
                         </div>
                       )}

                       <KnockoutMatchCard match={m} compact={true} />

                       {rIndex < roundsData.length - 1 && (
                         <div className={`absolute -right-6 md:-right-8 w-6 md:w-8 h-full pointer-events-none flex flex-col justify-center`}>
                            <div className="absolute top-1/2 right-0 w-full h-px bg-slate-300"></div>
                         </div>
                       )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BracketListView({ groupedData }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {groupedData.map((roundGroup) => (
        <section key={roundGroup.code}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-slate-200"></div>
            <h3 className="text-sm md:text-base font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-sm">
              {ROUND_LABELS[roundGroup.code] || roundGroup.code}
            </h3>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 md:p-5">
            {/* ✅ แก้ไข: กรองพวกที่เป็น Group ทิ้ง (จริงๆ ถ้า backend ส่งมาถูกต้อง มันไม่ควรมี Group ปนมาใน roundType='knockout' 
               แต่ถ้ามีหลุดมา เราจะไม่ render section นั้น หรือ render เฉพาะที่ใช่ knockout)
            */}
            
            {roundGroup.top.length > 0 && (
              <div className="mb-4">
                 <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <h4 className="text-xs font-bold text-slate-500 uppercase">สายบน (Upper)</h4>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                   {roundGroup.top.map(m => <KnockoutMatchCard key={m._id} match={m} />)}
                 </div>
              </div>
            )}
            
            {roundGroup.bottom.length > 0 && (
              <>
                 {roundGroup.top.length > 0 && <div className="border-t border-slate-100 my-4"></div>}
                 <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <h4 className="text-xs font-bold text-slate-500 uppercase">สายล่าง (Lower)</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {roundGroup.bottom.map(m => <KnockoutMatchCard key={m._id} match={m} />)}
                    </div>
                 </div>
              </>
            )}

            {roundGroup.unknown.length > 0 && (
               <>
                 {(roundGroup.top.length > 0 || roundGroup.bottom.length > 0) && <div className="border-t border-slate-100 my-4"></div>}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                   {roundGroup.unknown.map(m => <KnockoutMatchCard key={m._id} match={m} />)}
                 </div>
               </>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function SeedingTableView({ seedingData }) {
  if (!seedingData) return <div className="text-center py-8 text-slate-400">ไม่มีข้อมูลการจัดอันดับ</div>;

  const { upper, lower } = seedingData;

  const renderTable = (teams, title, colorClass, badgeType) => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
      <div className={`px-4 py-3 border-b border-slate-100 flex items-center gap-2 ${colorClass} bg-opacity-10`}>
         <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`}></span>
         <h3 className="font-bold text-slate-800">{title}</h3>
         <span className="text-xs text-slate-500 ml-auto">({teams.length} ทีม)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs md:text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-4 py-2 w-10 text-center">#</th>
              <th className="px-4 py-2">ทีม</th>
              <th className="px-4 py-2 text-center w-16">กลุ่ม</th>
              <th className="px-4 py-2 text-center w-16">คะแนน</th>
              <th className="px-4 py-2 text-center w-16">แต้มต่าง</th>
              <th className="px-4 py-2 text-right">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teams.map((t, i) => (
              <tr key={t.teamId} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-center font-mono text-slate-400">{i + 1}</td>
                <td className="px-4 py-2 font-medium text-slate-900">
                  {t.teamName}
                  {t.manualRank > 0 && (
                     <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded border border-yellow-200" title="Manual Rank">
                       MR{t.manualRank}
                     </span>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                   <span className="inline-block px-1.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] border border-slate-200">
                     {t.group}{t.groupRank}
                   </span>
                </td>
                <td className="px-4 py-2 text-center font-bold text-indigo-600">{t.points}</td>
                <td className="px-4 py-2 text-center text-slate-500">
                    {t.scoreDiff > 0 ? `+${t.scoreDiff}` : t.scoreDiff}
                </td>
                <td className="px-4 py-2 text-right">
                   {badgeType === "SEED" && i < (teams.length / 2) ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                        ⚡ ทีมวาง (Seed)
                      </span>
                   ) : badgeType === "SEED" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        🎲 จับสลาก (Draw)
                      </span>
                   ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                         สายล่าง
                      </span>
                   )}
                </td>
              </tr>
            ))}
            {teams.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">ไม่มีทีมในสายนี้</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
       <div className="mb-4 bg-indigo-50 border border-indigo-100 text-indigo-800 px-4 py-3 rounded-xl text-xs md:text-sm">
          ℹ️ <strong>เกณฑ์การจัดวางสาย:</strong> เรียงลำดับจาก คะแนนรวม {'>'} ผลต่างเซ็ต {'>'} ผลต่างแต้ม {'>'} แต้มได้ <br/>
          (ทีมวาง จะได้เจอกับ ทีมจับสลาก ในรอบแรกของสายบน ส่วนสายล่างจับสลากเจอกันหมด)
       </div>
       {renderTable(upper, "สายบน (Upper Bracket Qualifiers)", "bg-emerald-500", "SEED")}
       {renderTable(lower, "สายล่าง (Lower Bracket Qualifiers)", "bg-amber-500", "LOWER")}
    </div>
  );
}

// --- Main Page Component ---

export default function PublicKnockoutBracket() {
  const [handLevel, setHandLevel] = useState(HAND_LEVEL_OPTIONS[0].value);
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("list"); 

  const fetchData = async () => {
    setLoading(true);
    try {
      const [matchesRes, standingsRes] = await Promise.all([
         API.listSchedule({
            handLevel,
            // ✅ แก้ไข: เรียกเอาเฉพาะ knockout เท่านั้น เพื่อกันพวก Group หลุดมา
            roundType: "knockout", 
            pageSize: 200,
            sort: "matchNo",
         }),
         API.getStandings(handLevel)
      ]);

      // Double check filter: กรองอีกรอบเพื่อความชัวร์
      const onlyKnockout = (matchesRes.items || []).filter(m => 
          m.roundType === 'knockout' && 
          !m.round?.toLowerCase().includes('group') // กันเหนียว: ชื่อรอบต้องไม่เป็น Group
      );

      setMatches(onlyKnockout);
      setStandings(standingsRes || { groups: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [handLevel]);

  // Process Knockout Data
  const bracketData = useMemo(() => {
    if (!matches.length) return [];
    
    const roundsMap = {};
    matches.forEach((m) => {
      // ✅ ถ้าเจอ round ที่เป็น Group ให้ข้ามไปเลย (จริงๆ filter ตั้งแต่ fetch แล้วแต่กันเหนียว)
      if (m.round?.toLowerCase().includes("group")) return;

      const rCode = m.round || "Unknown";
      if (!roundsMap[rCode]) {
        roundsMap[rCode] = { code: rCode, top: [], bottom: [], unknown: [] };
      }
      const side = m.bracketSide?.toUpperCase();
      if (side === "TOP") roundsMap[rCode].top.push(m);
      else if (side === "BOTTOM") roundsMap[rCode].bottom.push(m);
      else roundsMap[rCode].unknown.push(m);
    });

    let sortedRounds = Object.values(roundsMap).sort((a, b) => {
      const pA = ROUND_PRIORITY[a.code] || 99;
      const pB = ROUND_PRIORITY[b.code] || 99;
      return pA - pB;
    });

    if (viewMode === "tree") {
        sortedRounds = fillBracketStructure(sortedRounds);
    }

    return sortedRounds;
  }, [matches, viewMode]);

  const seedingData = useMemo(() => {
    if (!standings || !standings.groups || standings.groups.length === 0) return null;

    let allTeams = [];
    standings.groups.forEach(g => {
        const teamsInGroup = [...g.teams].sort((a, b) => compareInGroup(a, b));
        teamsInGroup.forEach((t, idx) => {
            allTeams.push({ 
                ...t, 
                group: g.groupName, 
                groupRank: idx + 1,
                teamName: teamName(t)
            });
        });
    });

    const is24Teams = CATEGORIES_24_TEAMS.includes(handLevel);
    let upper = [];
    let lower = [];

    if (is24Teams) {
        const rank1s = allTeams.filter(t => t.groupRank === 1);
        const rank2s = allTeams.filter(t => t.groupRank === 2);
        const rank3s = allTeams.filter(t => t.groupRank === 3);
        const rank4s = allTeams.filter(t => t.groupRank === 4);

        rank3s.sort((a, b) => compareStatsOnly(a, b));
        const best3rd = rank3s.slice(0, 4);
        const remaining3rd = rank3s.slice(4);

        upper = [...rank1s, ...rank2s, ...best3rd];
        lower = [...remaining3rd, ...rank4s];
    } else {
        upper = allTeams.filter(t => t.groupRank <= 2);
        lower = allTeams.filter(t => t.groupRank >= 3);
    }

    upper.sort((a, b) => compareStatsOnly(a, b));
    lower.sort((a, b) => compareStatsOnly(a, b));

    return { upper, lower };
  }, [standings, handLevel]);

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Compact Version */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-indigo-800 shrink-0">
            สายการแข่งขัน (Knockout)
          </h1>

          <div className="flex gap-2 w-full md:w-auto">
             <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm shrink-0">
                <button 
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <span className="hidden sm:inline">📜</span> รายการ
                </button>
                <button 
                  onClick={() => setViewMode("tree")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${viewMode === 'tree' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <span className="hidden sm:inline">🌳</span> แผนผัง
                </button>
                <button 
                  onClick={() => setViewMode("seeding")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${viewMode === 'seeding' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <span className="hidden sm:inline">📊</span> อันดับวางสาย
                </button>
             </div>

             <div className="relative flex-grow md:flex-grow-0">
                <select
                  className="w-full md:w-48 appearance-none rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  value={handLevel}
                  onChange={(e) => setHandLevel(e.target.value)}
                >
                  {HAND_LEVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      รุ่น {opt.labelShort || opt.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-indigo-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                </div>
             </div>
          </div>
        </div>

        {loading && matches.length === 0 && (
           <div className="text-center py-10 text-slate-400 text-sm">กำลังโหลดข้อมูล...</div>
        )}

        {!loading && matches.length === 0 && viewMode !== "seeding" && (
          <div className="rounded-xl bg-white border border-dashed border-slate-300 p-8 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="text-slate-900 font-semibold text-sm">ยังไม่มีข้อมูลสายแข่ง</h3>
          </div>
        )}

        {!loading && (
          <>
            {viewMode === "list" && matches.length > 0 && <BracketListView groupedData={bracketData} />}
            
            {viewMode === "tree" && matches.length > 0 && (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                <div className="text-center text-[10px] text-slate-400 md:hidden mb-1">
                  (เลื่อนซ้าย-ขวา เพื่อดูแผนผังทั้งหมด)
                </div>
                <BracketTreeView roundsData={bracketData} title="สายบน (Upper Bracket)" colorClass="bg-emerald-500" />
                <BracketTreeView roundsData={bracketData} title="สายล่าง (Lower Bracket)" colorClass="bg-amber-500" />
              </div>
            )}

            {viewMode === "seeding" && <SeedingTableView seedingData={seedingData} />}
          </>
        )}

      </div>
    </div>
  );
}