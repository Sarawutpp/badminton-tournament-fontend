// src/pages/admin/AdminMatchScoring.jsx
import React, { useState, useEffect } from "react";
import { API, teamName } from "@/lib/api.js";
import { HAND_LEVEL_OPTIONS } from "@/lib/types.js";

const pageSize = 24;

// ----------------- Helpers -----------------
function hasScore(m) {
  // เช็คจาก sets ก่อน
  if (Array.isArray(m.sets)) {
    const anySet = m.sets.some(
      (s) => (s?.t1 || 0) > 0 || (s?.t2 || 0) > 0
    );
    if (anySet) return true;
  }
  // เผื่อกรณีเก่า ที่เคยเก็บ score1/score2 ไว้
  if ((m.score1 || 0) > 0 || (m.score2 || 0) > 0) return true;
  return false;
}

function badgeForStatus(m) {
  if (m.status === "finished" && hasScore(m)) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        ✅ มีผลแล้ว
      </span>
    );
  }
  if (m.status === "finished" && !hasScore(m)) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
        ⚠️ จบแมตช์แล้ว รอกรอกผล
      </span>
    );
  }
  if (m.status === "in-progress") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
        🔵 กำลังแข่ง
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
      ⚪ รอแข่ง
    </span>
  );
}

function roundLabel(m) {
  if (m.roundType === "knockout") {
    return m.roundName || "Knockout";
  }
  if (m.group) return `Group ${m.group}`;
  return "รอบแบ่งกลุ่ม";
}

function handShort(level) {
  const opt = HAND_LEVEL_OPTIONS.find((x) => x.value === level);
  return opt?.labelShort || opt?.label || level || "-";
}

// ----------------- Main Page -----------------
export default function AdminMatchScoringPage() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    handLevel: "",
    group: "",
    q: "",
    roundType: "group",
    onlyFinished: false,
  });

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  async function load(p = 1) {
    setLoading(true);
    setErr("");
    try {
      const res = await API.listMatchesForScoring({
        page: p,
        pageSize,
        handLevel: filters.handLevel || undefined,
        group: filters.group || undefined,
        q: filters.q || undefined,
        roundType: filters.roundType || undefined,
        onlyFinished: filters.onlyFinished || undefined,
      });

      const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      setRows(items);
      setTotal(Number(res?.total ?? items.length));
      setPage(Number(res?.page ?? p));
    } catch (e) {
      console.error(e);
      setErr(e?.message || "โหลดข้อมูลล้มเหลว");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxPage =
    pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            กรอกผลการแข่งขัน (Admin Match Scoring)
          </h1>
          <p className="text-sm text-slate-500">
            กรอกผลเป็นรายเซ็ต ระบบจะคำนวณผู้ชนะ, แต้มรวม, และอัปเดตตารางคะแนนให้เอง
          </p>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 md:p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-3">
          <div>
            <label className="text-xs text-slate-500">ระดับมือ</label>
            <select
              className="border rounded px-2 py-2 w-full text-sm"
              value={filters.handLevel}
              onChange={(e) =>
                setFilters((f) => ({ ...f, handLevel: e.target.value }))
              }
            >
              <option value="">ทั้งหมด</option>
              {HAND_LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.labelShort || opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">กลุ่ม</label>
            <input
              className="border rounded px-2 py-2 w-full text-sm"
              placeholder="เช่น A, B, C..."
              value={filters.group}
              onChange={(e) =>
                setFilters((f) => ({ ...f, group: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">รอบ</label>
            <select
              className="border rounded px-2 py-2 w-full text-sm"
              value={filters.roundType}
              onChange={(e) =>
                setFilters((f) => ({ ...f, roundType: e.target.value }))
              }
            >
              <option value="group">รอบแบ่งกลุ่ม</option>
              <option value="knockout">รอบ Knockout</option>
              <option value="">ทั้งหมด</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">ค้นหา</label>
            <input
              className="border rounded px-2 py-2 w-full text-sm"
              placeholder="ชื่อทีม / Match ID"
              value={filters.q}
              onChange={(e) =>
                setFilters((f) => ({ ...f, q: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs md:text-sm text-slate-600">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded border-slate-300"
              checked={filters.onlyFinished}
              onChange={(e) =>
                setFilters((f) => ({ ...f, onlyFinished: e.target.checked }))
              }
            />
            แสดงเฉพาะแมตช์ที่สถานะ "จบแล้ว"
          </label>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border rounded-full text-xs md:text-sm"
              onClick={() => {
                setFilters({
                  handLevel: "",
                  group: "",
                  q: "",
                  roundType: "group",
                  onlyFinished: false,
                });
                load(1);
              }}
            >
              ล้างตัวกรอง
            </button>
            <button
              className="px-3 py-1 bg-slate-900 text-white rounded-full text-xs md:text-sm"
              onClick={() => load(1)}
              disabled={loading}
            >
              โหลดข้อมูล
            </button>
          </div>
        </div>
      </div>

      {err && (
        <div className="p-3 bg-red-50 text-sm text-red-600 rounded">
          {err}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-xs md:text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-2 text-center w-16">Match</th>
              <th className="p-2 text-left">คู่แข่ง</th>
              <th className="p-2 text-center w-24">ระดับ / กลุ่ม</th>
              <th className="p-2 text-center w-24">รอบ</th>
              <th className="p-2 text-center w-20">คอร์ท</th>
              <th className="p-2 text-center w-20">สถานะ</th>
              <th className="p-2 text-center w-28">Set 1</th>
              <th className="p-2 text-center w-28">Set 2</th>
              <th className="p-2 text-center w-28">Set 3</th>
              <th className="p-2 text-center w-28">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows && rows.length > 0 ? (
              rows.map((m) => (
                <MatchScoreRow
                  key={m._id}
                  m={m}
                  loadData={() => load(page)}
                  setErr={setErr}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan={10}
                  className="p-4 text-center text-slate-500"
                >
                  ยังไม่มีแมตช์ให้กรอกผล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs md:text-sm text-slate-600">
        <div>
          รวม {total} แมตช์ • หน้า {page}/{maxPage}
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 border rounded-full"
            disabled={loading || page <= 1}
            onClick={() => {
              const p = Math.max(1, page - 1);
              setPage(p);
              load(p);
            }}
          >
            ก่อนหน้า
          </button>
          <button
            className="px-3 py-1 border rounded-full"
            disabled={loading || page >= maxPage}
            onClick={() => {
              const p = Math.min(maxPage, page + 1);
              setPage(p);
              load(p);
            }}
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------- แถวคะแนนแต่ละแมตช์ -----------------
function MatchScoreRow({ m, loadData, setErr }) {
  const isKO = m.roundType === "knockout";
  const maxSets = isKO ? 3 : 3; // ตอนนี้ group ก็ให้ใส่ได้ 3 set เก็บเผื่อ tie-break

  const alreadyHasScore = hasScore(m);

  // ถ้า "จบแล้ว" แต่ยังไม่มีคะแนน -> เปิดโหมดแก้ไขให้เลย
  const [isEditing, setIsEditing] = React.useState(
    m.status === "finished" && !alreadyHasScore
  );

  const [localSets, setLocalSets] = React.useState(() => {
    const s =
      m.sets?.map((set) => ({ t1: set.t1 || 0, t2: set.t2 || 0 })) || [];
    while (s.length < maxSets) s.push({ t1: 0, t2: 0 });
    return s.slice(0, maxSets);
  });

  const [saving, setSaving] = React.useState(false);

  // แก้ logic: กรอกคะแนนได้เฉพาะแมตช์ที่จบแล้ว + กำลังแก้ไข
  const canEdit = !saving && m.status === "finished" && isEditing;

  function updateSetScore(index, team, value) {
    const v = parseInt(value, 10);
    const safe = Number.isNaN(v) ? 0 : v;
    const arr = [...localSets];
    arr[index] = { ...arr[index], [team]: safe };
    setLocalSets(arr);
  }

  async function save() {
    setSaving(true);
    setErr("");
    try {
      // trim ชุดเซ็ตที่เป็น 0-0 ออกก่อนส่ง
      const payloadSets = (localSets || []).filter(
        (s) => (s?.t1 || 0) > 0 || (s?.t2 || 0) > 0
      );

      const gamesToWin = 2; // Baby/BG/N/S: best of 3
      const allowDraw = !isKO; // รอบแบ่งกลุ่ม = true, รอบ knockout = false

      await API.updateScore(m._id, {
        sets: payloadSets,
        status: "finished",
        gamesToWin,
        allowDraw,
      });
      setIsEditing(false);
      await loadData();
    } catch (e) {
      setErr(e.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  // Badge แสดงสถานะย่อย
  let statusBadge = null;
  if (m.status === "finished") {
    if (hasScore(m)) {
      statusBadge = (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          ✅ มีผลแล้ว
        </span>
      );
    } else {
      statusBadge = (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
          ⚠️ ยังไม่กรอกผล
        </span>
      );
    }
  } else if (m.status === "in-progress") {
    statusBadge = (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
        🔵 กำลังแข่ง
      </span>
    );
  } else {
    statusBadge = (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
        ⚪ รอแข่ง
      </span>
    );
  }

  return (
    <tr className="border-t align-top">
      <td className="p-2 text-center">
        <div className="font-semibold text-slate-900">
          {m.matchNo ?? m.no ?? "-"}
        </div>
        <div className="text-[10px] text-slate-400">
          {m.matchId || m._id?.slice(-6)}
        </div>
      </td>
      <td className="p-2">
        <div className="font-medium text-slate-900">
          {teamName(m.team1) || m.team1?.name || "-"}
        </div>
        <div className="text-[11px] text-slate-500">vs</div>
        <div className="font-medium text-slate-900">
          {teamName(m.team2) || m.team2?.name || "-"}
        </div>
      </td>
      <td className="p-2 text-center">
        <div className="text-[11px] text-slate-500">ระดับ</div>
        <div className="font-semibold text-slate-900">
          {handShort(m.handLevel || m.level)}
        </div>
        {m.group && (
          <div className="text-[11px] text-slate-500">กลุ่ม {m.group}</div>
        )}
      </td>
      <td className="p-2 text-center">
        <div className="text-[11px] text-slate-500">รอบ</div>
        <div className="font-semibold text-slate-900">
          {roundLabel(m)}
        </div>
      </td>
      <td className="p-2 text-center">
        <div className="text-[11px] text-slate-500">คอร์ท</div>
        <div className="font-semibold text-slate-900">
          {m.court || "-"}
        </div>
      </td>
      <td className="p-2 text-center">
        <div className="text-[11px] text-slate-500">สถานะ</div>
        <div className="font-semibold text-slate-900">
          {m.status === "finished"
            ? "จบแล้ว"
            : m.status === "in-progress"
            ? "กำลังแข่ง"
            : "รอแข่ง"}
        </div>
        <div className="mt-1">{statusBadge}</div>
      </td>

      {/* Set 1 */}
      <td className="p-2">
        <div className="flex items-center gap-2">
          <input
            className="border rounded px-2 py-1 w-16 text-center disabled:bg-gray-100 disabled:opacity-70"
            value={localSets[0].t1}
            onChange={(e) => updateSetScore(0, "t1", e.target.value)}
            disabled={!canEdit}
          />
          <span>–</span>
          <input
            className="border rounded px-2 py-1 w-16 text-center disabled:bg-gray-100 disabled:opacity-70"
            value={localSets[0].t2}
            onChange={(e) => updateSetScore(0, "t2", e.target.value)}
            disabled={!canEdit}
          />
        </div>
      </td>

      {/* Set 2 */}
      <td className="p-2">
        <div className="flex items-center gap-2">
          <input
            className="border rounded px-2 py-1 w-16 text-center disabled:bg-gray-100 disabled:opacity-70"
            value={localSets[1].t1}
            onChange={(e) => updateSetScore(1, "t1", e.target.value)}
            disabled={!canEdit}
          />
          <span>–</span>
          <input
            className="border rounded px-2 py-1 w-16 text-center disabled:bg-gray-100 disabled:opacity-70"
            value={localSets[1].t2}
            onChange={(e) => updateSetScore(1, "t2", e.target.value)}
            disabled={!canEdit}
          />
        </div>
      </td>

      {/* Set 3 */}
      <td className="p-2">
        <div className="flex items-center gap-2">
          <input
            className="border rounded px-2 py-1 w-16 text-center disabled:bg-gray-100 disabled:opacity-70"
            value={localSets[2].t1}
            onChange={(e) => updateSetScore(2, "t1", e.target.value)}
            disabled={!canEdit}
          />
          <span>–</span>
          <input
            className="border rounded px-2 py-1 w-16 text-center disabled:bg-gray-100 disabled:opacity-70"
            value={localSets[2].t2}
            onChange={(e) => updateSetScore(2, "t2", e.target.value)}
            disabled={!canEdit}
          />
        </div>
      </td>

      <td className="p-2 text-center">
        {!canEdit && m.status !== "finished" && (
          <div className="text-[11px] text-slate-400">
            แก้ไขได้เมื่อสถานะเป็น "จบแล้ว"
          </div>
        )}
        {m.status === "finished" && !isEditing && (
          <button
            className="px-3 py-1 rounded-full border border-slate-300 text-xs hover:bg-slate-50"
            onClick={() => setIsEditing(true)}
            disabled={saving}
          >
            {alreadyHasScore ? "แก้ไขผล" : "กรอกผล"}
          </button>
        )}
        {canEdit && (
          <div className="flex flex-col gap-1 items-center">
            <button
              className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs hover:bg-emerald-700 disabled:opacity-70"
              onClick={save}
              disabled={saving}
            >
              {saving ? "กำลังบันทึก..." : "บันทึกผล"}
            </button>
            <button
              className="px-3 py-1 rounded-full border border-slate-300 text-[11px] hover:bg-slate-50"
              onClick={() => {
                setIsEditing(false);
                const s =
                  m.sets?.map((set) => ({
                    t1: set.t1 || 0,
                    t2: set.t2 || 0,
                  })) || [];
                while (s.length < maxSets) s.push({ t1: 0, t2: 0 });
                setLocalSets(s.slice(0, maxSets));
              }}
              disabled={saving}
            >
              ยกเลิก
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
