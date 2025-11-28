// src/components/print/CompactScoreSheet.jsx
import React from "react";
import { teamName } from "@/lib/api"; 

const WATERMARK_SRC = "/moodeng.png";

export default function CompactScoreSheet({ match }) {
  if (!match) return null;

  // Helper ดึงรายชื่อนักกีฬา (เพิ่มการเช็คว่า p เป็น object หรือไม่)
  const playerList = (team) => {
    if (!team?.players || team.players.length === 0) return "-";
    
    // ตรวจสอบว่า backend ส่งมาเป็น object ที่มีชื่อหรือไม่
    // ถ้ายังไม่ได้แก้ backend ค่า p จะเป็น string (id) ทำให้แสดงผลไม่ได้
    return team.players
      .map(p => {
        if (typeof p === 'string') return ""; // ถ้ายังเป็น ID ให้แสดงว่างไว้ก่อน
        return p.nickname || p.fullName;
      })
      .filter(Boolean)
      .join(" / ");
  };

  return (
    <div className="w-full h-[98mm] border-b-2 border-dashed border-gray-400 bg-white text-black text-sm relative box-border break-inside-avoid page-break-after-auto overflow-hidden">
      
      {/* ลายน้ำ */}
      <img 
        src={WATERMARK_SRC}
        alt="Watermark"
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[250px] opacity-[0.15] pointer-events-none z-0 grayscale"
      />

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col h-full justify-between p-5">

        {/* --- Header --- */}
        <div className="flex items-start mb-2 relative">
          
          {/* ซ้าย: Match / Court / Match ID */}
          <div className="flex flex-col mr-3 z-20">
              <div className="flex gap-2">
                  <div className="border border-black px-1 py-1 text-center min-w-[50px] bg-white">
                      <div className="text-[9px] uppercase text-gray-500 leading-none">Match</div>
                      <div className="text-xl font-bold leading-none mt-1">{match.matchNo || "-"}</div>
                  </div>
                  <div className="border border-black px-1 py-1 text-center min-w-[50px] bg-white">
                      <div className="text-[9px] uppercase text-gray-500 leading-none">Court</div>
                      <div className="text-xl font-bold leading-none mt-1">{match.court || "-"}</div>
                  </div>
              </div>
              
              {/* ✅ ปรับ Match ID: ย้ายมาอยู่ข้างล่าง ตัวเล็กลง สีจางลง ไม่แย่งซีน */}
              <div className="mt-1 text-left">
                 <span className="text-[8px] text-gray-400 font-mono">
                    ID: {match.matchId || "N/A"}
                 </span>
              </div>
          </div>

          {/* กลาง: ชื่อรายการ (Absolute Center) */}
          <div className="absolute inset-0 flex items-start justify-center pt-2 pointer-events-none z-10">
              <h1 className="text-2xl font-black uppercase tracking-wider text-black">
                  MOODENG CUP 2026
              </h1>
          </div>

          {/* ขวา: ข้อมูลรุ่น/เวลา */}
          <div className="text-right z-20 bg-white/60 backdrop-blur-[1px] px-1 rounded ml-auto">
              <div className="font-bold text-lg leading-none">{match.handLevel}</div>
              <div className="text-xs mt-1 font-medium">Group {match.group} • {match.roundType === 'group' ? 'Round Robin' : match.round}</div>
              <div className="text-[10px] text-gray-600 mt-0.5 font-mono">
                {new Date(match.scheduledAt).toLocaleDateString('th-TH')} {new Date(match.scheduledAt).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})}
              </div>
          </div>
        </div>

        {/* --- Table --- */}
        <table className="w-full border-collapse border border-black my-1 text-[11px] table-fixed">
          <thead>
              <tr className="bg-gray-100">
                  <th className="border border-black p-1 text-left w-[40%] pl-2">TEAM / PLAYERS</th>
                  <th className="border border-black p-1 w-[20%] text-center">SET 1</th>
                  <th className="border border-black p-1 w-[20%] text-center">SET 2</th>
                  <th className="border border-black p-1 w-[20%] text-center">SET 3</th>
              </tr>
          </thead>
          <tbody>
              {/* Team 1 */}
              <tr>
                  <td className="border border-black p-2 align-top h-14">
                      <div className="font-bold text-sm truncate w-full text-indigo-900">
                          {teamName(match.team1)}
                      </div>
                      <div className="text-[10px] text-gray-600 mt-1 leading-tight truncate w-full font-medium">
                          {playerList(match.team1)}
                      </div>
                  </td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
              </tr>

              {/* Team 2 */}
              <tr>
                  <td className="border border-black p-2 align-top h-14">
                      <div className="font-bold text-sm truncate w-full text-indigo-900">
                          {teamName(match.team2)}
                      </div>
                      <div className="text-[10px] text-gray-600 mt-1 leading-tight truncate w-full font-medium">
                           {playerList(match.team2)}
                      </div>
                  </td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
              </tr>
          </tbody>
        </table>

        {/* Footer (Signature) */}
        <div className="mt-auto">
            <div className="flex justify-between items-end gap-8 px-2 pb-1">
                <div className="flex-1 text-center">
                    <div className="border-b border-black h-8 mb-1"></div>
                    <div className="text-[9px] font-bold text-gray-500 uppercase truncate px-1">
                        {teamName(match.team1)}
                    </div>
                </div>
                <div className="flex-1 text-center">
                    <div className="border-b border-black h-8 mb-1"></div>
                    <div className="text-[9px] font-bold text-gray-500 uppercase truncate px-1">
                        {teamName(match.team2)}
                    </div>
                </div>
                <div className="flex-1 text-center">
                    <div className="border-b border-black h-8 mb-1"></div>
                    <div className="text-[9px] font-bold text-gray-500 uppercase">
                        Umpire / Scorer
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}