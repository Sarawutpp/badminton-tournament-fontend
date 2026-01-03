// src/pages/TournamentSelectionPage.jsx
import React, { useEffect, useState } from "react";
import { API } from "../lib/api";
import { useTournament } from "../contexts/TournamentContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function TournamentSelectionPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  const { selectTournament } = useTournament();
  const { user } = useAuth(); // เช็ค user role ตรงนี้
  const navigate = useNavigate();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // State สำหรับเก็บ ID ตัวที่กำลังแก้ไข (ถ้าเป็น null แปลว่าสร้างใหม่)
  const [editingId, setEditingId] = useState(null);

  // Form State (Default Form Data)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    maxScore: 21,
    totalCourts: 4,
    categoriesStr: "Hand-P, Hand-S, Hand-Baby",
    mode: "Standard", // Standard หรือ Mini
    qualificationType: "TOP2_UPPER_REST_LOWER",
    isPublic: true, // ✅ [NEW] Default เป็น Public
  });

  const fetchTournaments = () => {
    setLoading(true);

    // ✅ [NEW] Logic: ถ้าไม่ใช่ Admin ให้ดึงเฉพาะ Public
    // หมายเหตุ: ต้องมั่นใจว่า API.listTournaments รองรับการรับ parameter (query string)
    // ถ้า API ของคุณไม่รับ argument ให้ไปแก้ไฟล์ api.js ให้รับ params แล้วส่งต่อ axios.get(url + params) นะครับ
    const isAdmin = user && user.role === "admin";
    const query = isAdmin ? "" : "?publicOnly=true";

    API.listTournaments(query)
      .then((data) => setTournaments(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  // ✅ [MODIFIED] เพิ่ม user ใน dependency เพื่อให้โหลดใหม่ตอน Login/Logout หรือ User State เปลี่ยน
  useEffect(() => {
    fetchTournaments();
  }, [user]);

  // Reset Form เมื่อปิด Modal
  useEffect(() => {
    if (!isModalOpen) {
      setEditingId(null);
      setFormData({
        name: "",
        location: "",
        maxScore: 21,
        totalCourts: 4,
        categoriesStr: "Hand-P, Hand-S, Hand-Baby",
        mode: "Standard",
        qualificationType: "TOP2_UPPER_REST_LOWER",
        isPublic: true, // ✅ Reset
      });
    }
  }, [isModalOpen]);

  const handleSelect = (t) => {
    selectTournament(t);
    if (user && user.role === "admin") {
      navigate("/admin/standings");
    } else {
      navigate("/public/running");
    }
  };

  // ฟังก์ชันกดปุ่มแก้ไข (Gear Icon)
  const handleEditClick = (e, t) => {
    e.stopPropagation(); // ป้องกันไม่ให้มันไป trigger การเลือกทัวร์นาเมนต์
    setEditingId(t._id);

    // แปลงข้อมูลเดิมมาใส่ Form
    const isMini = t.settings?.matchConfig?.groupStage?.gamesToWin === 1;

    setFormData({
      name: t.name,
      location: t.location || "",
      maxScore: t.settings?.maxScore || 21,
      totalCourts: t.settings?.totalCourts || 4,
      categoriesStr: (t.settings?.categories || []).join(", "),
      mode: isMini ? "Mini" : "Standard",
      qualificationType:
        t.settings?.qualificationType || "TOP2_UPPER_REST_LOWER",
      isPublic: t.isPublic !== undefined ? t.isPublic : true, // ✅ Load ค่าเดิม
    });

    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const categories = formData.categoriesStr
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");
      const maxScoreNum = Number(formData.maxScore) || 21;

      // เตรียม Settings Payload
      let settingsPayload = {
        maxScore: maxScoreNum,
        totalCourts: Number(formData.totalCourts),
        categories,
        qualificationType: formData.qualificationType,
      };

      // Logic เลือก Config ตาม Mode (Standard/Mini)
      if (formData.mode === "Mini") {
        settingsPayload.qualificationType = "MINI_SPLIT";
        settingsPayload.matchConfig = {
          groupStage: {
            gamesToWin: 1,
            maxScore: maxScoreNum,
            hasDeuce: false,
            deuceCap: maxScoreNum,
            allowDraw: false,
          },
          knockoutStage: {
            gamesToWin: 2,
            maxScore: maxScoreNum,
            hasDeuce: false,
            deuceCap: maxScoreNum,
          },
        };
      } else {
        settingsPayload.matchConfig = {
          groupStage: {
            gamesToWin: 2,
            maxScore: maxScoreNum,
            hasDeuce: false,
            deuceCap: maxScoreNum,
            allowDraw: true,
          },
          knockoutStage: {
            gamesToWin: 2,
            maxScore: maxScoreNum,
            hasDeuce: true,
            deuceCap: 30,
          },
        };
      }

      const payload = {
        name: formData.name,
        location: formData.location,
        isPublic: formData.isPublic, // ✅ ส่งค่า isPublic ไป Backend
        dateRange: new Date().getFullYear().toString(),
        settings: settingsPayload,
        // ส่ง rules ไปเฉพาะตอนสร้างใหม่
        ...(editingId
          ? {}
          : { rules: { pointsWin: 3, pointsDraw: 1, pointsLose: 0 } }),
      };

      if (editingId) {
        // === UPDATE MODE ===
        await API.updateTournament(editingId, payload);
      } else {
        // === CREATE MODE ===
        const newTournament = await API.createTournament(payload);
        selectTournament(newTournament);
      }

      fetchTournaments(); // โหลดข้อมูลใหม่
      setIsModalOpen(false);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && tournaments.length === 0)
    return (
      <div className="p-10 text-center text-gray-500">
        Loading tournaments...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-20 px-4 relative">
      {/* --- Header Section --- */}
      <div className="max-w-5xl w-full flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🏸 รายการแข่งขัน</h1>
          <p className="text-gray-500 text-sm mt-1">
            เลือกรายการเพื่อดูผลหรือจัดการข้อมูล
          </p>
        </div>

        <div className="flex gap-3">
          {!user && (
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 font-medium shadow-sm transition-colors"
            >
              เข้าสู่ระบบผู้จัด
            </button>
          )}

          {user && user.role === "admin" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2 font-medium"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
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
          tournaments.map((t) => {
            // Safety Check: ถ้าไม่ใช่ Admin และเป็น Hidden ไม่ต้องแสดง (ป้องกัน Frontend หลุด)
            if (user?.role !== "admin" && !t.isPublic) return null;

            return (
              <div
                key={t._id}
                onClick={() => handleSelect(t)}
                className={`bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer border border-gray-200 group relative overflow-hidden flex flex-col justify-between h-[200px] 
                  ${!t.isPublic ? "opacity-80 bg-gray-50" : ""}`} // ✅ Dim การ์ดถ้า Hidden
              >
                <div
                  className={`absolute top-0 left-0 w-1.5 h-full transition-colors 
                  ${
                    !t.isPublic
                      ? "bg-gray-400"
                      : "bg-indigo-500 group-hover:bg-indigo-600"
                  }`}
                ></div>

                {/* ✅ Badge Hidden */}
                {user?.role === "admin" && !t.isPublic && (
                  <div className="absolute top-3 right-12 px-2 py-0.5 bg-gray-600 text-white text-[10px] rounded-md z-10 opacity-90">
                    Hidden 👁️‍🗨️
                  </div>
                )}

                {/* 🔒 ปุ่มแก้ไข (แสดงเฉพาะ Admin) */}
                {user && user.role === "admin" && (
                  <button
                    onClick={(e) => handleEditClick(e, t)}
                    className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors z-10"
                    title="แก้ไขการตั้งค่า"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                )}

                <div>
                  <h2
                    className={`text-xl font-bold mb-1 transition-colors line-clamp-2 pr-8 
                    ${
                      !t.isPublic
                        ? "text-gray-500"
                        : "text-gray-800 group-hover:text-indigo-700"
                    }`}
                  >
                    {t.name}
                  </h2>
                  <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                    <span className="inline-block">📍</span>{" "}
                    {t.location || "ไม่ระบุสถานที่"}
                  </p>

                  <div className="text-xs text-gray-400 space-y-1 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <div className="flex justify-between">
                      <span>รูปแบบ:</span>
                      <span className="font-medium text-gray-600">
                        {t.settings?.matchConfig?.groupStage?.gamesToWin === 1
                          ? "Mini (1 เกม)"
                          : "Standard (BO2)"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>สนาม:</span>{" "}
                      <span className="font-medium text-gray-600">
                        {t.settings?.totalCourts || 4} คอร์ท
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(t.settings?.categories || []).slice(0, 3).map((c) => (
                      <span
                        key={c}
                        className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded border border-indigo-100"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="absolute top-4 right-4">
                    {/* (สถานะ Active/Finished เดิม) - ปรับตำแหน่งนิดหน่อยถ้าชนปุ่ม Edit */}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- Modal (Create & Edit) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-white px-6 py-4 border-b flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="text-indigo-600 text-xl">
                  {editingId ? "⚙️" : "✨"}
                </span>
                {editingId ? "แก้ไขการตั้งค่า" : "สร้างทัวร์นาเมนต์ใหม่"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5 overflow-y-auto"
            >
              {/* 1. General Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1">
                  ข้อมูลทั่วไป
                </h4>

                {/* ✅ [NEW] Toggle Visibility */}
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-800">
                      การแสดงผล (Visibility)
                    </label>
                    <p className="text-xs text-gray-500">
                      {formData.isPublic
                        ? "🟢 สาธารณะ (ทุกคนมองเห็น)"
                        : "👁️‍🗨️ ซ่อน (เฉพาะ Admin เห็น)"}
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.isPublic}
                      onChange={(e) =>
                        setFormData({ ...formData, isPublic: e.target.checked })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อรายการแข่งขัน <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="เช่น Badminton Fun Cup 2025"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    สถานที่จัดงาน
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น สนามแบดมินตัน..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* 2. Game Rules */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1">
                  กติกาการแข่งขัน (Rules)
                </h4>

                {/* Mode Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รูปแบบการแข่งขัน (Mode)
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.mode}
                    onChange={(e) =>
                      setFormData({ ...formData, mode: e.target.value })
                    }
                  >
                    <option value="Standard">
                      Standard (กลุ่ม 2 เซ็ต / KO มีดิวส์)
                    </option>
                    <option value="Mini">
                      Mini (กลุ่ม 1 เกม / KO ไม่มีดิวส์)
                    </option>
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {formData.mode === "Mini"
                      ? "ชนะได้ 3 แต้ม, รอบแบ่งกลุ่มเล่นเซ็ตเดียว, มีแมตช์ชิงที่ 5"
                      : "ชนะได้ 3 แต้ม, เสมอ 1 แต้ม, รอบแบ่งกลุ่มเล่น 2 เซ็ต"}
                  </p>
                </div>

                {/* Qualification Type */}
                {formData.mode === "Standard" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      การเข้ารอบ (Knockout)
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.qualificationType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          qualificationType: e.target.value,
                        })
                      }
                    >
                      <option value="TOP2_UPPER_REST_LOWER">
                        ปกติ (บน 1-2 / ล่าง 3-4)
                      </option>
                      <option value="TOP2_PLUS_4BEST_3RD">
                        24 ทีม (บน 16 ทีม / ล่าง 8 ทีม)
                      </option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      คะแนนเต็ม (Max Score)
                    </label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={formData.maxScore}
                      onChange={(e) =>
                        setFormData({ ...formData, maxScore: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      จำนวนคอร์ท
                    </label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={formData.totalCourts}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalCourts: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* 3. Categories */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2 mb-3">
                  ประเภทการแข่งขัน
                </h4>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categories (คั่นด้วยจุลภาค)
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  value={formData.categoriesStr}
                  onChange={(e) =>
                    setFormData({ ...formData, categoriesStr: e.target.value })
                  }
                  placeholder="เช่น Hand-P, Hand-S, Hand-Baby"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3 border-t mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  disabled={submitting}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting
                    ? "กำลังบันทึก..."
                    : editingId
                    ? "บันทึกการแก้ไข"
                    : "ยืนยันการสร้าง"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
