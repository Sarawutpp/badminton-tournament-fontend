// src/pages/admin/AdminMatchScoring.jsx
// (เวอร์ชันแก้ไข: บล็อกการกรอก, เพิ่มปุ่ม Edit)
import React, { useState, useEffect } from "react";
import { API, teamName } from "@/lib/api.js"; // <-- 1. แก้ไข path
import { HAND_LEVEL_OPTIONS } from "@/lib/types.js"; // <-- 2. Import มาตรฐาน

const pageSize = 24;

// Component ย่อยสำหรับ Pagination (เหมือนเดิม)
function Pagination({ page, pageSize, total, onPageChange, loading }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        className="px-3 py-2 border rounded-md bg-white shadow-sm disabled:opacity-50 flex items-center"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1 || loading}
      >
        <span>ก่อนหน้า</span>
      </button>
      <span className="text-sm text-gray-700">
        หน้า {page} / {totalPages} (รวม {total} รายการ)
      </span>
      <button
        className="px-3 py-2 border rounded-md bg-white shadow-sm disabled:opacity-50 flex items-center"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages || loading}
      >
        <span>ถัดไป</span>
      </button>
    </div>
  );
}

// ============ [!! START: ส่วนที่แก้ไข !!] ============

// Component ย่อยสำหรับแถวกรอกคะแนน (แก้ไขใหม่)
function MatchScoreRow({ m, loadData, setErr }) {
  const isKO = m.roundType === 'knockout';
  const maxSets = isKO ? 3 : 2;

  // State ใหม่: isEditing
  const [isEditing, setIsEditing] = React.useState(false);
  
  const [localSets, setLocalSets] = React.useState(() => {
    const s = m.sets?.map(set => ({ t1: set.t1 || 0, t2: set.t2 || 0 })) || [];
    while (s.length < maxSets) s.push({ t1: 0, t2: 0 });
    return s.slice(0, maxSets);
  });
  const [saving, setSaving] = React.useState(false);

  // แก้ไข 1: กำหนดว่าปุ่ม/ช่อง ควรกดได้หรือไม่
  // (ต้องไม่ Saving และ (สถานะต้องเป็น 'in-progress' หรือ กำลัง 'Editing'))
  const canEdit = !saving && (m.status === 'in-progress' || isEditing);

  function updateSetScore(index, team, value) {
    const v = parseInt(value, 10) || 0;
    const arr = [...localSets];
    arr[index] = { ...arr[index], [team]: v };
    setLocalSets(arr);
  }

  async function save() {
    setSaving(true);
    setErr(""); // ล้างLỗiเก่า
    try {
      await API.updateScore(m._id, { sets: localSets, status: 'finished' });
      setIsEditing(false); // ปิดโหมด Edit
      await loadData(); 
    } catch (e) {
      setErr(e.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-t hover:bg-slate-50">
      <td className="p-2 text-center font-medium">{m.matchNo ?? "-"}</td>
      <td className="p-2">{m.handLevel}{m.group ? ` / ${m.group}` : ""}</td>
      <td className="p-2">
        <div className="truncate max-w-[300px]">
          <strong>{teamName(m.team1)}</strong>
          <span className="text-slate-400"> vs </span>
          <strong>{teamName(m.team2)}</strong>
        </div>
        <div className="text-xs text-slate-500">
          ผลรวมเกม: {m.score1 || 0} - {m.score2 || 0}
          {m.winner && <span className="ml-2 text-green-600 font-bold">({teamName(m.winner)} ชนะ)</span>}
        </div>
      </td>

      {/* --- ช่องกรอก Set 1 --- */}
      <td className="p-2">
        <div className="flex items-center gap-2">
          <input
            className="border rounded px-2 py-1 w-16 text-center disabled:bg-gray-100 disabled:opacity-70"
            value={localSets[0].t1}
            onChange={e => updateSetScore(0, 't1', e.target.value)}
            disabled={!canEdit} // แก้ไข 2: ใช้ disabled={!canEdit}
          />
          <span>–</span>
          <input
            className="border rounded px-2 py-1 w-16 text-center disabled:bg-gray-100 disabled:opacity-70"
            value={localSets[0].t2}
            onChange={e => updateSetScore(0, 't2', e.target.value)}
            disabled={!canEdit} // แก้ไข 2: ใช้ disabled={!canEdit}
          />
        </div>
      </td>

      {/* --- ช่องกรอก Set 2 --- */}
      <td className="p-2">
        <div className="flex items-center gap-2">
          <input
            className="border rounded px-2 py-1 w-16 text-center disabled:bg-gray-100 disabled:opacity-70"
            value={localSets[1].t1}
            onChange={e => updateSetScore(1, 't1', e.target.value)}
            disabled={!canEdit} // แก้ไข 2: ใช้ disabled={!canEdit}
          />
          <span>–</span>
          <input
            className="border rounded px-2 py-1 w-16 text-center disabled:bg-gray-100 disabled:opacity-70"
            value={localSets[1].t2}
            onChange={e => updateSetScore(1, 't2', e.target.value)}
            disabled={!canEdit} // แก้ไข 2: ใช้ disabled={!canEdit}
          />
        </div>
      </td>

      {/* --- ช่องกรอก Set 3 (หรือหมายเหตุ) --- */}
      <td className="p-2">
        {isKO ? (
          <div className="flex items-center gap-2">
            <input
              className="border rounded px-2 py-1 w-16 text-center disabled:bg-gray-100 disabled:opacity-70"
              value={localSets[2].t1}
              onChange={e => updateSetScore(2, 't1', e.target.value)}
              disabled={!canEdit} // แก้ไข 2: ใช้ disabled={!canEdit}
            />
            <span>–</span>
            <input
              className="border rounded px-2 py-1 w-16 text-center disabled:bg-gray-100 disabled:opacity-70"
              value={localSets[2].t2}
              onChange={e => updateSetScore(2, 't2', e.target.value)}
              disabled={!canEdit} // แก้ไข 2: ใช้ disabled={!canEdit}
            />
          </div>
        ) : (
          <span className="text-xs text-slate-500">ผลรวม / เสมอได้</span>
        )}
      </td>
      <td className="p-2 text-center">
        {/* แก้ไข 3: ตรรกะการแสดงปุ่ม */}
        
        {/* ถ้าสถานะ 'in-progress' หรือ 'isEditing' -> แสดงปุ่ม Save */}
        {(m.status === 'in-progress' || isEditing) && (
          <button
            className="border rounded px-3 py-1 bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400"
            onClick={save}
            disabled={saving}
          >
            {saving ? "..." : "บันทึก"}
          </button>
        )}
        
        {/* ถ้าสถานะ 'finished' และ *ไม่ได้* Edit -> แสดงปุ่ม Edit */}
        {m.status === 'finished' && !isEditing && (
           <button
            className="border rounded px-3 py-1 bg-gray-500 text-white hover:bg-gray-600"
            onClick={() => setIsEditing(true)}
          >
            แก้ไข
          </button>
        )}
        
        {/* ถ้าสถานะ 'scheduled' -> แสดงข้อความ */}
        {m.status === 'scheduled' && !isEditing && (
          <span className="text-xs text-gray-500">รอแข่ง</span>
        )}
      </td>
    </tr>
  );
}
// ============ [!! END: ส่วนที่แก้ไข !!] ============

// Component หลัก
export default function AdminMatchScoring() {
  const [hand, setHand] = React.useState("");
  const [status, setStatus] = React.useState("in-progress"); 
  const [data, setData] = React.useState({ items: [], total: 0, page: 1, pageSize });
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");

  const load = async (page = 1) => {
    try {
      setLoading(true);
      setErr("");
      // แก้ไข 4: เปลี่ยน sort เป็น "matchNo" เพื่อให้เรียงตาม Master List
      const res = await API.listSchedule({
        page,
        pageSize,
        handLevel: hand,
        status,
        sort: "matchNo" // <-- เรียงตามลำดับ Master List
      });
      setData(res);
    } catch (e) {
      setErr(e.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, [hand, status]);

  return (
    <div className="p-2 md:p-6 space-y-4 max-w-full overflow-x-hidden">
      <h1 className="text-2xl font-bold">Match Scoring</h1>

      {/* --- Filter Bar --- */}
      <div className="bg-white rounded-xl shadow p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        <select
          className="border rounded px-2 py-2 w-full"
          value={hand}
          onChange={e => setHand(e.target.value)}
        >
          <option value="">ทุกระดับมือ</option>
          {/* 3. วนลูปจาก HAND_LEVEL_OPTIONS */}
          {HAND_LEVEL_OPTIONS.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
        
        {/* แก้ไข 5: อธิบายการทำงานของ Filter นี้ */}
        <select
          className="border rounded px-2 py-2 w-full"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="in-progress">กำลังแข่ง (เพื่อกรอกคะแนน)</option>
          <option value="finished">จบแล้ว (เพื่อดู/แก้ไข)</option>
          <option value="scheduled">รอแข่ง (ดูคิว)</option>
          <option value="">ทั้งหมด</option>
        </select>
        
        <button
          className="border rounded px-3 py-2 bg-blue-500 text-white flex items-center justify-center col-span-2 md:col-span-1"
          onClick={() => load(1)}
          disabled={loading}
        >
          <span className="ml-2">{loading ? "กำลังโหลด..." : "รีเฟรช"}</span>
        </button>
      </div>

      {err && <div className="text-red-600 bg-red-100 p-3 rounded-md">{err}</div>}

      {/* --- Table --- */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-[960px] w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-2 text-center w-20">ลำดับ</th>
              <th className="p-2 w-32">ระดับ/กลุ่ม</th>
              <th className="p-2">ทีม</th>
              <th className="p-2 w-48">Set 1 (T1-T2)</th>
              <th className="p-2 w-48">Set 2 (T1-T2)</th>
              <th className="p-2 w-48">Set 3 / หมายเหตุ</th>
              <th className="p-2 text-center w-24">บันทึก</th>
            </tr>
          </thead>
          <tbody>
            {loading && !data.items.length && (
              <tr><td colSpan={7} className="p-4 text-center text-slate-500">กำลังโหลด...</td></tr>
            )}
            {!loading && !data.items.length && (
              <tr><td colSpan={7} className="p-4 text-center text-slate-500">ไม่มีข้อมูลที่ตรงกับเงื่อนไข</td></tr>
            )}
            {data.items.map(m => (
              <MatchScoreRow key={m._id} m={m} loadData={() => load(data.page)} setErr={setErr} />
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Pagination --- */}
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        onPageChange={load}
        loading={loading}
      />
    </div>
  );
}