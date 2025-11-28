import React, { useState, useRef } from "react";
import { API } from "@/lib/api";
import { HAND_LEVEL_OPTIONS } from "@/lib/types";
import { useReactToPrint } from "react-to-print"; // import library
import CompactScoreSheet from "@/components/print/CompactScoreSheet"; 

export default function PrintBatchPage() {
  const [matches, setMatches] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    handLevel: "",
    group: "",
    status: "scheduled", // default: รอแข่ง
  });

  // Ref สำหรับพื้นที่ที่จะปริ้น
  const printRef = useRef();

  // 1. ฟังก์ชันโหลดข้อมูล
  const loadMatches = async () => {
    setLoading(true);
    try {
      // ดึงมาเยอะๆ (pageSize: 200) เพื่อให้ครบทั้งกลุ่ม
      const res = await API.listSchedule({
        handLevel: filters.handLevel,
        group: filters.group,
        status: filters.status,
        pageSize: 200, 
        sort: "matchNo" // เรียงตามลำดับแมตช์
      });
      setMatches(res.items || []);
      setSelectedIds(new Set()); // รีเซ็ตการเลือก
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. ฟังก์ชันจัดการ Checkbox
  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === matches.length && matches.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(matches.map(m => m._id)));
    }
  };

  // 3. ฟังก์ชันสั่งปริ้น (หัวใจสำคัญ)
  const handlePrint = useReactToPrint({
    contentRef: printRef, // ใช้ contentRef สำหรับ v3 หรือ content สำหรับ v2
    documentTitle: "Badminton_ScoreSheets",
  });

  // กรองเอาเฉพาะแมตช์ที่ถูกติ๊กเลือก เพื่อส่งไป render ในส่วนที่ซ่อนอยู่
  const selectedMatches = matches.filter(m => selectedIds.has(m._id));

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      
      {/* === ส่วนควบคุม (Control Panel) === */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
           🖨️ พิมพ์ใบคะแนน (Batch Print)
        </h1>
        
        <div className="flex flex-wrap gap-4 items-end">
          {/* Filter: Hand Level */}
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">ระดับมือ</label>
            <select 
              className="border p-2 rounded-lg w-40 text-sm"
              value={filters.handLevel}
              onChange={e => setFilters({...filters, handLevel: e.target.value})}
            >
              <option value="">-- ทั้งหมด --</option>
              {HAND_LEVEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          
          {/* Filter: Group */}
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">กลุ่ม</label>
            <input 
              className="border p-2 rounded-lg w-24 text-sm uppercase"
              placeholder="A, B..."
              value={filters.group}
              onChange={e => setFilters({...filters, group: e.target.value})}
            />
          </div>

          {/* Filter: Status */}
           <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">สถานะ</label>
            <select 
              className="border p-2 rounded-lg w-32 text-sm"
              value={filters.status}
              onChange={e => setFilters({...filters, status: e.target.value})}
            >
              <option value="">ทั้งหมด</option>
              <option value="scheduled">รอแข่ง</option>
              <option value="finished">จบแล้ว</option>
            </select>
          </div>

          <button 
            onClick={loadMatches} 
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 font-medium transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "กำลังค้นหา..." : "🔍 ค้นหา"}
          </button>
        </div>
      </div>

      {/* === ตารางรายชื่อ (Selection Table) === */}
      {matches.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-20">
           {/* Toolbar บนตาราง */}
           <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="text-sm text-slate-600 font-medium">
                  พบคู่แข่งขัน: {matches.length} คู่ | เลือกแล้ว: <span className="text-indigo-600 font-bold">{selectedIds.size}</span>
              </div>
              
              <button 
                onClick={handlePrint}
                disabled={selectedIds.size === 0}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
              >
                🖨️ สั่งพิมพ์ ({selectedIds.size} ใบ)
              </button>
           </div>
           
           <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-bold">
                    <tr>
                        <th className="p-3 w-12 text-center">
                            <input type="checkbox" 
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                checked={matches.length > 0 && selectedIds.size === matches.length} 
                                onChange={toggleAll} 
                            />
                        </th>
                        <th className="p-3 w-24">Match No.</th>
                        <th className="p-3 w-32">Level / Group</th>
                        <th className="p-3">Matchup</th>
                        <th className="p-3 text-center">Time</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {matches.map(m => (
                        <tr 
                            key={m._id} 
                            className={`hover:bg-indigo-50/50 transition cursor-pointer ${selectedIds.has(m._id) ? "bg-indigo-50" : ""}`}
                            onClick={() => toggleSelect(m._id)} // คลิกที่แถวเพื่อเลือกได้เลย
                        >
                            <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                                <input type="checkbox" 
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={selectedIds.has(m._id)} 
                                    onChange={() => toggleSelect(m._id)} 
                                />
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-700">
                                {m.matchNo || "-"}
                            </td>
                            <td className="p-3">
                                <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-xs font-semibold text-slate-600">
                                    {m.handLevel} {m.group}
                                </span>
                            </td>
                            <td className="p-3">
                                <div className="font-medium text-slate-900">{m.team1?.teamName || "BYE"}</div>
                                <div className="text-xs text-slate-400">vs</div>
                                <div className="font-medium text-slate-900">{m.team2?.teamName || "BYE"}</div>
                            </td>
                            <td className="p-3 text-center font-mono text-slate-600">
                                {new Date(m.scheduledAt).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})}
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
        </div>
      )}

      {/* === HIDDEN PRINT AREA (พื้นที่ลับสำหรับ Render ตอนสั่ง Print) === */}
      <div style={{ display: "none" }}> 
        <div ref={printRef} className="print-container">
            {/* Inject CSS เฉพาะตอน Print */}
            <style>{`
                @page { size: A4; margin: 0mm; }
                body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
                .print-container { width: 100%; }
            `}</style>
            
            {/* Render เฉพาะแมตช์ที่เลือก */}
            {selectedMatches.map((match) => (
                <CompactScoreSheet key={match._id} match={match} />
            ))}
        </div>
      </div>

    </div>
  );
}