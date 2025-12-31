// src/pages/admin/ShuttlecockManagement.jsx
import React, { useEffect, useState, useMemo } from "react";
import { API } from "@/lib/api";
import { useTournament } from "@/contexts/TournamentContext";

export default function ShuttlecockManagementPage() {
  const { selectedTournament, loadTournament } = useTournament(); // loadTournament เพื่อรีเฟรช context หลังแก้ค่า

  // Data State
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  // Config State
  const [config, setConfig] = useState({
    pricePerCoupon: 50,
    quotaSingle: 5,   // เดี่ยว
    quotaDouble: 10   // คู่
  });
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Search State
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Load Data
  useEffect(() => {
    if (selectedTournament) {
      loadTeams();
      
      // Load Settings from Tournament Context
      const s = selectedTournament.settings?.shuttlecock;
      if (s) {
        setConfig({
          pricePerCoupon: s.pricePerCoupon ?? 50,
          quotaSingle: s.quotaSingle ?? 5,
          quotaDouble: s.quotaDouble ?? 10
        });
      }
    }
  }, [selectedTournament]);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const res = await API.listTeams(); 
      const data = Array.isArray(res) ? res : res.data || [];
      
      // เรียงข้อมูล: กลุ่ม -> ชื่อทีม
      data.sort((a, b) => (a.group || "").localeCompare(b.group || "") || a.teamName.localeCompare(b.teamName));
      setTeams(data);
    } catch (error) {
      console.error("Failed to load teams", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Save Config Handler
  const handleSaveConfig = async () => {
    if (!selectedTournament) return;
    setSavingConfig(true);
    try {
      await API.updateTournament(selectedTournament._id, {
        settings: {
          shuttlecock: config
        }
      });
      setIsEditingConfig(false);
      
      // รีเฟรช Context เพื่อให้ค่าอัปเดตไปทั่วแอป (สำคัญ)
      if (typeof loadTournament === 'function') {
         // ถ้าใน Context มี function ให้ reload ก็เรียกใช้
         // หรือถ้าไม่มี ก็ไม่เป็นไร เพราะ state 'config' ในหน้านี้อัปเดตแล้ว
      }
      
      alert("บันทึกการตั้งค่าเรียบร้อย ✅");
    } catch (e) {
      alert("บันทึกไม่สำเร็จ: " + e.message);
    } finally {
      setSavingConfig(false);
    }
  };

  // 3. Logic: ตรวจสอบประเภททีม (เดี่ยว/คู่)
  const getTeamTypeAndQuota = (team) => {
    const playerCount = team.players?.length || 0;
    
    // Logic: ดูชื่อรุ่น (เช่น "Single", "เดี่ยว") หรือดูจำนวนคน
    const isSingleByName = /single|เดี่ยว|CN|SN|NB/i.test(team.handLevel || "");
    const isSingle = playerCount === 1 || isSingleByName;

    return {
        type: isSingle ? "SINGLE" : "DOUBLE",
        label: isSingle ? "เดี่ยว" : "คู่",
        quota: isSingle ? config.quotaSingle : config.quotaDouble
    };
  };

  // 4. Calculation Logic
  const calculateBill = (team) => {
    const { label, quota, type } = getTeamTypeAndQuota(team);
    const used = team.couponsUsed || 0;
    const balance = quota - used;
    const isNegative = balance < 0;
    const amount = Math.abs(balance) * config.pricePerCoupon;

    return {
      type,
      typeLabel: label,
      quota,
      used,
      balance,
      amount,
      status: isNegative ? "PAY" : "REFUND",
      label: isNegative ? `เก็บเพิ่ม ${amount.toLocaleString()} บ.` : `คืนเงิน ${amount.toLocaleString()} บ.`
    };
  };

  // 5. Filter Logic (Search)
  const filteredTeams = useMemo(() => {
    if (!searchTerm) return teams;
    const lower = searchTerm.toLowerCase();
    return teams.filter(t => 
      t.teamName.toLowerCase().includes(lower) || 
      (t.players && t.players.some(p => (p.fullName||"").toLowerCase().includes(lower) || (p.nickname||"").toLowerCase().includes(lower)))
    );
  }, [teams, searchTerm]);

  // Totals
  const totalIncome = teams.reduce((acc, t) => {
     const { balance, amount } = calculateBill(t);
     return balance < 0 ? acc + amount : acc;
  }, 0);

  const totalRefund = teams.reduce((acc, t) => {
     const { balance, amount } = calculateBill(t);
     return balance > 0 ? acc + amount : acc;
  }, 0);

  return (
    <div className="p-3 md:p-6 space-y-6 pb-20">
      
      {/* --- HEADER & CONFIG --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            🏸 สรุปค่าลูกแบด <span className="text-sm font-normal text-slate-500">(Shuttlecock Manager)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
             คำนวณเงิน: (โควตาเดี่ยว {config.quotaSingle} / คู่ {config.quotaDouble} - ใช้จริง) x {config.pricePerCoupon} บาท
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          {isEditingConfig ? (
             <div className="flex items-center gap-3 text-sm animate-in fade-in slide-in-from-right duration-200 px-2">
                <div className="flex flex-col">
                    <label className="text-[10px] text-slate-500 font-bold text-indigo-600">โควตาเดี่ยว</label>
                    <input 
                      type="number" 
                      className="w-14 border rounded px-1 py-0.5 text-center font-bold"
                      value={config.quotaSingle}
                      onChange={e => setConfig({...config, quotaSingle: Number(e.target.value)})}
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] text-slate-500 font-bold text-indigo-600">โควตาคู่</label>
                    <input 
                      type="number" 
                      className="w-14 border rounded px-1 py-0.5 text-center font-bold"
                      value={config.quotaDouble}
                      onChange={e => setConfig({...config, quotaDouble: Number(e.target.value)})}
                    />
                </div>
                <div className="w-px h-8 bg-slate-300 mx-1"></div>
                <div className="flex flex-col">
                    <label className="text-[10px] text-slate-500">ราคา/ใบ</label>
                    <input 
                      type="number" 
                      className="w-14 border rounded px-1 py-0.5 text-center font-bold"
                      value={config.pricePerCoupon}
                      onChange={e => setConfig({...config, pricePerCoupon: Number(e.target.value)})}
                    />
                </div>
                <button 
                  onClick={handleSaveConfig}
                  disabled={savingConfig}
                  className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs hover:bg-emerald-700 shadow-sm ml-1"
                >
                  {savingConfig ? "..." : "บันทึก"}
                </button>
                <button 
                  onClick={() => setIsEditingConfig(false)}
                  className="text-slate-400 hover:text-slate-600 px-1"
                >
                  ❌
                </button>
             </div>
          ) : (
             <div className="flex items-center gap-4 px-2">
                <div className="text-center">
                    <div className="text-[10px] text-slate-500">เดี่ยว</div>
                    <div className="font-bold text-indigo-700">{config.quotaSingle} ใบ</div>
                </div>
                <div className="w-px h-6 bg-slate-200"></div>
                <div className="text-center">
                    <div className="text-[10px] text-slate-500">คู่</div>
                    <div className="font-bold text-indigo-700">{config.quotaDouble} ใบ</div>
                </div>
                <div className="w-px h-6 bg-slate-200"></div>
                <div className="text-center">
                    <div className="text-[10px] text-slate-500">ราคา</div>
                    <div className="font-bold text-emerald-600">{config.pricePerCoupon} บ.</div>
                </div>
                <button 
                  onClick={() => setIsEditingConfig(true)}
                  className="ml-2 bg-white border border-slate-200 p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                  title="ตั้งค่า"
                >
                  ⚙️
                </button>
             </div>
          )}
        </div>
      </div>

      {/* --- DASHBOARD CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Box */}
        <div className="md:col-span-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
           <label className="text-xs text-slate-500 mb-1 font-semibold">🔍 ค้นหาทีม</label>
           <input 
             type="text"
             className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
             placeholder="พิมพ์ชื่อทีม / ชื่อนักกีฬา..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>

        {/* Totals */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-red-500">
          <div className="text-xs text-slate-500 mb-1">ยอดต้องเก็บเพิ่มรวม (Income)</div>
          <div className="text-2xl font-bold text-red-600">
            {totalIncome.toLocaleString()} <span className="text-sm text-slate-400 font-normal">บาท</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
          <div className="text-xs text-slate-500 mb-1">ยอดต้องคืนเงินรวม (Refund)</div>
          <div className="text-2xl font-bold text-emerald-600">
            {totalRefund.toLocaleString()} <span className="text-sm text-slate-400 font-normal">บาท</span>
          </div>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="p-4 w-10">#</th>
                <th className="p-4">ทีม / นักกีฬา</th>
                <th className="p-4 text-center">ประเภท</th>
                <th className="p-4 text-center">โควตา</th>
                <th className="p-4 text-center">ใช้ไป</th>
                <th className="p-4 text-center">คงเหลือ (ใบ)</th>
                <th className="p-4 text-right">ยอดเงินสุทธิ</th>
                <th className="p-4 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="8" className="p-12 text-center text-slate-400">กำลังโหลดข้อมูล...</td></tr>
              ) : filteredTeams.length === 0 ? (
                <tr><td colSpan="8" className="p-12 text-center text-slate-400">ไม่พบทีมที่ค้นหา</td></tr>
              ) : (
                filteredTeams.map((team, index) => {
                  const { quota, used, balance, label, status, amount, typeLabel, type } = calculateBill(team);
                  const isSingle = type === "SINGLE";

                  return (
                    <tr key={team._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 text-slate-400 text-xs">{index + 1}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 text-base">{team.teamName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                           <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold">{team.handLevel}</span>
                           {team.group && <span className="ml-1 text-slate-400">Group {team.group}</span>}
                        </div>
                        {/* รายชื่อนักกีฬา */}
                        <div className="text-[11px] text-slate-400 mt-1">
                           {team.players?.map(p => p.nickname || p.fullName).join(" / ")}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                         {isSingle ? (
                            <span className="text-[10px] bg-sky-50 text-sky-600 px-2 py-1 rounded border border-sky-100">{typeLabel}</span>
                         ) : (
                            <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded border border-purple-100">{typeLabel}</span>
                         )}
                      </td>
                      <td className="p-4 text-center text-slate-400 text-xs">
                         {quota}
                      </td>
                      <td className="p-4 text-center">
                         <span className="text-lg font-medium text-slate-700">{used}</span>
                      </td>
                      <td className={`p-4 text-center`}>
                         <span className={`text-lg font-bold ${balance < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                           {balance > 0 ? `+${balance}` : balance}
                         </span>
                      </td>
                      <td className="p-4 text-right font-medium">
                        {amount > 0 ? (
                             <span className={status === "PAY" ? "text-red-600" : "text-emerald-600"}>
                                {amount.toLocaleString()} บ.
                             </span>
                        ) : (
                            <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {amount === 0 ? (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                ครบถ้วน
                             </span>
                        ) : status === "PAY" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                            จ่ายเพิ่ม
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                            คืนเงิน
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}