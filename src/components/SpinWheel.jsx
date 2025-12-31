// src/components/SpinWheel.jsx
import React, { useEffect, useRef, useState } from "react";
import { Wheel } from "spin-wheel";

// Theme สี
const COLORS = ["#F3F4F6", "#FFFFFF", "#E0E7FF", "#F0FDF4"];

export default function SpinWheel({ teams = [], onWinnerFound }) {
  const containerRef = useRef(null);
  const wheelRef = useRef(null);
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (!containerRef.current || teams.length === 0) return;

    // ฟังก์ชั่นสร้างวงล้อ
    const createWheel = () => {
      // เช็คว่า container มีขนาดจริงหรือยัง? ถ้ายังเป็น 0 ให้รอไปก่อน
      if (containerRef.current.clientWidth === 0 || containerRef.current.clientHeight === 0) {
        return; 
      }

      const props = {
        items: teams.map((team, index) => ({
          label: team.teamName,
          backgroundColor: COLORS[index % COLORS.length],
          labelColor: '#334155', 
          weight: 1,
        })),
        
        // --- Geometry ---
        radius: 0.88,
        borderWidth: 6,
        borderColor: '#e2e8f0', 
        lineWidth: 1,
        lineColor: '#e2e8f0',
        
        // --- Typography ---
        itemLabelFont: 'Kanit',  
        itemLabelFontSizeMax: 100, // ✅ ปรับเป็น 24 (ถ้า 100 จะใหญ่คับช่องเกินไป)
        itemLabelRadius: 0.90,     
        itemLabelRadiusMax: 0.20, // ✅ ขยับให้กินพื้นที่เข้ามาด้านในได้ลึกขึ้น (ตัวหนังสือจะได้ไม่โดนบีบ)
        itemLabelRotation: 180,    
        itemLabelAlign: 'left',    
        
        pointerAngle: 90, 
        
        rotationSpeedMax: 500, 
        rotationResistance: -100, 
        
        onRest: (event) => {
          const winningIndex = event.currentIndex;
          setWinner(teams[winningIndex]);
          setIsSpinning(false);
        },
        onSpin: () => {
          setIsSpinning(true);
        }
      };

      // ล้างของเก่า
      if (wheelRef.current) wheelRef.current.remove();
      
      // สร้างใหม่
      wheelRef.current = new Wheel(containerRef.current, props);
    };

    // ✅ ใช้ ResizeObserver: เพื่อรอให้ Modal ขยายเสร็จก่อน ค่อยวาดวงล้อ
    const observer = new ResizeObserver(() => {
        // เมื่อขนาดกล่องเปลี่ยน (เช่น Modal เด้งขึ้นมาเสร็จ) ให้วาดใหม่ทันที
        window.requestAnimationFrame(() => {
            createWheel();
        });
    });

    observer.observe(containerRef.current);

    // Cleanup
    return () => {
      observer.disconnect();
      if (wheelRef.current) {
        wheelRef.current.remove();
        wheelRef.current = null;
      }
    };
  }, [teams]); 

  // สั่งหมุน
  const handleSpin = () => {
    if (wheelRef.current && !isSpinning && !winner) {
      const speed = 500 + Math.random() * 300;
      wheelRef.current.spin(speed);
      setWinner(null);
    }
  };

  const handleReset = () => {
    setWinner(null);
  };

  const handleConfirm = () => {
    if (winner && onWinnerFound) {
      onWinnerFound(winner);
    }
  };

  if (teams.length === 0) return <div className="p-10 text-center text-slate-400 font-['Kanit']">ไม่มีทีมให้สุ่ม</div>;

  return (
    <div className="flex flex-col items-center justify-center py-6 w-full overflow-hidden">
      {/* ✅ เพิ่ม key เพื่อบังคับ re-render เมื่อจำนวนทีมเปลี่ยน 
         (ช่วยแก้บั๊กเวลาเปลี่ยนกลุ่มแล้ววงล้อไม่รีเฟรช) 
      */}
      <div key={teams.length} className="relative w-[300px] h-[300px] md:w-[320px] md:h-[320px]">
        
        {/* Container */}
        <div ref={containerRef} className="w-full h-full font-['Kanit']" />

        {/* Pointer */}
        <div className="absolute top-1/2 -right-2 -translate-y-1/2 z-20 drop-shadow-lg">
           <div className="w-0 h-0 
              border-t-[15px] border-t-transparent
              border-b-[15px] border-b-transparent
              border-r-[25px] border-r-red-500">
           </div>
        </div>

        {/* Button */}
        <button
            onClick={handleSpin}
            disabled={isSpinning || !!winner}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full shadow-lg flex items-center justify-center font-bold border-4 transition-all z-30 font-['Kanit']
                ${isSpinning || winner 
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                    : 'bg-white text-indigo-600 border-indigo-50 hover:scale-105 active:scale-95 cursor-pointer'
                }
            `}
        >
            {isSpinning ? "..." : "SPIN"}
        </button>
      </div>

      {/* Result */}
      <div className="mt-6 min-h-[80px] w-full flex flex-col items-center justify-center font-['Kanit'] space-y-3">
         {winner ? (
            <div className="animate-in zoom-in duration-300 flex flex-col items-center gap-3 w-full px-4">
                <div className="text-center">
                    <div className="text-xs text-slate-400 mb-1">ผู้โชคดีคือ</div>
                    <div className="text-emerald-600 font-bold text-xl drop-shadow-sm animate-bounce">
                        🎉 {winner.teamName} 🎉
                    </div>
                </div>
                
                <div className="flex gap-3 w-full justify-center mt-2">
                    <button 
                        onClick={handleReset}
                        className="flex-1 max-w-[100px] py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-colors"
                    >
                        🔄 หมุนใหม่
                    </button>
                    <button 
                        onClick={handleConfirm}
                        className="flex-1 max-w-[120px] py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg active:scale-95 transition-all"
                    >
                        ✅ ตกลง
                    </button>
                </div>
            </div>
         ) : (
            <div className="text-slate-400 text-sm animate-pulse">
                {isSpinning ? "กำลังลุ้น..." : "กดปุ่มตรงกลางเพื่อเริ่มสุ่ม"}
            </div>
         )}
      </div>
    </div>
  );
}