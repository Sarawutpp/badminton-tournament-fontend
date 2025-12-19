// src/pages/public/Standings.jsx
// ตารางคะแนน (Standings) ปรับปรุงให้รองรับ Dynamic Categories

import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { API, teamName } from "@/lib/api.js";
import { useTournament } from "@/contexts/TournamentContext"; // ✅ 1. Import Context

// ======= Helpers และ Hooks ย่อย =======
const useIsMobile = () => {
  const get = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches;

  const [isMobile, setIsMobile] = useState(get());

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const listener = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", listener);
    else mq.addListener(listener);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", listener);
      else mq.removeListener(listener);
    };
  }, []);

  return isMobile;
};

const normalizeName = (player) => {
  if (!player) return "";
  if (typeof player === "string") return player;
  return player.nickname || player.fullName || "";
};

const normalizeTeam = (team) => ({
  _id: team._id || team.id || "",
  idCode: team.idCode || team.teamCode || "",
  teamName: team.teamName || "-",
  playerNames:
    [normalizeName(team.players?.[0]), normalizeName(team.players?.[1])]
      .filter(Boolean)
      .join("/") || "-",
  players: Array.isArray(team.players)
    ? team.players.map((p) => normalizeName(p) || "-")
    : ["-", "-"],
  matchesPlayed: team.matchesPlayed ?? 0,
  wins: team.wins ?? 0,
  draws: team.draws ?? 0,
  losses: team.losses ?? 0,
  points: team.points ?? 0,
  scoreFor: team.scoreFor ?? 0,
  scoreAgainst: team.scoreAgainst ?? 0,
  scoreDiff: team.scoreDiff ?? (team.scoreFor ?? 0) - (team.scoreAgainst ?? 0),
  setsFor: team.setsFor ?? 0,
  setsAgainst: team.setsAgainst ?? 0,
  setsDiff: team.setsDiff ?? (team.setsFor ?? 0) - (team.setsAgainst ?? 0),
  matchScores: Array.isArray(team.matchScores) ? team.matchScores : [],
  manualRank: team.manualRank ?? 0, // รับค่า manualRank มาด้วย
});

const normalizeGroups = (raw, level) => {
  if (!raw || !Array.isArray(raw.groups)) {
    return { level, groups: [] };
  }
  return {
    level: raw.level || level,
    groups: raw.groups.map((g) => ({
      groupName: g.groupName || g.name || "-",
      teams: Array.isArray(g.teams) ? g.teams.map(normalizeTeam) : [],
    })),
  };
};

async function fetchLevelData(level) {
  const res = await API.getStandings(level);
  return normalizeGroups(res, level);
}

// ======= Component: Pop-up ประวัติการแข่ง (Team History) =======
const TeamHistoryModal = ({ team, groupName, handLevel, onClose }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        // ใช้ listSchedule เพื่อดึงแมตช์ของทีมนี้
        const res = await API.listSchedule({
          handLevel: handLevel,
          // group: groupName, // ตัด group ออก เผื่อทีมนี้ไปแข่งข้ามสาย หรือเป็นรอบ KO
          pageSize: 200,
          status: "finished",
        });
        
        const allMatches = res.items || [];
        
        // กรองหาแมตช์ของทีมนี้ (ทั้ง team1 และ team2)
        const myMatches = allMatches.filter(m => 
          (m.team1?._id === team._id || m.team1 === team._id) || 
          (m.team2?._id === team._id || m.team2 === team._id)
        );

        setMatches(myMatches);
      } catch (error) {
        console.error("Failed to load matches", error);
      } finally {
        setLoading(false);
      }
    };

    if (team) {
      fetchMatches();
    }
  }, [team, groupName, handLevel]);

  if (!team) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-indigo-600 p-4 text-white flex justify-between items-start shrink-0">
          <div>
            <div className="text-indigo-200 text-xs mb-1 font-medium tracking-wide uppercase">ประวัติการแข่งขัน</div>
            <h3 className="text-lg font-bold leading-tight line-clamp-1 pr-2">{team.teamName}</h3>
            <p className="text-xs text-indigo-100 mt-1 opacity-90 truncate max-w-[250px]">{team.playerNames}</p>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 rounded-full w-8 h-8 flex items-center justify-center transition shrink-0">
             <span className="text-xl font-bold leading-none mb-1">&times;</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 bg-slate-50 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
                <span className="text-xs">กำลังโหลดข้อมูล...</span>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center text-slate-400 py-10 text-sm">ยังไม่มีข้อมูลการแข่งที่จบแล้ว</div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => {
                const isTeam1 = (match.team1?._id === team._id || match.team1 === team._id);
                const opponent = isTeam1 ? match.team2 : match.team1;
                
                // คะแนนรวม
                const myScore = isTeam1 ? match.score1 : match.score2;
                const oppScore = isTeam1 ? match.score2 : match.score1;
                
                // ผลแพ้ชนะ (ใช้ winner field ถ้ามี หรือดูคะแนน)
                let isWin = false;
                let isDraw = false;

                if (match.winner) {
                    isWin = (isTeam1 && match.winner === match.team1?._id) || 
                            (!isTeam1 && match.winner === match.team2?._id);
                } else {
                    // Fallback ถ้าไม่มี winner field (เสมอ)
                    isWin = myScore > oppScore;
                    isDraw = myScore === oppScore;
                }

                // --- LOGIC ดึงคะแนนรายเซต ---
                const sets = [];
                const p = (v) => parseInt(v || 0, 10);

                if (Array.isArray(match.sets) && match.sets.length > 0) {
                     match.sets.forEach((s, i) => {
                        if (s.t1 > 0 || s.t2 > 0) {
                            sets.push({ label: `${i+1}`, t1: s.t1, t2: s.t2 });
                        }
                     });
                } else {
                    // Legacy Support
                    if (p(match.set1Score1) + p(match.set1Score2) > 0) sets.push({ label: "1", t1: match.set1Score1, t2: match.set1Score2 });
                    if (p(match.set2Score1) + p(match.set2Score2) > 0) sets.push({ label: "2", t1: match.set2Score1, t2: match.set2Score2 });
                    if (p(match.set3Score1) + p(match.set3Score2) > 0) sets.push({ label: "3", t1: match.set3Score1, t2: match.set3Score2 });
                }

                return (
                  <div key={match._id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-row items-stretch gap-3">
                    {/* Status Strip */}
                    <div className={`w-1.5 rounded-full self-stretch ${isWin ? "bg-emerald-500" : isDraw ? "bg-slate-400" : "bg-rose-500"}`}></div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div className="flex justify-between items-start mb-2">
                         <div className="flex-1 min-w-0 pr-2">
                             <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">VS คู่แข่ง</div>
                             <div className="font-bold text-slate-800 text-sm leading-tight truncate">
                                {teamName(opponent)}
                             </div>
                         </div>
                         <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                             isWin ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                             isDraw ? "bg-slate-50 text-slate-600 border-slate-200" : 
                             "bg-rose-50 text-rose-700 border-rose-100"
                         }`}>
                             {isWin ? "WIN" : isDraw ? "DRAW" : "LOSE"}
                         </div>
                      </div>
                      
                      {/* Sets Detail */}
                      <div className="space-y-1 border-t border-slate-100 pt-2 mt-auto">
                        {sets.length > 0 ? sets.map((s, idx) => {
                             const mySet = isTeam1 ? s.t1 : s.t2;
                             const oppSet = isTeam1 ? s.t2 : s.t1;
                             const iWonSet = mySet > oppSet;
                             return (
                               <div key={idx} className="flex justify-between items-center text-xs">
                                  <span className="text-slate-400 font-medium">Set {s.label}</span>
                                  <div className="flex items-center gap-1 font-mono">
                                     <span className={iWonSet ? "font-bold text-slate-800" : "text-slate-500"}>{mySet}</span>
                                     <span className="text-slate-300">-</span>
                                     <span className={!iWonSet ? "font-bold text-slate-800" : "text-slate-500"}>{oppSet}</span>
                                  </div>
                               </div>
                             );
                        }) : (
                             <div className="text-[10px] text-slate-300 italic text-center py-1">ไม่มีรายละเอียดเซต</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-3 bg-white border-t shrink-0">
            <button onClick={onClose} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition text-sm">
                ปิดหน้าต่าง
            </button>
        </div>
      </div>
    </div>
  );
};

// ======= Component หลัก =======

const StandingsPage = () => {
  const { selectedTournament } = useTournament(); // ✅ 2. ดึงข้อมูลทัวร์นาเมนต์
  
  const [active, setActive] = useState(null); // เก็บ object { value, label }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [groupsData, setGroupsData] = useState({ level: "", groups: [] });

  // State สำหรับ Modal
  const [selectedTeamData, setSelectedTeamData] = useState(null); 
  const [recalculating, setRecalculating] = useState(false);
  const [clearing, setClearing] = useState(false);

  const isMobile = useIsMobile();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  // ✅ 3. สร้าง Level Choices แบบ Dynamic
  const levelChoices = useMemo(() => {
    const cats = selectedTournament?.settings?.categories || [];
    if (cats.length > 0) {
      return cats.map((c) => ({ value: c, label: c }));
    }
    return []; 
  }, [selectedTournament]);

  // ✅ 4. Set Active Default ตัวแรกสุด
  useEffect(() => {
    if (levelChoices.length > 0 && !active) {
       setActive(levelChoices[0]);
    }
  }, [levelChoices, active]);

  // Load Data เมื่อ active เปลี่ยน
  useEffect(() => {
    const load = async () => {
      if (!active?.value) return;
      setLoading(true);
      setError("");
      try {
        const normalized = await fetchLevelData(active.value);
        setGroupsData(normalized);
      } catch (e) {
        setGroupsData({ level: active.value, groups: [] });
        setError(e.message || "ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [active?.value]);

  // Admin: Recalculate
  const handleRecalculate = async () => {
    if (!isAdminRoute || !active?.value) return;

    if(!window.confirm(`ยืนยัน "คำนวณคะแนนใหม่" รุ่น ${active.label}?\nระบบจะไล่นับคะแนนจากแมตช์ทั้งหมดใหม่`)) return;

    setRecalculating(true);
    setError("");
    try {
      await API.recalculateStandings({
        handLevel: active.value,
        tournamentId: selectedTournament._id || "default", // ส่ง ID ทัวร์ไปด้วย
      });

      // Reload
      const normalized = await fetchLevelData(active.value);
      setGroupsData(normalized);
      alert("คำนวณคะแนนใหม่เรียบร้อย ✅");
    } catch (e) {
      setError(e.message || "Error recalculating");
    } finally {
      setRecalculating(false);
    }
  };

  // Admin: Clear
  const handleClear = async () => {
    if (!isAdminRoute || !active?.value) return;
    
    if(!window.confirm(`⚠️ อันตราย: ยืนยันล้างคะแนนรุ่น ${active.label}?\nคะแนนจะหายหมด!`)) return;

    setClearing(true);
    try {
      await API.clearStandings({ 
        handLevel: active.value,
        tournamentId: selectedTournament._id,
        resetMatches: true 
      });
      
      const normalized = await fetchLevelData(active.value);
      setGroupsData(normalized);
      alert("ล้างข้อมูลเรียบร้อย");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setClearing(false);
    }
  };

  const groups = groupsData.groups || [];

  if (!active && levelChoices.length === 0) {
      return <div className="p-8 text-center text-slate-400">ยังไม่ได้กำหนดประเภทการแข่งขัน (Categories) ในทัวร์นาเมนต์นี้</div>;
  }

  return (
    <>
      <div className="p-3 md:p-6 space-y-5 pb-20">
        
        {/* Header Section */}
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
               <span>📊</span> ตารางคะแนน
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              คลิกที่การ์ดทีม (ในมือถือ) เพื่อดูประวัติการแข่งขันย้อนหลัง
            </p>
          </div>
          
          {/* Level Selector */}
          <div className="overflow-x-auto pb-1 -mx-3 px-3 md:mx-0 md:px-0 md:pb-0">
             <div className="flex gap-1.5 md:gap-2">
                {levelChoices.map((opt) => (
                    <button
                    key={opt.value}
                    onClick={() => setActive(opt)}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                        active?.value === opt.value
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                    >
                    {opt.label}
                    </button>
                ))}
             </div>
          </div>
        </header>
        
        {/* Admin Actions Bar */}
        {isAdminRoute && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap gap-3 items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admin Tools</span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleRecalculate}
                        disabled={loading || recalculating}
                        className="px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold hover:bg-indigo-200 disabled:opacity-50 transition-colors"
                    >
                        {recalculating ? "⏳ กำลังคำนวณ..." : "🔄 Re-sync คะแนน"}
                    </button>
                    <button
                        type="button"
                        onClick={handleClear}
                        disabled={loading || clearing}
                        className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 disabled:opacity-50 transition-colors"
                    >
                        {clearing ? "..." : "🗑️ ล้างคะแนน"}
                    </button>
                </div>
            </div>
        )}

        {/* Content */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
             <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 mb-3"></div>
             <span>กำลังโหลดข้อมูล...</span>
          </div>
        )}
        
        {!loading && error && (
          <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-center text-rose-600 text-sm">
             ⚠️ {error}
          </div>
        )}

        {!loading && !error && groups.length === 0 && (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
             <div className="text-4xl mb-2 opacity-50">📭</div>
             <div className="text-slate-500 font-medium">ยังไม่มีข้อมูลกลุ่มในระดับมือนี้</div>
             <div className="text-slate-400 text-xs mt-1">ต้องทำการ Generate Group หรือสร้างสายแข่งก่อน</div>
          </div>
        )}

        {!loading &&
          !error &&
          groups.map((group) => (
            <GroupSection
              key={group.groupName}
              group={group}
              isMobile={isMobile}
              isAdminRoute={isAdminRoute}
              onSelectTeam={(team) => setSelectedTeamData({ team, groupName: group.groupName })}
            />
          ))}
      </div>

      {/* Team History Modal */}
      {selectedTeamData && active && (
        <TeamHistoryModal 
           team={selectedTeamData.team} 
           groupName={selectedTeamData.groupName}
           handLevel={active.value}
           onClose={() => setSelectedTeamData(null)}
        />
      )}
    </>
  );
};

// ======= Sub-Components: Group Section & Table =======

const GroupSection = ({ group, isMobile, isAdminRoute, onSelectTeam }) => (
  <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-sm shadow-indigo-200">
          {group.groupName || "?"}
        </div>
        <div>
          <div className="font-bold text-slate-800 text-sm">
            กลุ่ม {group.groupName || "-"}
          </div>
          <div className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
            {group.teams?.length || 0} ทีม
          </div>
        </div>
      </div>
    </div>

    {isMobile ? (
      <CardsMobile group={group} isAdminRoute={isAdminRoute} onSelectTeam={onSelectTeam} />
    ) : (
      <TableDesktop group={group} isAdminRoute={isAdminRoute} />
    )}
  </section>
);

const TableDesktop = ({ group, isAdminRoute }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs md:text-sm text-left">
      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
        <tr>
          <th className="px-4 py-3 text-center w-14">#</th>
          <th className="px-4 py-3 text-left">ทีม</th>
          <th className="px-2 py-3 text-center w-16 bg-slate-50/50">แข่ง</th>
          <th className="px-2 py-3 text-center w-16 bg-emerald-50/50 text-emerald-700">ชนะ</th>
          <th className="px-2 py-3 text-center w-16 bg-rose-50/50 text-rose-700">แพ้</th>
          <th className="px-2 py-3 text-center w-20 bg-indigo-50 text-indigo-700 border-x border-indigo-100">คะแนน</th>
          <th className="px-2 py-3 text-center w-16 text-slate-400 font-normal">แต้มได้</th>
          <th className="px-2 py-3 text-center w-16 text-slate-400 font-normal">แต้มเสีย</th>
          <th className="px-2 py-3 text-center w-16 font-bold text-slate-600">ผลต่าง</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {group.teams.map((team, index) => {
          const scoreDiff = team.scoreDiff ?? (team.scoreFor ?? 0) - (team.scoreAgainst ?? 0);
          return (
            <tr
              key={team._id || `${team.teamName}-${index}`}
              className="hover:bg-indigo-50/30 transition-colors group"
            >
              <td className="px-4 py-3 text-center font-bold text-slate-400 group-hover:text-indigo-500">
                {index + 1}
              </td>
              <td className="px-4 py-3">
                 <div className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">
                    {team.teamName}
                 </div>
                 <div className="text-xs text-slate-500 mt-0.5 flex gap-2">
                    <span className="bg-slate-100 px-1.5 rounded text-[10px]">{team.idCode}</span>
                    <span className="truncate max-w-[150px]">{team.playerNames}</span>
                 </div>
              </td>
              <td className="px-2 py-3 text-center font-medium bg-slate-50/30">{team.matchesPlayed}</td>
              <td className="px-2 py-3 text-center font-bold text-emerald-600 bg-emerald-50/30">{team.wins}</td>
              <td className="px-2 py-3 text-center font-medium text-rose-500 bg-rose-50/30">{team.losses}</td>
              <td className="px-2 py-3 text-center font-bold text-indigo-700 text-base bg-indigo-50/50 border-x border-indigo-100/50">
                {team.points}
              </td>
              <td className="px-2 py-3 text-center text-slate-500 text-xs">{team.scoreFor}</td>
              <td className="px-2 py-3 text-center text-slate-500 text-xs">{team.scoreAgainst}</td>
              <td className={`px-2 py-3 text-center font-bold ${scoreDiff > 0 ? "text-emerald-600" : scoreDiff < 0 ? "text-rose-500" : "text-slate-400"}`}>
                {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const CardsMobile = ({ group, isAdminRoute, onSelectTeam }) => (
  <div className="space-y-3 p-3 bg-slate-50/50">
    {group.teams.map((team, index) => {
      const scoreDiff = team.scoreDiff ?? (team.scoreFor ?? 0) - (team.scoreAgainst ?? 0);
      return (
        <article
          key={team._id || `${team.teamName}-${index}`}
          onClick={() => onSelectTeam && onSelectTeam(team)}
          className="border border-slate-200 rounded-xl bg-white p-3 shadow-sm active:scale-[0.98] transition-transform relative overflow-hidden"
        >
          {/* Rank Badge */}
          <div className="absolute top-0 right-0 bg-slate-100 text-slate-400 text-[10px] font-bold px-2 py-1 rounded-bl-lg border-b border-l border-slate-100">
             RANK #{index + 1}
          </div>

          <div className="flex gap-3 mb-3">
             {/* Avatar / Icon */}
             <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100 shrink-0">
                {team.teamName.substring(0, 2).toUpperCase()}
             </div>
             <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900 text-sm truncate pr-8">{team.teamName}</div>
                <div className="text-xs text-slate-500 truncate">{team.playerNames}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono bg-slate-50 inline-block px-1 rounded">{team.idCode}</div>
             </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2 border-t border-slate-50 pt-3">
             <StatBox label="แข่ง" value={team.matchesPlayed} />
             <StatBox label="ชนะ" value={team.wins} color="text-emerald-600" bg="bg-emerald-50" />
             <StatBox label="แพ้" value={team.losses} color="text-rose-600" bg="bg-rose-50" />
             <StatBox label="คะแนน" value={team.points} color="text-indigo-700" bg="bg-indigo-50" isBold />
          </div>
          
          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-50 border-dashed">
             <div className="text-center text-[10px] text-slate-400">
                ได้ <span className="text-slate-600 font-medium ml-1">{team.scoreFor}</span>
             </div>
             <div className="text-center text-[10px] text-slate-400">
                เสีย <span className="text-slate-600 font-medium ml-1">{team.scoreAgainst}</span>
             </div>
             <div className={`text-center text-[10px] font-bold ${scoreDiff > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {scoreDiff > 0 ? "+" : ""}{scoreDiff}
             </div>
          </div>
        </article>
      );
    })}
  </div>
);

const StatBox = ({ label, value, color = "text-slate-700", bg = "bg-slate-50", isBold = false }) => (
  <div className={`flex flex-col items-center justify-center rounded-lg py-1.5 ${bg}`}>
     <span className={`text-sm md:text-base ${color} ${isBold ? 'font-bold' : 'font-semibold'}`}>{value}</span>
     <span className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">{label}</span>
  </div>
);

export default StandingsPage;