// src/pages/admin/Players.jsx
// (เวอร์ชันที่แปลเป็น Tailwind CSS แล้ว)

import React from "react";
import { API } from "@/lib/api.js";

const genCode = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

// --- Helper Components (ใช้ซ้ำ) ---
function Button({ children, onClick, disabled, variant = "primary" }) {
  const base = "px-4 py-2 rounded-lg font-semibold text-sm shadow-sm transition-colors disabled:opacity-50";
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    outline: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
  };
  return (<button type="button" className={`${base} ${styles[variant]}`} onClick={onClick} disabled={disabled}>{children}</button>);
}
function FormLabel({ children }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>;
}
// ✅ โค้ดใหม่ (มีเส้นขอบ)

function Input({ ...props }) {
  return <input className="block w-full border border-gray-300 rounded-md shadow-sm text-base px-3 py-2 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" {...props} />;
}

function Select({ children, ...props }) {
  return <select className="block w-full border border-gray-300 rounded-md shadow-sm text-base px-3 py-2 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" {...props}>{children}</select>;
}
// ---------------------------------

export default function PlayersPage() {
  const [players, setPlayers] = React.useState(null);
  const [q, setQ] = React.useState("");
  const [err, setErr] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const [form, setForm] = React.useState({
    playerCode: "", fullName: "", nickname: "", age: "", lastCompetition: "", photoUrl: "",
  });

  // (โค้ด Logic ... ไม่เปลี่ยนแปลง)
  const refresh = React.useCallback(async () => {
    try {
      setErr("");
      const list = await API.listPlayers();
      setPlayers(list);
    } catch (e) { setErr(e && e.message ? e.message : "โหลดข้อมูลไม่สำเร็จ"); }
  }, []);
  React.useEffect(() => { refresh(); }, [refresh]);
  const filtered = React.useMemo(() => {
    const list = players || [];
    if (!q) return list;
    const kw = q.toLowerCase();
    return list.filter((p) =>
      `${p.playerCode || ""} ${p.fullName} ${p.nickname || ""}`.toLowerCase().includes(kw)
    );
  }, [players, q]);
  function onGenerate() { setForm((f) => ({ ...f, playerCode: genCode("PL") })); }
  async function onSubmit(e) {
    e.preventDefault();
    if (!form.fullName || !form.fullName.trim()) { setErr("กรอกชื่อ–สกุล"); return; }
    const payload = {
      playerCode: form.playerCode || undefined,
      fullName: form.fullName.trim(),
      nickname: form.nickname ? form.nickname.trim() : undefined,
      age: form.age ? Number(form.age) : undefined,
      lastCompetition: form.lastCompetition ? form.lastCompetition.trim() : undefined,
      photoUrl: form.photoUrl ? form.photoUrl.trim() : undefined,
    };
    setSubmitting(true);
    try {
      const created = await API.createPlayer(payload);
      setPlayers((prev) => [created, ...(prev || [])]);
      setForm({ playerCode: "", fullName: "", nickname: "", age: "", lastCompetition: "", photoUrl: "" });
      setErr("");
    } catch (e) { setErr(e && e.message ? e.message : "บันทึกไม่สำเร็จ");
    } finally { setSubmitting(false); }
  }
  // (จบ Logic)

  return (
    <div className="flex flex-col gap-4"> {/* "card-body" & gap */}
      <h2 className="text-2xl font-bold">Players</h2> {/* "section-title" */}

      {/* Inline form */}
      <form onSubmit={onSubmit} className="bg-white rounded-xl shadow border p-4"> {/* "card" */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"> {/* Grid layout */}
          <div>
            <FormLabel>Player ID</FormLabel>
            <div className="flex gap-2">
              <Input
                placeholder="เว้นว่างให้ระบบสร้าง"
                value={form.playerCode}
                onChange={(e) => setForm({ ...form, playerCode: e.target.value })}
              />
              <Button variant="outline" onClick={onGenerate}>Gen</Button>
            </div>
          </div>
          <div>
            <FormLabel>ชื่อ–สกุล</FormLabel>
            <Input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </div>
          <div>
            <FormLabel>ชื่อเล่น</FormLabel>
            <Input
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
            />
          </div>
          <div>
            <FormLabel>อายุ</FormLabel>
            <Input
              inputMode="numeric"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <FormLabel>รายการล่าสุดที่ลงแข่ง</FormLabel>
            <Input
              value={form.lastCompetition}
              onChange={(e) => setForm({ ...form, lastCompetition: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <FormLabel>ลิงก์รูป</FormLabel>
            <Input
              value={form.photoUrl}
              onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <Button variant="primary" disabled={submitting}>
            {submitting ? "กำลังบันทึก…" : "เพิ่มผู้เล่น"}
          </Button>
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>
      </form>

      {/* Toolbar */}
      <div className="flex justify-between items-center mt-4">
        <strong className="text-lg">รายชื่อนักกีฬา</strong>
        <Input
          className="max-w-xs"
          placeholder="ค้นหา (ชื่อ/ID/ชื่อเล่น)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow border overflow-hidden"> {/* "card" */}
        <table className="w-full text-sm"> {/* "table" */}
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left w-32">ID</th>
              <th className="p-3 text-left">ชื่อ–สกุล</th>
              <th className="p-3 text-left">ชื่อเล่น</th>
              <th className="p-3 text-center w-20">อายุ</th>
              <th className="p-3 text-left">ล่าสุด</th>
            </tr>
          </thead>
          <tbody>
            {(filtered || []).map((p) => (
              <tr key={p._id} className="border-t">
                <td className="p-3">
                  <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{p.playerCode || "-"}</span> {/* "badge" */}
                </td>
                <td className="p-3 font-medium">{p.fullName}</td>
                <td className="p-3">{p.nickname || "-"}</td>
                <td className="p-3 text-center">{typeof p.age === "number" ? p.age : "-"}</td>
                <td className="p-3 text-gray-500">{p.lastCompetition || "-"}</td> {/* "muted" */}
              </tr>
            ))}
            {!players && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">กำลังโหลด…</td></tr>
            )}
            {players && filtered.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">ไม่พบข้อมูล</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}