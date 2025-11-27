// src/pages/admin/Groups.jsx (AdminStandingsPage)

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { API } from "@/lib/api.js";
import { HAND_LEVEL_OPTIONS } from "@/lib/types.js";

// --- Constants & Styles ---
const COLUMN = {
  thLeft: "px-3 py-2 text-left",
  thCenter: "px-3 py-2 text-center",
  td: "px-3 py-2",
  tdCenter: "px-3 py-2 text-center",
  tdPlayer: "px-3 py-2 text-slate-600",
  tdTeam: "px-3 py-2 font-medium",
  tdPoints: "px-3 py-2 text-center font-semibold",
};

const DEFAULT_HAND = HAND_LEVEL_OPTIONS[0]?.value ?? "";

// --- Helpers ---
const scoreAt = (scores, index) => {
  if (!Array.isArray(scores)) return "";
  return scores[index] ?? "";
};

// --- Components ---

// Modal สำหรับแก้ไขลำดับพิเศษ (Force Rank)
function RankEditModal({ groupName, teams, onClose, onSave }) {
  const [ranks, setRanks] = useState(
    teams.map(t => ({ 
      id: t.teamId || t._id,
      name: t.teamName, 
      manualRank: t.manualRank || 0 
    }))
  );

  const handleChange = (index, val) => {
    const numVal = val === "" ? 0 : parseInt(val, 10);
    setRanks(prev => 
      prev.map((r, i) => 
        i === index ? { ...r, manualRank: isNaN(numVal) ? 0 : numVal } : r
      )
    );
  };

  const handleSave = () => {
    const updates = ranks.map(r => ({ teamId: r.id, manualRank: r.manualRank }));
    if (updates.some(u => !u.teamId)) {
        alert("Error: Team ID is missing. Please check console.");
        return;
    }
    onSave(updates);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all scale-100">
        <div className="flex items-center gap-2 mb-2 text-amber-600">
           <span className="text-xl">⚡</span>
           <h3 className="text-lg font-bold text-slate-800">
             จัดลำดับพิเศษ: กลุ่ม {groupName}
           </h3>
        </div>
        
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          ใช้กรณีคะแนนเท่ากัน (Dead Heat) หรือต้องจับสลาก <br/>
          ใส่ตัวเลข <strong>1, 2, 3...</strong> เพื่อบังคับลำดับ (ใส่ 0 เพื่อยกเลิกและใช้การคำนวณปกติ)
        </p>
        
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {ranks.map((item, index) => (
            <div key={index} className="flex items-center justify-between border border-slate-200 p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <span className="text-sm font-medium text-slate-700 truncate w-48" title={item.name}>
                {index + 1}. {item.name}
              </span>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">บังคับเป็นที่:</label>
                <input 
                  type="number" 
                  min="0" max="10" 
                  className="w-16 border border-slate-300 rounded-md px-2 py-1 text-center text-sm font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  value={item.manualRank || ""}
                  onChange={(e) => handleChange(index, e.target.value)}
                  placeholder="Auto"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors"
          >
            บันทึกการจัดอันดับ
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function AdminGroupsPage() {
  const [hand, setHand] = useState(DEFAULT_HAND);
  const [dataset, setDataset] = useState({ level: DEFAULT_HAND, groups: [] });
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [mocking, setMocking] = useState(false); // ✅ เพิ่ม State สำหรับปุ่ม Mock
  const [error, setError] = useState("");
  
  const [editingGroup, setEditingGroup] = useState(null);

  const load = useCallback(async () => {
    if (!hand) return;
    setLoading(true);
    setError("");
    try {
      const res = await API.getStandings(hand);
      setDataset(res || { level: hand, groups: [] });
    } catch (e) {
      setError(e.message || "โหลดข้อมูลไม่สำเร็จ");
      setDataset({ level: hand, groups: [] });
    } finally {
      setLoading(false);
    }
  }, [hand]);

  useEffect(() => {
    load();
  }, [load]);

  const handOptions = useMemo(
    () =>
      HAND_LEVEL_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.labelShort || opt.label || opt.value,
      })),
    []
  );

  const handleClear = useCallback(async () => {
    if (!hand) return;
    if (!window.confirm(`ยืนยันการเคลียร์คะแนนของระดับมือ ${hand} หรือไม่?\nข้อมูลแมทช์จะถูกรีเซ็ตกลับเป็นรอแข่งทั้งหมด`)) return;
    
    setClearing(true);
    setError("");
    try {
      await API.clearStandings({ handLevel: hand, resetMatches: true });
      await load();
    } catch (e) {
      setError(e.message || "เคลียร์คะแนนไม่สำเร็จ");
    } finally {
      setClearing(false);
    }
  }, [hand, load]);

  const handleRecalculate = useCallback(async () => {
    if (!hand) return;
    if (!window.confirm(`ต้องการ "คำนวณคะแนนใหม่" (Re-sync) สำหรับรุ่น ${hand} ใช่ไหม?`)) return;

    setRecalculating(true);
    setError("");
    try {
      await API.recalculateStandings({
        handLevel: hand,
        tournamentId: "default",
      });
      await load();
      alert("คำนวณคะแนนใหม่เรียบร้อย ✅");
    } catch (e) {
      console.error(e);
      setError(e.message || "เกิดข้อผิดพลาดในการคำนวณใหม่");
    } finally {
      setRecalculating(false);
    }
  }, [hand, load]);

  // ✅✅✅ เพิ่มฟังก์ชัน handleMock ตรงนี้ ✅✅✅
  const handleMock = useCallback(async () => {
    if (!hand) return;
    if (!window.confirm(`⚠️ ยืนยันการ "จำลองคะแนน" (Mock) สำหรับรุ่น ${hand} ?\nระบบจะสุ่มคะแนนใส่เฉพาะแมตช์ที่ยังไม่แข่งเท่านั้น`)) return;

    setMocking(true);
    setError("");
    try {
      await API.mockScores({ handLevel: hand });
      await load();
      alert(`🎲 Mock คะแนนสำหรับรุ่น ${hand} เรียบร้อย!`);
    } catch (e) {
      console.error(e);
      setError(e.message || "เกิดข้อผิดพลาดในการ Mock คะแนน");
    } finally {
      setMocking(false);
    }
  }, [hand, load]);

  // ฟังก์ชันบันทึก Manual Rank
  const handleSaveRanks = async (updates) => {
    try {
      await API.updateTeamRanks(updates); 
      setEditingGroup(null);
      await load();
    } catch(e) {
      alert("บันทึกไม่สำเร็จ: " + e.message);
    }
  };

  const groups = dataset?.groups ?? [];

  return (
    <div className="px-6 py-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">ตารางคะแนน (Admin)</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            value={hand}
            onChange={(e) => setHand(e.target.value)}
            disabled={loading || recalculating}
          >
            {handOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          
          <button
            className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            onClick={load}
            disabled={loading}
          >
            {loading ? "..." : "Refresh"}
          </button>
          
          <button
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
            onClick={handleRecalculate}
            disabled={loading || recalculating || mocking}
          >
            {recalculating ? "⏳..." : "🔄 คำนวณใหม่"}
          </button>

          <button
            className="px-4 py-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-sm font-medium hover:bg-rose-100 disabled:opacity-50"
            onClick={handleClear}
            disabled={loading || clearing || recalculating || mocking}
          >
            {clearing ? "..." : "ล้างคะแนน"}
          </button>

          {/* ✅✅✅ ปุ่ม Mock คะแนน ✅✅✅ */}
          <button
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 shadow-sm flex items-center gap-1"
            onClick={handleMock}
            disabled={loading || clearing || recalculating || mocking}
          >
            {mocking ? (
              <>⏳ กำลังสุ่ม...</>
            ) : (
              <>🎲 Mock คะแนน</>
            )}
          </button>
        </div>
      </header>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-2">
          ⚠️ {error}
        </div>
      )}

      {groups.length === 0 ? (
        <div className="text-slate-400 text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <div className="text-4xl mb-2">📭</div>
          ไม่มีข้อมูลกลุ่ม หรือยังไม่ได้สร้างสายการแข่งขัน
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section
              key={group.groupName}
              className="bg-white shadow-sm rounded-xl overflow-hidden border border-slate-200"
            >
              <div className="bg-slate-50 border-b px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <span className="font-bold text-slate-800 text-lg">กลุ่ม {group.groupName}</span>
                   <span className="text-xs px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-500">
                     {group.teams.length} ทีม
                   </span>
                </div>
                
                {/* ปุ่มเปิด Modal แก้ไขลำดับ */}
                <button 
                  onClick={() => setEditingGroup(group)}
                  className="text-xs flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-colors font-medium"
                >
                  <span>⚡</span> จัดลำดับพิเศษ (Manual)
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-slate-700 border-b">
                    <tr>
                      <th rowSpan={2} className={COLUMN.thCenter}>อันดับ</th>
                      <th rowSpan={2} className={COLUMN.thLeft}>ทีม</th>
                      <th rowSpan={2} className={COLUMN.thCenter}>Manual</th>
                      <th rowSpan={2} className={COLUMN.thCenter + " border-l"}>Match1</th>
                      <th rowSpan={2} className={COLUMN.thCenter}>Match2</th>
                      <th rowSpan={2} className={COLUMN.thCenter + " border-r"}>Match3</th>
                      <th rowSpan={2} className={COLUMN.thCenter}>แข่ง</th>
                      <th rowSpan={2} className={COLUMN.thCenter}>ชนะ</th>
                      <th rowSpan={2} className={COLUMN.thCenter}>แพ้</th>
                      <th rowSpan={2} className={COLUMN.thCenter + " bg-indigo-50 text-indigo-700 border-l border-r"}>
                        คะแนน
                      </th>
                      <th colSpan={3} className={COLUMN.thCenter + " border-r"}>แต้ม</th>
                      <th colSpan={3} className={COLUMN.thCenter}>เซ็ต</th>
                    </tr>
                    <tr className="border-t border-slate-200">
                      <th className={COLUMN.thCenter + " text-xs text-slate-500"}>ได้</th>
                      <th className={COLUMN.thCenter + " text-xs text-slate-500"}>เสีย</th>
                      <th className={COLUMN.thCenter + " text-xs text-slate-500 border-r"}>ผลต่าง</th>
                      <th className={COLUMN.thCenter + " text-xs text-slate-500"}>ได้</th>
                      <th className={COLUMN.thCenter + " text-xs text-slate-500"}>เสีย</th>
                      <th className={COLUMN.thCenter + " text-xs text-slate-500"}>ผลต่าง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.teams.map((team, index) => (
                      <tr key={team.teamId || team._id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                        <td className={COLUMN.tdCenter + " font-bold text-slate-700"}>{index + 1}</td>
                        
                        <td className={COLUMN.tdTeam + " text-slate-900 min-w-[200px]"}>
                          {team.teamName}
                          <div className="text-xs text-slate-500 font-normal mt-0.5">
                             {team.players?.map(p => p.nickname || p.fullName).join(" / ")}
                          </div>
                        </td>

                        {/* Manual Rank Indicator */}
                        <td className={COLUMN.tdCenter}>
                           {team.manualRank > 0 ? (
                             <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200" title={`Force Rank: ${team.manualRank}`}>
                               {team.manualRank}
                             </span>
                           ) : (
                             <span className="text-slate-300">-</span>
                           )}
                        </td>
                        
                        {/* Match Scores */}
                        <td className={COLUMN.tdCenter + " border-l bg-slate-50/50 text-xs"}>
                          {scoreAt(team.matchScores, 0)}
                        </td>
                        <td className={COLUMN.tdCenter + " bg-slate-50/50 text-xs"}>
                          {scoreAt(team.matchScores, 1)}
                        </td>
                        <td className={COLUMN.tdCenter + " border-r bg-slate-50/50 text-xs"}>
                          {scoreAt(team.matchScores, 2)}
                        </td>

                        <td className={COLUMN.tdCenter}>{team.matchesPlayed ?? 0}</td>
                        <td className={COLUMN.tdCenter + " text-emerald-600 font-medium"}>{team.wins ?? 0}</td>
                        <td className={COLUMN.tdCenter + " text-rose-500"}>{team.losses ?? 0}</td>
                        
                        <td className={COLUMN.tdPoints + " bg-indigo-50 text-indigo-700 border-l border-r text-lg"}>
                          {team.points ?? 0}
                        </td>
                        
                        <td className={COLUMN.tdCenter + " text-slate-600"}>{team.scoreFor ?? 0}</td>
                        <td className={COLUMN.tdCenter + " text-slate-600"}>{team.scoreAgainst ?? 0}</td>
                        <td className={COLUMN.tdCenter + " font-medium border-r " + ((team.scoreDiff ?? 0) > 0 ? "text-emerald-600" : "text-slate-500")}>
                          {team.scoreDiff ?? 0}
                        </td>
                        
                        <td className={COLUMN.tdCenter + " text-slate-600"}>{team.setsFor ?? 0}</td>
                        <td className={COLUMN.tdCenter + " text-slate-600"}>{team.setsAgainst ?? 0}</td>
                        <td className={COLUMN.tdCenter + " font-medium " + ((team.setsDiff ?? 0) > 0 ? "text-emerald-600" : "text-slate-500")}>
                          {team.setsDiff ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Modal Popup */}
      {editingGroup && (
        <RankEditModal 
          groupName={editingGroup.groupName} 
          teams={editingGroup.teams} 
          onClose={() => setEditingGroup(null)} 
          onSave={handleSaveRanks}
        />
      )}
    </div>
  );
}