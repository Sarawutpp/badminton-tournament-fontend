import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useTournament } from "@/contexts/TournamentContext";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/2674/2674067.png";
const BACKEND_URL = "http://localhost:5000";

// --- BACKGROUND PATTERN: ลายเส้นไก่ (Chicken Doodle SVG) ---
const CHICKEN_PATTERN = `data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4c5b4' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E`;

export default function HallOfFame() {
  const { selectedTournament } = useTournament();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    if (!selectedTournament?._id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/tournaments/${selectedTournament._id}/hall-of-fame`);
        setData(res.data || {});
        const levels = Object.keys(res.data || {});
        if (levels.length > 0) setActiveTab((prev) => (levels.includes(prev) ? prev : levels[0]));
      } catch (err) {
        console.error("Failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedTournament?._id]);

  const currentData = useMemo(() => {
    if (!activeTab || !data[activeTab]) return { upper: [], lower: [] };
    return data[activeTab];
  }, [data, activeTab]);

  const availableLevels = useMemo(() => Object.keys(data).sort(), [data]);

  const getTeamPhoto = (url) => {
    if (!url) return DEFAULT_AVATAR;
    if (url.startsWith("http")) return url;
    return `${BACKEND_URL}${url}`;
  };

  if (loading) return <LoadingScreen />;
  if (!loading && availableLevels.length === 0) return <EmptyScreen />;

  return (
    <div className="min-h-screen bg-[#FFFBF2] text-slate-800 selection:bg-orange-200 selection:text-orange-900 overflow-hidden relative font-cute">
      
      {/* 1. Background Pattern */}
      <div 
        className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none opacity-60"
        style={{ backgroundImage: `url("${CHICKEN_PATTERN}")`, backgroundSize: '60px 60px' }}
      ></div>
      
      {/* 2. Abstract Warm Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 mix-blend-multiply">
         <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-yellow-200/40 rounded-full blur-[120px]"></div>
         <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-orange-200/40 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-0 left-[20%] w-[60%] h-[40%] bg-red-100/40 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-20">
        
        {/* --- HEADER --- */}
        <header className="py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-orange-300 blur-md opacity-50 group-hover:animate-pulse rounded-full"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-200 rounded-full flex items-center justify-center text-4xl shadow-sm border-4 border-white transform -rotate-6 group-hover:rotate-0 transition-transform cursor-pointer">
                🐣
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-800 drop-shadow-sm">
                ทำเนียบไก่ 2025
              </h1>
              <p className="text-sm text-orange-600 font-bold tracking-widest uppercase">
                {selectedTournament?.name || "The Coop Championship"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             {/* CHANGE 1: ลบปุ่ม Admin ออกไปแล้ว */}

             {/* Tab Selection */}
             {availableLevels.length > 0 && (
                <div className="flex gap-2 p-1 bg-white/60 backdrop-blur-sm rounded-full border border-orange-100/50 shadow-sm">
                  {availableLevels.map(level => (
                    <button
                      key={level}
                      onClick={() => setActiveTab(level)}
                      className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                        activeTab === level 
                        ? "bg-gradient-to-r from-orange-400 to-yellow-500 text-white shadow-md shadow-orange-200 scale-105" 
                        : "text-slate-500 hover:text-orange-600 hover:bg-orange-50"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
             )}
          </div>
        </header>

        {/* --- MAIN CONTENT --- */}
        <div className="mt-8 space-y-24">
          <PodiumSection 
            title="Super Chicken Of Year" 
            subtitle="ไก่หัดเดิน · สายบน"
            teams={currentData.upper} 
            getTeamPhoto={getTeamPhoto}
            theme="gold"
          />

          {currentData.lower && currentData.lower.length > 0 && (
             <PodiumSection 
                title="RISING CHICKS" 
                subtitle="ไก่หัดเดิน · สายล่าง"
                teams={currentData.lower} 
                getTeamPhoto={getTeamPhoto}
                theme="silver"
             />
          )}
        </div>
      </div>
    </div>
  );
}

// --- PODIUM LAYOUT ---
function PodiumSection({ title, subtitle, teams, getTeamPhoto, theme }) {
  if (!teams || teams.length === 0) return null;

  const champion = teams.find(t => t.rank === 1);
  const runnerUp = teams.find(t => t.rank === 2);
  const semiFinalists = teams.filter(t => t.rank === 3);

  const isGold = theme === "gold";
  
  const gradientTitle = isGold 
    ? "from-orange-600 via-yellow-500 to-orange-400"  
    : "from-slate-600 via-slate-400 to-slate-500";
    
  const accentColor = isGold ? "text-orange-500" : "text-slate-400";
  const lineColor = isGold ? "bg-orange-300" : "bg-slate-300";

  return (
    <div className="relative">
      <div className="text-center mb-16 relative z-0">
         <h2 className={`text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b ${gradientTitle} drop-shadow-[0_2px_2px_rgba(255,255,255,1)]`}>
            {title}
         </h2>
         <div className="flex items-center justify-center gap-4 mt-2">
            <div className={`h-[3px] rounded-full w-12 ${lineColor}`}></div>
            <span className={`text-sm font-bold tracking-[0.1em] uppercase ${accentColor}`}>{subtitle}</span>
            <div className={`h-[3px] rounded-full w-12 ${lineColor}`}></div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-5xl mx-auto relative z-10">
        
        {/* RUNNER UP (Left/2nd) */}
        <div className="order-2 md:order-1 flex flex-col items-center md:mb-12">
            {runnerUp && (
               <TeamCard 
                  rank={2} 
                  data={runnerUp} 
                  getTeamPhoto={getTeamPhoto} 
                  theme={theme}
                  delay="delay-100"
               />
            )}
        </div>

        {/* CHAMPION (Center/1st) */}
        <div className="order-1 md:order-2 flex flex-col items-center -mt-4 md:-mt-16 z-20">
            {champion && (
               <TeamCard 
                  rank={1} 
                  data={champion} 
                  getTeamPhoto={getTeamPhoto} 
                  theme={theme}
                  isChampion={true}
               />
            )}
        </div>

        {/* SEMI FINALISTS (Right/3rd) */}
        <div className="order-3 flex flex-col gap-5 w-full z-10 md:mb-12">
           {semiFinalists.map((team, idx) => (
              <TeamCard 
                 key={idx}
                 rank={3} 
                 data={team} 
                 getTeamPhoto={getTeamPhoto} 
                 theme={theme}
                 delay={`delay-${(idx+2)*100}`}
                 isCompact
              />
           ))}
        </div>
      </div>
    </div>
  );
}

// --- TEAM CARD ---
function TeamCard({ rank, data, getTeamPhoto, theme, isChampion = false, isCompact = false, delay = "" }) {
   
   const rankConfig = {
      1: { 
         label: "1st", icon: "👑", 
         containerBorder: "border-yellow-400", containerShadow: "shadow-[0_10px_40px_rgba(250,204,21,0.25)]",
         badgeColor: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-orange-200",
         ringColor: "border-yellow-400",
         BgNumberColor: "text-yellow-600"
      },
      2: { 
         label: "2nd", icon: "🥈", 
         containerBorder: "border-slate-300", containerShadow: "shadow-[0_8px_30px_rgba(148,163,184,0.3)]",
         badgeColor: "bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-slate-300",
         ringColor: "border-slate-300",
         BgNumberColor: "text-slate-500"
      },
      3: { 
         label: "3rd", icon: "🥉", 
         containerBorder: "border-orange-200", containerShadow: "shadow-[0_4px_20px_rgba(251,146,60,0.15)]", 
         badgeColor: "bg-gradient-to-r from-orange-400 to-amber-600 text-white shadow-orange-200",
         ringColor: "border-orange-300",
         BgNumberColor: "text-orange-400"
      },
   }[rank];

   // --- Compact Card (แก้ไขเรื่องชื่อตก) ---
   if (isCompact) {
      return (
         <div className={`w-full bg-white rounded-2xl p-4 flex items-center gap-4 hover:scale-105 transition-all duration-300 cursor-default group animate-in slide-in-from-bottom-4 
            border-2 ${rankConfig.containerBorder} ${rankConfig.containerShadow} hover:shadow-lg hover:border-orange-400 relative overflow-hidden ${delay}`}>
            
            {/* เลขพื้นหลัง */}
            <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-5xl font-bold ${rankConfig.BgNumberColor} opacity-[0.12] pointer-events-none select-none`}>
               #{rank}
            </div>

            <div className={`w-16 h-16 rounded-full p-1 bg-gradient-to-br from-orange-100 to-white shrink-0 shadow-sm border ${rankConfig.ringColor} relative z-10`}>
               <img src={getTeamPhoto(data.teamPhotoUrl)} className="w-full h-full object-cover rounded-full" alt="" onError={(e) => e.target.src = DEFAULT_AVATAR}/>
            </div>
            
            <div className="min-w-0 flex-1 relative z-10">
               {/* CHANGE 2: ปรับ text-lg เป็น text-base และใช้ line-clamp-2 แทน truncate */}
               <div className="text-slate-800 text-base font-bold line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors">{data.teamName}</div>
               <div className="text-sm text-slate-500 font-bold truncate">{data.players.join(" / ")}</div>
            </div>
            
            <div className="ml-2 text-2xl opacity-90 group-hover:scale-125 transition-transform duration-300 drop-shadow-sm relative z-10 shrink-0">{rankConfig.icon}</div>
         </div>
      );
   }

   // --- Standard Card ---
   return (
      <div className={`relative group perspective w-full max-w-sm animate-in zoom-in-90 duration-700 ${delay}`}>
         
         {isChampion && (
            <div className="absolute inset-0 bg-gradient-to-t from-yellow-300 via-orange-300 to-white blur-[50px] opacity-60 group-hover:opacity-80 transition-opacity -z-10 scale-110"></div>
         )}

         <div className={`relative bg-white border-[3px] ${rankConfig.containerBorder} rounded-[2rem] p-6 ${rankConfig.containerShadow} overflow-hidden transition-transform duration-500 hover:-translate-y-2`}>
            
            <div className={`absolute -top-12 -right-8 pointer-events-none select-none opacity-[0.15] ${rankConfig.BgNumberColor} transition-all duration-500 group-hover:scale-110 group-hover:opacity-[0.2]`}>
               <div className="text-[12rem] leading-none font-bold tracking-tighter">#{rank}</div>
            </div>

            <div className="relative w-full mb-6 flex justify-center z-10">
               <div className={`relative aspect-square mx-auto flex-shrink-0 ${isChampion ? 'w-[70%] max-w-[280px]' : 'w-[50%] max-w-[180px]'}`}>
                  <div className={`absolute inset-0 rounded-full border-2 border-dashed ${rankConfig.ringColor} opacity-70 ${isChampion ? 'animate-spin-slow' : ''}`}></div>
                  <div className={`w-full h-full rounded-full overflow-hidden border-[4px] ${rankConfig.ringColor} shadow-inner relative z-10 bg-white`}>
                     <img 
                        src={getTeamPhoto(data.teamPhotoUrl)} 
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" 
                        alt="Team" 
                        onError={(e) => e.target.src = DEFAULT_AVATAR}
                     />
                  </div>
                  <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 ${rankConfig.badgeColor} px-4 py-1 rounded-full text-xs font-bold shadow-md z-20 whitespace-nowrap border-[3px] border-white flex items-center gap-1`}>
                     <span>{rankConfig.icon}</span>
                     <span>{rankConfig.label} Place</span>
                  </div>
               </div>
            </div>

            <div className="text-center relative z-10">
               <h3 className={`${isChampion ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'} font-bold text-slate-800 mb-2 tracking-tight drop-shadow-sm`}>
                  {data.teamName}
               </h3>
               <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {data.players.map((p, i) => (
                     <span key={i} className={`px-3 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200 shadow-sm`}>
                        {p}
                     </span>
                  ))}
               </div>
               {isChampion && (
                  <button className="mt-6 text-sm font-bold text-white bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 px-8 py-3 rounded-full transition-all shadow-md hover:shadow-lg shadow-orange-200 transform hover:scale-105 active:scale-95">
                     VIEW FULL STATS 
                  </button>
               )}
            </div>
         </div>
      </div>
   );
}

function LoadingScreen() {
   return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFBF2] text-slate-800 font-cute">
         <div className="relative w-16 h-16 animate-bounce">
            <div className="text-6xl">🐣</div>
         </div>
         <p className="mt-4 text-orange-600 font-bold animate-pulse">Hatching Results...</p>
      </div>
   );
}

function EmptyScreen() {
   return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFBF2] text-slate-400 p-6 text-center font-cute">
         <div className="text-8xl mb-6 opacity-40">🐔</div>
         <h2 className="text-2xl font-bold text-slate-800">No Champions Yet</h2>
         <p className="mt-2 max-w-md text-slate-500">The battle is still ongoing. Winners will be immortalized here soon.</p>
      </div>
   );
}