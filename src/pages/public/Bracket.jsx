// src/pages/public/Bracket.jsx
// (เวอร์ชันออกแบบใหม่ - Mobile First)

import React from "react";

// Component ย่อยสำหรับ "คู่แข่ง"
// (ออกแบบให้เหมือนการ์ดในหน้า Schedule)
function BracketMatch({ team1, score1, team2, score2, isWinner }) {
  return (
    <div className="bg-white rounded-lg shadow border p-4">
      <div className={`flex justify-between items-center ${isWinner === 1 ? 'font-bold text-black' : 'text-gray-600'}`}>
        <span>{team1}</span>
        <span className="font-bold">{score1}</span>
      </div>
      <div className="my-2 border-b"></div>
      <div className={`flex justify-between items-center ${isWinner === 2 ? 'font-bold text-black' : 'text-gray-600'}`}>
        <span>{team2}</span>
        <span className="font-bold">{score2}</span>
      </div>
    </div>
  );
}

// Component ย่อยสำหรับ "รอบ" (เช่น รอบ 16 ทีม)
function BracketRound({ title, matches }) {
  return (
    <section>
      <h3 className="text-lg font-bold text-gray-800 mb-3">{title}</h3>
      <div className="space-y-4">
        {matches.map((m, i) => (
          <BracketMatch key={i} {...m} />
        ))}
      </div>
    </section>
  );
}

export default function BracketPage() {
  // --- Mock Data (ข้อมูลจำลอง) ---
  // (รอเชื่อมต่อ API จริงในอนาคต)
  const bracketData = [
    {
      title: "รอบ 16 ทีม (Round of 16)",
      matches: [
        { team1: "MMteam", score1: 21, team2: "PPteam", score2: 18, isWinner: 1 },
        { team1: "LLteam", score1: 15, team2: "NNteam", score2: 21, isWinner: 2 },
      ],
    },
    {
      title: "รอบ 8 ทีม (Quarter-final)",
      matches: [
        { team1: "MMteam", score1: 21, team2: "NNteam", score2: 19, isWinner: 1 },
      ],
    },
     {
      title: "รอบรอง (Semi-final)",
      matches: [
        { team1: "MMteam", score1: "-", team2: "(รอผล)", score2: "-", isWinner: 0 },
      ],
    },
  ];

  return (
    // Layout หลัก (Card) ที่จะแสดงเนื้อหา
    <div className="bg-white rounded-xl shadow border overflow-hidden">
      <div className="px-4 py-3 border-b bg-gray-50/50">
        <h2 className="text-xl font-semibold">สายการแข่งขัน (Knockout)</h2>
        <p className="text-sm text-gray-500">(WIP: นี่คือข้อมูลจำลอง)</p>
      </div>
      <div className="p-4 md:p-6 space-y-8">
        {bracketData.map(round => (
          <BracketRound key={round.title} {...round} />
        ))}
      </div>
    </div>
  );
}