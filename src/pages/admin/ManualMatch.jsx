// src/pages/admin/ManualMatch.jsx

import React, { useState, useEffect, useMemo } from "react";
import { API, teamName } from "@/lib/api.js";
import { useTournament } from "@/contexts/TournamentContext";
import { HAND_LEVEL_OPTIONS } from "@/lib/types.js";

export default function ManualMatchPage() {
  const { selectedTournament } = useTournament();
  
  // States
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Form Data
  const [form, setForm] = useState({
    handLevel: "",
    round: "Friendly", // ชื่อรอบ เช่น "รอบพิเศษ", "กระชับมิตร"
    team1: "",
    team2: "",
    court: "",
    scheduledAt: "", // (Optional) เวลาแข่ง
  });

  // 1. โหลดข้อมูลทีมเมื่อเข้าหน้า
  useEffect(() => {
    if (!selectedTournament?._id) return;
    setLoading(true);
    API.listTeams({ tournamentId: selectedTournament._id })
      .then((res) => setTeams(res || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedTournament]);

  // 2. ตัวเลือก Hand Level (Dynamic)
  const handOptions = useMemo(() => {
    const cats = selectedTournament?.settings?.categories || [];
    if (cats.length > 0) return cats.map((c) => ({ value: c, label: c }));
    return HAND_LEVEL_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
  }, [selectedTournament]);

  // 3. กรองทีมตาม Hand Level ที่เลือก (เพื่อให้หาง่ายขึ้น)
  const filteredTeams = useMemo(() => {
    if (!form.handLevel) return teams;
    return teams.filter((t) => t.handLevel === form.handLevel);
  }, [teams, form.handLevel]);

  // 4. บันทึกแมตช์
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!form.team1 || !form.team2) {
      setMsg({ type: "error", text: "กรุณาเลือกทีมทั้ง 2 ฝั่ง" });
      return;
    }
    if (form.team1 === form.team2) {
      setMsg({ type: "error", text: "ทีมคู่แข่งต้องไม่ซ้ำกัน" });
      return;
    }

    setSubmitting(true);
    try {
      await API.createMatch({
        tournamentId: selectedTournament._id,
        handLevel: form.handLevel,
        round: form.round,
        roundType: "manual", // ระบุว่าเป็นแมตช์สร้างเอง
        team1: form.team1,
        team2: form.team2,
        court: form.court || null,
        scheduledAt: form.scheduledAt || null,
        status: "scheduled",
        matchNo: 999, // เลขสมมติ หรือให้ระบบรันต่อ
      });

      setMsg({ type: "success", text: "สร้างแมตช์สำเร็จ! ✅" });
      // Reset คู่แข่งแต่เก็บค่าอื่นไว้เผื่อสร้างต่อ
      setForm((prev) => ({ ...prev, team1: "", team2: "" }));
    } catch (err) {
      setMsg({ type: "error", text: "เกิดข้อผิดพลาด: " + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedTournament) return <div className="p-8 text-center">กรุณาเลือกรายการแข่งขันก่อน</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span>🛠️</span> สร้างแมตช์พิเศษ (Manual Match)
      </h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {msg.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Row 1: ชื่อรอบ & รุ่นมือ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อรอบ / รายการ</label>
              <input 
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={form.round}
                onChange={(e) => setForm({ ...form, round: e.target.value })}
                placeholder="เช่น Friendly, รอบตกค้าง"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">เลือกรุ่นมือ (Hand Level)</label>
              <select 
                className="w-full border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={form.handLevel}
                onChange={(e) => setForm({ ...form, handLevel: e.target.value, team1: "", team2: "" })}
                required
              >
                <option value="">-- กรุณาเลือก --</option>
                {handOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 my-4"></div>

          {/* Row 2: เลือกคู่แข่งขัน */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {/* VS Badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded-full z-10 hidden md:block">
              VS
            </div>

            <div>
              <label className="block text-sm font-bold text-indigo-700 mb-1">ทีม 1 (ฝ่ายแดง)</label>
              <select 
                className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:bg-white transition-colors"
                value={form.team1}
                onChange={(e) => setForm({ ...form, team1: e.target.value })}
                disabled={!form.handLevel}
                required
              >
                <option value="">-- เลือกทีม --</option>
                {filteredTeams.map((t) => (
                  <option key={t._id} value={t._id}>{teamName(t)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-indigo-700 mb-1">ทีม 2 (ฝ่ายน้ำเงิน)</label>
              <select 
                className="w-full border rounded-lg px-3 py-2 bg-slate-50 focus:bg-white transition-colors"
                value={form.team2}
                onChange={(e) => setForm({ ...form, team2: e.target.value })}
                disabled={!form.handLevel}
                required
              >
                <option value="">-- เลือกทีม --</option>
                {filteredTeams.map((t) => (
                  <option key={t._id} value={t._id}>{teamName(t)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 my-4"></div>

          {/* Row 3: รายละเอียดเพิ่มเติม (Optional) */}
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">คอร์ท (Optional)</label>
                <input 
                  type="number"
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.court}
                  onChange={(e) => setForm({ ...form, court: e.target.value })}
                  placeholder="เช่น 1"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">เวลา (Optional)</label>
                <input 
                  type="datetime-local"
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                />
             </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={submitting || loading}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {submitting ? "กำลังบันทึก..." : "✅ ยืนยันสร้างแมตช์"}
          </button>

        </form>
      </div>
    </div>
  );
}