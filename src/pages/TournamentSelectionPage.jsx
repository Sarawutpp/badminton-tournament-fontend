// src/pages/TournamentSelectionPage.jsx
import React, { useEffect, useState } from 'react';
import { API } from '../lib/api';
import { useTournament } from '../contexts/TournamentContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function TournamentSelectionPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { selectTournament } = useTournament();
  const { user } = useAuth(); 
  const navigate = useNavigate();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form State (Default Form Data)
  const [formData, setFormData] = useState({
    name: "", 
    location: "", 
    maxScore: 21, 
    totalCourts: 4, 
    categoriesStr: "Hand-P, Hand-S, Hand-Baby",
    mode: "Standard", // Standard หรือ Mini
    qualificationType: "TOP2_UPPER_REST_LOWER" 
  });

  const fetchTournaments = () => {
    setLoading(true);
    API.listTournaments()
      .then((data) => setTournaments(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTournaments(); }, []);

  const handleSelect = (t) => {
    selectTournament(t);
    if (user && user.role === 'admin') {
        navigate('/admin/standings');
    } else {
        navigate('/public/running');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
        const categories = formData.categoriesStr.split(",").map(s=>s.trim()).filter(s=>s!=="");
        const maxScoreNum = Number(formData.maxScore) || 21;
        
        let settingsPayload = {};
        let rulesPayload = {};

        if (formData.mode === "Mini") {
            // ==========================================
            // 🎯 MINI TOURNAMENT (สูตรใหม่)
            // ==========================================
            settingsPayload = {
                maxScore: maxScoreNum,
                totalCourts: Number(formData.totalCourts),
                categories,
                qualificationType: "MINI_SPLIT", // สูตรแบ่งสายบน/ล่าง + ที่ 5
                matchConfig: {
                    groupStage: { 
                        gamesToWin: 1,      // 1 เกมจบ
                        maxScore: maxScoreNum, 
                        hasDeuce: false,    // ❌ ไม่มีดิวส์
                        deuceCap: maxScoreNum,
                        allowDraw: false    // ❌ ห้ามเสมอ
                    },
                    knockoutStage: { 
                        gamesToWin: 2,      // 2 ใน 3
                        maxScore: maxScoreNum, 
                        hasDeuce: false,    // ❌ ไม่มีดิวส์ (ตามโจทย์)
                        deuceCap: maxScoreNum
                    }
                }
            };
            rulesPayload = { pointsWin: 3, pointsDraw: 1, pointsLose: 0 };
        } else {
            // ==========================================
            // 🏸 STANDARD TOURNAMENT (สูตรใหม่)
            // ==========================================
            settingsPayload = {
                maxScore: maxScoreNum,
                totalCourts: Number(formData.totalCourts),
                categories,
                qualificationType: formData.qualificationType, 
                matchConfig: {
                    groupStage: { 
                        gamesToWin: 2,      // เล่น 2 เซ็ต (BO2)
                        maxScore: maxScoreNum, 
                        hasDeuce: false,    // ❌ ไม่มีดิวส์ (ตามโจทย์ใหม่)
                        deuceCap: maxScoreNum,
                        allowDraw: true     // ✅ เสมอได้ (1-1)
                    },
                    knockoutStage: { 
                        gamesToWin: 2,      // 2 ใน 3
                        maxScore: maxScoreNum, 
                        hasDeuce: true,     // ✅ มีดิวส์
                        deuceCap: 30
                    }
                }
            };
            // คะแนน: ชนะ 3 / เสมอ 1 / แพ้ 0
            rulesPayload = { pointsWin: 3, pointsDraw: 1, pointsLose: 0 };
        }

        const payload = {
            name: formData.name,
            location: formData.location,
            dateRange: new Date().getFullYear().toString(),
            settings: settingsPayload,
            rules: rulesPayload
        };

        const newTournament = await API.createTournament(payload);
        selectTournament(newTournament);
        setIsModalOpen(false);
        navigate('/admin/standings'); 

    } catch(err) {
        alert("Error creating tournament: " + err.message);
    } finally {
        setCreating(false);
    }
  };

  if (loading && tournaments.length === 0) return <div className="p-10 text-center text-gray-500">Loading tournaments...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-20 px-4 relative">
      
      {/* --- Header Section --- */}
      <div className="max-w-5xl w-full flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">🏸 รายการแข่งขัน</h1>
            <p className="text-gray-500 text-sm mt-1">เลือกรายการเพื่อดูผลหรือจัดการข้อมูล</p>
        </div>
        
        <div className="flex gap-3">
            {!user && (
                <button 
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 font-medium shadow-sm transition-colors"
                >
                    เข้าสู่ระบบผู้จัด
                </button>
            )}

            {user && user.role === 'admin' && (
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2 font-medium"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    สร้างรายการใหม่
                </button>
            )}
        </div>
      </div>
      
      {/* --- Tournament Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full pb-20">
        {tournaments.length === 0 ? (
            <div className="col-span-full text-center py-10 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                <p className="text-gray-400">ยังไม่มีรายการแข่งขัน</p>
            </div>
        ) : (
            tournaments.map((t) => (
            <div 
                key={t._id} 
                onClick={() => handleSelect(t)}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer border border-gray-200 group relative overflow-hidden flex flex-col justify-between h-[200px]"
            >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 group-hover:bg-indigo-600 transition-colors"></div>
                
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-indigo-700 transition-colors line-clamp-2">
                    {t.name}
                    </h2>
                    <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                        <span className="inline-block">📍</span> {t.location || 'ไม่ระบุสถานที่'}
                    </p>
                    
                    <div className="text-xs text-gray-400 space-y-1 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <div className="flex justify-between">
                            <span>รูปแบบ:</span> 
                            <span className="font-medium text-gray-600">
                                {t.settings?.matchConfig?.groupStage?.gamesToWin === 1 ? 'Mini (1 เกม)' : 'Standard (BO2)'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>สนาม:</span> <span className="font-medium text-gray-600">{t.settings?.totalCourts || 4} คอร์ท</span>
                        </div>
                    </div>
                </div>
                
                <div className="mt-4">
                    <div className="flex flex-wrap gap-1 mb-2">
                        {(t.settings?.categories || []).slice(0, 3).map(c => (
                            <span key={c} className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded border border-indigo-100">{c}</span>
                        ))}
                    </div>
                    <div className="absolute top-4 right-4">
                        <span className={`text-[10px] px-2 py-1 rounded-full font-medium border ${
                            t.status === 'finished' 
                            ? 'bg-gray-100 text-gray-500 border-gray-200' 
                            : 'bg-green-50 text-green-700 border-green-200'
                        }`}>
                            {t.status === 'finished' ? 'จบแล้ว' : 'Active'}
                        </span>
                    </div>
                </div>
            </div>
            ))
        )}
      </div>

      {/* --- Create Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-white px-6 py-4 border-b flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="text-indigo-600 text-xl">✨</span> สร้างทัวร์นาเมนต์ใหม่
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 rounded-full hover:bg-gray-100 transition-colors">&times;</button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-5 overflow-y-auto">
               
               {/* 1. General Info */}
               <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1">ข้อมูลทั่วไป</h4>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อรายการแข่งขัน <span className="text-red-500">*</span></label>
                        <input required type="text" placeholder="เช่น Badminton Fun Cup 2025" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">สถานที่จัดงาน</label>
                        <input type="text" placeholder="เช่น สนามแบดมินตัน..." className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                            value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                    </div>
               </div>

               {/* 2. Game Rules (Updated!) */}
               <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1">กติกาการแข่งขัน (Rules)</h4>
                    
                    {/* Mode Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">รูปแบบการแข่งขัน (Mode)</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.mode}
                            onChange={e => setFormData({...formData, mode: e.target.value})}
                        >
                            <option value="Standard">Standard (กลุ่ม 2 เซ็ต ไม่มีดิวส์ / KO มีดิวส์)</option>
                            <option value="Mini">Mini (กลุ่ม 1 เกม / KO ไม่มีดิวส์ / มีแมตช์ที่ 5)</option>
                        </select>
                        <p className="text-[10px] text-gray-400 mt-1">
                            {formData.mode === 'Mini' 
                                ? 'ชนะได้ 3 แต้ม, รอบแบ่งกลุ่มเล่นเซ็ตเดียว, มีแมตช์ชิงที่ 5' 
                                : 'ชนะได้ 3 แต้ม, เสมอ 1 แต้ม, รอบแบ่งกลุ่มเล่น 2 เซ็ต'}
                        </p>
                    </div>

                    {/* Qualification Type (Only show if Standard, or auto-hide for Mini logic inside) */}
                    {formData.mode === "Standard" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">การเข้ารอบ (Knockout)</label>
                            <select 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.qualificationType}
                                onChange={e => setFormData({...formData, qualificationType: e.target.value})}
                            >
                                <option value="TOP2_UPPER_REST_LOWER">ปกติ (บน 1-2 / ล่าง 3-4)</option>
                                <option value="TOP2_PLUS_4BEST_3RD">24 ทีม (บน 16 ทีม / ล่าง 8 ทีม)</option>
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">คะแนนเต็ม (Max Score)</label>
                            <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                value={formData.maxScore} onChange={e=>setFormData({...formData, maxScore:e.target.value})}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนคอร์ท</label>
                            <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                value={formData.totalCourts} onChange={e=>setFormData({...formData, totalCourts:e.target.value})}/>
                        </div>
                    </div>
               </div>

               {/* 3. Categories */}
               <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2 mb-3">ประเภทการแข่งขัน</h4>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categories (คั่นด้วยจุลภาค)</label>
                    <textarea 
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                        value={formData.categoriesStr} 
                        onChange={e=>setFormData({...formData, categoriesStr:e.target.value})}
                        placeholder="เช่น Hand-P, Hand-S, Hand-Baby"
                    />
               </div>

               {/* Action Buttons */}
               <div className="pt-2 flex gap-3 border-t mt-2">
                <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors" 
                    disabled={creating}
                >
                    ยกเลิก
                </button>
                <button 
                    type="submit" 
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed" 
                    disabled={creating}
                >
                    {creating ? "กำลังสร้าง..." : "ยืนยันการสร้าง"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}