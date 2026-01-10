import React from "react";

export default function LuckyDrawPage() {
  // ข้อมูลผู้โชคดี (Wheel 1)
  const winners = [
    {
      rank: 1,
      prize: "เสื้อกีฬา",
      type: "grand", // grand, gold, silver, bronze, voucher
      icon: "👕",
      name: "กิจจ์ธนา",
      nick: "โก",
      team: "ฟาดเรียบ",
      category: "N (16 คู่)",
    },
    {
      rank: 2,
      prize: "พวงกุญแจ",
      type: "gold",
      icon: "🔑",
      name: "วิฑูร สุขวิสุทธิโชติ",
      nick: "ตั้ม",
      team: "No name",
      category: "BG (Mixs) (24 คู่)",
    },
    {
      rank: 3,
      prize: "พวงกุญแจ",
      type: "gold",
      icon: "🔑",
      name: "สุขเดช",
      nick: "ซัน",
      team: "Drink Drank Drunk x Whiteline",
      category: "N (16 คู่)",
    },
    {
      rank: 4,
      prize: "พวงกุญแจ",
      type: "gold",
      icon: "🔑",
      name: "ธนฤทธิ์ ปีนะเก",
      nick: "ปิงปอง",
      team: "โบ๊ะบ๊ะแบดมินตัน",
      category: "เดี่ยว NB (16 คน)",
    },
    {
      rank: 5,
      prize: "ถุงเท้า Yonex",
      type: "silver",
      icon: "🧦",
      name: "เอกวรรณ เขียววิลัย",
      nick: "นุ่น",
      team: "Space Funky Raccoon",
      category: "BG- (16 คู่)",
    },
    {
      rank: 6,
      prize: "ถุงเท้า Yonex",
      type: "silver",
      icon: "🧦",
      name: "นายสุรศักดิ์ ศรีล้ำเลิศ",
      nick: "ออฟ",
      team: "โบ๊ะบ๊ะบอย",
      category: "BG (Men) (24 คู่)",
    },
    {
      rank: 7,
      prize: "ถุงเท้า Yonex",
      type: "silver",
      icon: "🧦",
      name: "นายรัฐศาสตร์ ขันคำ",
      nick: "วอเตอร์",
      team: "AMF3",
      category: "Baby (16 คู่)",
    },
    {
      rank: 8,
      prize: "ถุงเท้า Yonex",
      type: "silver",
      icon: "🧦",
      name: "ศุภรักษ์ ชัยตามล",
      nick: "มิกซ์",
      team: "TJM",
      category: "BG (Mixs) (24 คู่)",
    },
    {
      rank: 9,
      prize: "ถุงเท้า Yonex",
      type: "silver",
      icon: "🧦",
      name: "ภูมิพัฒน์ ลีหล้าน้อย",
      nick: "ภูมิ",
      team: "Eagle Thailand",
      category: "Baby (16 คู่)",
    },
    {
      rank: 10,
      prize: "คูปอง Free ร้านน้ำชง",
      type: "voucher",
      icon: "🥤",
      name: "วงศกร",
      nick: "ไก๋",
      team: "แม่งัด....ไม่ยอมงัด",
      category: "BG- (16 คู่)",
    },
    {
      rank: 11,
      prize: "คูปอง Free ร้านน้ำชง",
      type: "voucher",
      icon: "🥤",
      name: "บารมี ธรรมมา",
      nick: "เบส",
      team: "ก๊วนแบดมินตันเพื่อนน้องลูกหว้า",
      category: "N (16 คู่)",
    },
    {
      rank: 12,
      prize: "คูปอง ลด 50% ร้านน้ำชง",
      type: "voucher",
      icon: "🏷️",
      name: "นพรัตน์ (ดีม)",
      nick: "ดีม",
      team: "Dream",
      category: "เดี่ยว NB (16 คน)",
    },
    {
      rank: 13,
      prize: "คูปอง ลด 50% ร้านน้ำชง",
      type: "voucher",
      icon: "🏷️",
      name: "อันนาวารินทร์ ต้นเนียม",
      nick: "อันนา",
      team: "Eagle thailand",
      category: "N (16 คู่)",
    },
    {
      rank: 14,
      prize: "คูปอง ลด 50% ร้านน้ำชง",
      type: "voucher",
      icon: "🏷️",
      name: "ศตวรรษ เสียงเลิศ",
      nick: "แซม",
      team: "มุลิลา",
      category: "N (16 คู่)",
    },
    {
      rank: 15,
      prize: "คูปอง ลด 20% ร้านน้ำชง",
      type: "voucher",
      icon: "🏷️",
      name: "สภารัตน์ วงศ์อานนท์",
      nick: "จา",
      team: "BCF",
      category: "BG (Mixs) (24 คู่)",
    },
    {
      rank: 16,
      prize: "คูปอง ลด 20% ร้านน้ำชง",
      type: "voucher",
      icon: "🏷️",
      name: "ณพัฒน์ คำ ณพัฒน์",
      nick: "พัฒน์",
      team: "Voddy",
      category: "เดี่ยว NB (16 คน)",
    },
    {
      rank: 17,
      prize: "คูปอง ลด 20% ร้านน้ำชง",
      type: "voucher",
      icon: "🏷️",
      name: "ศิระ",
      nick: "โดม",
      team: "JPL by Thitipong",
      category: "BG- (16 คู่)",
    },
  ];

  // Component การ์ดรางวัลแต่ละใบ
  const WinnerCard = ({ data }) => {
    // กำหนดสีตามประเภทรางวัล
    const styles = {
      grand:
        "bg-gradient-to-br from-yellow-50 to-orange-100 border-yellow-200 text-yellow-900",
      gold: "bg-white border-slate-200 shadow-sm",
      silver: "bg-white border-slate-200 shadow-sm",
      voucher: "bg-slate-50 border-slate-100 text-slate-600 dashed-border",
    };

    const containerClass = styles[data.type] || styles.silver;
    const isGrand = data.type === "grand";

    return (
      <div
        className={`relative rounded-xl border p-4 flex items-center gap-4 transition-all hover:shadow-md 
        ${containerClass} ${isGrand ? "shadow-md scale-[1.02] border-2" : ""}`}
      >
        {/* ลำดับที่ */}
        <div
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-full shrink-0
          ${
            isGrand
              ? "bg-yellow-500 text-white shadow-sm"
              : "bg-indigo-50 text-indigo-600 font-bold"
          }`}
        >
          <span className="text-[10px] uppercase opacity-80 leading-none">
            No.
          </span>
          <span className="text-xl font-bold leading-none">{data.rank}</span>
        </div>

        {/* ข้อมูล */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
              ${
                isGrand
                  ? "bg-orange-200 text-orange-900"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {data.icon} {data.prize}
            </span>
            <span className="text-[10px] text-slate-400 border border-slate-200 px-1.5 rounded bg-white">
              {data.category}
            </span>
          </div>

          <h3 className="text-sm md:text-base font-bold truncate text-slate-800">
            {data.name}{" "}
            <span className="text-slate-500 font-normal">({data.nick})</span>
          </h3>
          <p className="text-xs text-slate-500 truncate flex items-center gap-1">
            🏟️ {data.team}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-24 max-w-3xl mx-auto px-4 md:px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="text-center mb-8 pt-6">
        <div className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] md:text-xs font-semibold mb-3 tracking-wide border border-indigo-100 shadow-sm">
          <span>🎁</span> Wheel 1 Results
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-slate-800 mb-2 tracking-tight">
          ผู้โชคดีจับฉลาก
        </h1>
        <p className="text-slate-500 text-sm md:text-base font-normal">
          ขอแสดงความยินดีกับผู้ได้รับรางวัลทุกท่าน
        </p>
      </div>

      {/* รางวัลใหญ่ (แยกออกมาให้เด่น) */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          🏆 รางวัลใหญ่ (Top Prize)
        </h2>
        <div className="grid grid-cols-1">
          {winners
            .filter((w) => w.type === "grand")
            .map((w, i) => (
              <WinnerCard key={i} data={w} />
            ))}
        </div>
      </div>

      {/* รางวัลอื่นๆ (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
        {/* กลุ่มพวงกุญแจ */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide border-b pb-1">
            🔑 พวงกุญแจ (Keychains)
          </h3>
          <div className="grid gap-3">
            {winners
              .filter((w) => w.type === "gold")
              .map((w, i) => (
                <WinnerCard key={i} data={w} />
              ))}
          </div>
        </div>

        {/* กลุ่มถุงเท้า */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide border-b pb-1">
            🧦 ถุงเท้า Yonex (Socks)
          </h3>
          <div className="grid gap-3">
            {winners
              .filter((w) => w.type === "silver")
              .map((w, i) => (
                <WinnerCard key={i} data={w} />
              ))}
          </div>
        </div>
      </div>

      {/* กลุ่มคูปอง */}
      <div className="mt-8 space-y-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide border-b pb-1">
          🥤 คูปองส่วนลด (Vouchers)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {winners
            .filter((w) => w.type === "voucher")
            .map((w, i) => (
              <WinnerCard key={i} data={w} />
            ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center border-t pt-6 text-slate-400 text-xs">
        <p>กรุณาติดต่อรับของรางวัลที่กองอำนวยการ</p>
      </div>
    </div>
  );
}
