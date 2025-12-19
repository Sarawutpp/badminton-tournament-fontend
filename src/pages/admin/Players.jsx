// src/pages/admin/Players.jsx

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { API } from "@/lib/api.js";

// ---- UI helpers ----
function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  type = "button",
}) {
  const base =
    "px-4 py-2 rounded-lg font-semibold text-sm shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2";
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    outline:
      "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
    danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50", // เพิ่มปุ่มสีแดง
  };
  return (
    <button
      type={type}
      className={`${base} ${styles[variant]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function FormLabel({ children }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={`block w-full border border-gray-300 rounded-md shadow-sm text-base px-3 py-2 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
        props.className || ""
      }`}
    />
  );
}

// ---- Main Page ----
export default function PlayersPage() {
  const [players, setPlayers] = useState(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // State สำหรับโหมดแก้ไข
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    nickname: "",
    age: "",
    lastCompetition: "",
  });

  const loadPlayers = useCallback(async () => {
    try {
      setErr("");
      const list = await API.listPlayers();
      setPlayers(list || []);
    } catch (e) {
      console.error(e);
      setErr(e?.message || "โหลดข้อมูลผู้เล่นไม่สำเร็จ");
    }
  }, []);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const filtered = useMemo(() => {
    if (!players) return [];
    if (!q) return players;
    const kw = q.toLowerCase();
    return players.filter((p) =>
      `${p.playerCode || ""} ${p.fullName || ""} ${p.nickname || ""}`
        .toLowerCase()
        .includes(kw)
    );
  }, [players, q]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  // --- Functions: Edit & Delete ---

  const handleEdit = (player) => {
    setErr("");
    setEditingId(player._id);
    setForm({
      fullName: player.fullName,
      nickname: player.nickname || "",
      age: player.age || "",
      lastCompetition: player.lastCompetition || "",
    });
    // เลื่อนหน้าจอขึ้นไปที่ฟอร์ม
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ fullName: "", nickname: "", age: "", lastCompetition: "" });
    setErr("");
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`ยืนยันที่จะลบผู้เล่น "${name}"?\n(คำเตือน: หากผู้เล่นนี้อยู่ในทีม ข้อมูลทีมอาจแสดงผลผิดพลาด)`)) return;
    
    try {
      await API.deletePlayer(id);
      // อัปเดต State โดยเอาคนที่ลบออก
      setPlayers((prev) => prev.filter((p) => p._id !== id));
    } catch (e) {
      alert("ลบไม่สำเร็จ: " + (e.message || "เกิดข้อผิดพลาด"));
    }
  };

  // -------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.fullName.trim()) {
      setErr("กรุณากรอกชื่อ–สกุล");
      return;
    }

    const payload = {
      fullName: form.fullName.trim(),
      nickname: form.nickname?.trim() || undefined,
      age: form.age ? Number(form.age) : undefined,
      lastCompetition: form.lastCompetition?.trim() || undefined,
    };

    setSubmitting(true);
    try {
      if (editingId) {
        // --- กรณีแก้ไข ---
        const updated = await API.updatePlayer(editingId, payload);
        // อัปเดตข้อมูลในลิสต์ทันที ไม่ต้องโหลดใหม่
        setPlayers((prev) => prev.map((p) => (p._id === editingId ? updated : p)));
        handleCancelEdit(); // Reset form
      } else {
        // --- กรณีสร้างใหม่ ---
        const created = await API.createPlayer(payload);
        setPlayers((prev) => [created, ...(prev || [])]);
        setForm({ fullName: "", nickname: "", age: "", lastCompetition: "" });
      }
      setErr("");
    } catch (e2) {
      console.error(e2);
      setErr(e2?.message || "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  // ฟังก์ชัน Import CSV
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
      
      const parsedData = lines.map((line) => {
        const cols = line.split(",");
        return {
          fullName: cols[0]?.trim(),
          nickname: cols[1]?.trim(),
          age: cols[2]?.trim() || 0,
        };
      }).filter((p) => p.fullName);

      if (parsedData.length === 0) {
        alert("ไม่พบข้อมูลในไฟล์");
        return;
      }

      if (!window.confirm(`พบข้อมูล ${parsedData.length} คน ยืนยันการนำเข้า?`)) return;

      setIsImporting(true);
      try {
        await API.importPlayers(parsedData);
        alert("นำเข้าสำเร็จ!");
        loadPlayers();
      } catch (err) {
        alert("นำเข้าล้มเหลว: " + err.message);
      } finally {
        setIsImporting(false);
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 bg-slate-50 min-h-screen">
      {/* Header & Import Button */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">จัดการผู้เล่น (Players)</h2>
          <p className="text-sm text-slate-500">เพิ่มรายชื่อนักกีฬาเพื่อนำไปจัดทีม</p>
        </div>
        
        {/* Import CSV Button */}
        <div className="relative group">
            <input 
                type="file" 
                accept=".csv,.txt" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleFileUpload}
                disabled={isImporting}
            />
            <Button variant="outline" disabled={isImporting}>
                {isImporting ? (
                  <>
                    <span className="animate-spin">⏳</span> กำลังนำเข้า...
                  </>
                ) : (
                  <>
                    📂 Import CSV
                  </>
                )}
            </Button>
            <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 p-2 rounded shadow-lg text-xs text-gray-500 hidden group-hover:block z-20">
               รองรับไฟล์ CSV รูปแบบ: <br/>
               <b>ชื่อ-สกุล, ชื่อเล่น, อายุ</b>
            </div>
        </div>
      </div>

      {/* Form Section */}
      <form
        onSubmit={handleSubmit}
        className={`bg-white rounded-xl shadow-sm border p-5 transition-colors ${editingId ? "border-indigo-500 ring-1 ring-indigo-200" : "border-slate-200"}`}
      >
        <div className="flex justify-between items-center mb-4 border-b pb-2">
           <h3 className={`text-sm font-bold uppercase tracking-wider ${editingId ? "text-indigo-600" : "text-slate-400"}`}>
             {editingId ? "✏️ แก้ไขข้อมูลผู้เล่น" : "เพิ่มผู้เล่นใหม่"}
           </h3>
           {editingId && (
             <button type="button" onClick={handleCancelEdit} className="text-xs text-red-500 hover:underline">
               ยกเลิกการแก้ไข
             </button>
           )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="md:col-span-2 lg:col-span-1">
            <FormLabel>ชื่อ–สกุล <span className="text-red-500">*</span></FormLabel>
            <Input
              value={form.fullName}
              onChange={handleChange("fullName")}
              required
              placeholder="เช่น สมชาย ใจดี"
            />
          </div>

          <div>
            <FormLabel>ชื่อเล่น</FormLabel>
            <Input
              value={form.nickname}
              onChange={handleChange("nickname")}
              placeholder="เช่น ชาย"
            />
          </div>

          <div>
            <FormLabel>อายุ</FormLabel>
            <Input
              inputMode="numeric"
              value={form.age}
              onChange={handleChange("age")}
              placeholder="25"
            />
          </div>

          <div>
            <FormLabel>รายการล่าสุด</FormLabel>
            <Input
              value={form.lastCompetition}
              onChange={handleChange("lastCompetition")}
              placeholder="ระบุ (ถ้ามี)"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4 border-t pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
          >
            {submitting ? "กำลังบันทึก..." : (editingId ? "บันทึกการแก้ไข" : "+ เพิ่มรายชื่อ")}
          </Button>
          
          {editingId && (
            <Button variant="outline" onClick={handleCancelEdit} disabled={submitting}>
              ยกเลิก
            </Button>
          )}

          {err && <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">{err}</span>}
        </div>
      </form>

      {/* Toolbar + Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-2">
        <div className="flex items-center gap-2">
           <strong className="text-lg text-slate-700">รายชื่อทั้งหมด</strong>
           <span className="text-sm text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
             {filtered.length} คน
           </span>
        </div>
        <Input
          className="max-w-xs"
          placeholder="🔍 ค้นหา (ชื่อ/ID/ชื่อเล่น)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="p-3 text-left w-24">รหัส</th>
              <th className="p-3 text-left">ชื่อ–สกุล</th>
              <th className="p-3 text-left">ชื่อเล่น</th>
              <th className="p-3 text-center w-20">อายุ</th>
              <th className="p-3 text-left text-slate-400 font-normal">รายการล่าสุด</th>
              <th className="p-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered &&
              filtered.map((p) => (
                <tr key={p._id} className={`transition-colors ${editingId === p._id ? "bg-indigo-50" : "hover:bg-slate-50"}`}>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                      {p.playerCode || "-"}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-800">{p.fullName}</td>
                  <td className="p-3 text-slate-600">{p.nickname || "-"}</td>
                  <td className="p-3 text-center text-slate-600">
                    {typeof p.age === "number" && p.age > 0 ? p.age : "-"}
                  </td>
                  <td className="p-3 text-slate-400 text-xs">
                    {p.lastCompetition || "-"}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button 
                        onClick={() => handleEdit(p)} 
                        className="text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
                    >
                        แก้ไข
                    </button>
                    <button 
                        onClick={() => handleDelete(p._id, p.fullName)} 
                        className="text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-100 transition-colors"
                    >
                        ลบ
                    </button>
                  </td>
                </tr>
              ))}

            {!players && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">กำลังโหลดข้อมูล...</td></tr>
            )}

            {players && filtered.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">ไม่พบข้อมูลผู้เล่น</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}