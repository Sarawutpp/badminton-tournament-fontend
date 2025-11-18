// src/pages/admin/Players.jsx

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { API } from "@/lib/api.js";

// helper สร้างรหัส player
const genCode = (prefix) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

// ---- UI helpers ----
function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  type = "button",
}) {
  const base =
    "px-4 py-2 rounded-lg font-semibold text-sm shadow-sm transition-colors disabled:opacity-50";
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    outline:
      "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
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

// ---- main page ----
export default function PlayersPage() {
  const [players, setPlayers] = useState(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    playerCode: "",
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

  const handleGenerateCode = () => {
    setForm((f) => ({ ...f, playerCode: genCode("PL") }));
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.fullName.trim()) {
      setErr("กรุณากรอกชื่อ–สกุล");
      return;
    }

    const payload = {
      playerCode: form.playerCode || undefined,
      fullName: form.fullName.trim(),
      nickname: form.nickname?.trim() || undefined,
      age: form.age ? Number(form.age) : undefined,
      lastCompetition: form.lastCompetition?.trim() || undefined,
    };

    setSubmitting(true);
    try {
      const created = await API.createPlayer(payload);
      // ใส่ตัวที่สร้างใหม่ไว้บนสุด
      setPlayers((prev) => [created, ...(prev || [])]);

      setForm({
        playerCode: "",
        fullName: "",
        nickname: "",
        age: "",
        lastCompetition: "",
      });
      setErr("");
    } catch (e2) {
      console.error(e2);
      setErr(e2?.message || "บันทึกผู้เล่นไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Players</h2>

      {/* form เพิ่มผู้เล่น */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow border p-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <FormLabel>Player ID</FormLabel>
            <div className="flex gap-2">
              <Input
                placeholder="เว้นว่างให้ระบบสร้าง"
                value={form.playerCode}
                onChange={handleChange("playerCode")}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateCode}
              >
                Gen
              </Button>
            </div>
          </div>

          <div>
            <FormLabel>ชื่อ–สกุล</FormLabel>
            <Input
              value={form.fullName}
              onChange={handleChange("fullName")}
              required
            />
          </div>

          <div>
            <FormLabel>ชื่อเล่น</FormLabel>
            <Input
              value={form.nickname}
              onChange={handleChange("nickname")}
            />
          </div>

          <div>
            <FormLabel>อายุ</FormLabel>
            <Input
              inputMode="numeric"
              value={form.age}
              onChange={handleChange("age")}
            />
          </div>

          <div className="md:col-span-2">
            <FormLabel>รายการล่าสุดที่ลงแข่ง</FormLabel>
            <Input
              value={form.lastCompetition}
              onChange={handleChange("lastCompetition")}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
          >
            {submitting ? "กำลังบันทึก…" : "เพิ่มผู้เล่น"}
          </Button>
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>
      </form>

      {/* toolbar + search */}
      <div className="flex justify-between items-center mt-4">
        <strong className="text-lg">รายชื่อนักกีฬา</strong>
        <Input
          className="max-w-xs"
          placeholder="ค้นหา (ชื่อ/ID/ชื่อเล่น)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* ตารางรายชื่อ */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full text-sm">
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
            {filtered &&
              filtered.map((p) => (
                <tr key={p._id} className="border-t">
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {p.playerCode || "-"}
                    </span>
                  </td>
                  <td className="p-3 font-medium">{p.fullName}</td>
                  <td className="p-3">{p.nickname || "-"}</td>
                  <td className="p-3 text-center">
                    {typeof p.age === "number" ? p.age : "-"}
                  </td>
                  <td className="p-3 text-gray-500">
                    {p.lastCompetition || "-"}
                  </td>
                </tr>
              ))}

            {!players && (
              <tr>
                <td
                  colSpan={5}
                  className="p-4 text-center text-gray-500"
                >
                  กำลังโหลด…
                </td>
              </tr>
            )}

            {players && filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="p-4 text-center text-gray-500"
                >
                  ไม่พบข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
