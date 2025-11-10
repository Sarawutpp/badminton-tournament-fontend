// src/pages/admin/Teams.jsx
// (เวอร์ชันที่แก้ปุ่ม submit แล้ว)

import React from "react";
import { API } from "@/lib/api.js";

const genCode = (prefix, extra = "") =>
  `${prefix}${extra ? "-" + extra : ""}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;

const HAND_LEVEL_OPTIONS = [
  "Baby",
  "BG-",
  "BG(Mix)",
  "BG(Men)",
  "N",
  "S",
  "Single NB",
  "Single N",
];

// --- Helper Components ---
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

function Input({ ...props }) {
  return (
    <input
      className="block w-full border border-gray-300 rounded-md shadow-sm text-base px-3 py-2 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
      {...props}
    />
  );
}

function Select({ children, ...props }) {
  return (
    <select
      className="block w-full border border-gray-300 rounded-md shadow-sm text-base px-3 py-2 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
      {...props}
    >
      {children}
    </select>
  );
}
// ---------------------------------

export default function TeamsPage() {
  const [players, setPlayers] = React.useState([]);
  const [teams, setTeams] = React.useState([]);
  const [q, setQ] = React.useState("");
  const [hand, setHand] = React.useState("ALL");
  const [err, setErr] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    teamCode: "",
    teamName: "",
    competitionType: "Doubles",
    handLevel: "",
    players: [],
    managerName: "",
    phone: "",
    lineId: "",
  });

  // โหลดข้อมูลผู้เล่น + ทีม
  React.useEffect(() => {
    (async () => {
      try {
        setErr("");
        const [ps, ts] = await Promise.all([
          API.listPlayers(),
          API.listTeams(),
        ]);
        setPlayers(ps);
        setTeams(ts);
      } catch (e) {
        setErr(e && e.message ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      }
    })();
  }, []);

  const playerMap = React.useMemo(() => {
    const m = {};
    (players || []).forEach((p) => {
      m[p._id] = p;
    });
    return m;
  }, [players]);

  const filtered = React.useMemo(() => {
    let list = teams || [];
    if (hand !== "ALL")
      list = list.filter(
        (t) =>
          String(t.handLevel).toUpperCase() === hand.toUpperCase()
      );
    if (q) {
      const kw = q.toLowerCase();
      list = list.filter((t) =>
        `${t.teamCode || ""} ${t.teamName || ""} ${t.players
          .map((id) =>
            playerMap[id] ? playerMap[id].fullName : ""
          )
          .join(" ")}`
          .toLowerCase()
          .includes(kw)
      );
    }
    return list;
  }, [teams, hand, q, playerMap]);

  function onGenerate() {
    const key = (form.handLevel || "").replace(/\s+/g, "");
    setForm((f) => ({ ...f, teamCode: genCode("TM", key) }));
  }

  function togglePlayer(id) {
    setForm((f) => {
      const s = new Set(f.players);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      const max = f.competitionType === "Doubles" ? 2 : 1;
      return { ...f, players: Array.from(s).slice(0, max) };
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.teamName || !form.teamName.trim()) {
      setErr("กรอกชื่อทีม");
      return;
    }
    if (!form.competitionType) {
      setErr("เลือกประเภทการแข่งขัน");
      return;
    }
    if (!form.handLevel) {
      setErr("เลือกประเภทมือ");
      return;
    }
    if (form.competitionType === "Singles" && form.players.length !== 1) {
      setErr("Singles ต้องเลือกผู้เล่น 1 คน");
      return;
    }
    if (
      form.competitionType === "Doubles" &&
      (form.players.length < 1 || form.players.length > 2)
    ) {
      setErr("Doubles เลือก 1–2 คน");
      return;
    }

    const payload = {
      teamCode: form.teamCode || undefined,
      teamName: form.teamName.trim(),
      competitionType: form.competitionType,
      handLevel: form.handLevel,
      players: form.players,
      managerName: form.managerName || undefined,
      phone: form.phone || undefined,
      lineId: form.lineId || undefined,
    };

    setSubmitting(true);
    try {
      const created = await API.createTeam(payload);
      setTeams((prev) => [created, ...(prev || [])]);
      setForm({
        teamCode: "",
        teamName: "",
        competitionType: "Doubles",
        handLevel: "",
        players: [],
        managerName: "",
        phone: "",
        lineId: "",
      });
      setErr("");
    } catch (e) {
      setErr(e && e.message ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- UI ----------
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Teams</h2>

      {/* Form */}
      <form onSubmit={onSubmit} className="bg-white rounded-xl shadow border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <FormLabel>Team ID</FormLabel>
            <div className="flex gap-2">
              <Input
                placeholder="เว้นว่าง..."
                value={form.teamCode}
                onChange={(e) =>
                  setForm({ ...form, teamCode: e.target.value })
                }
              />
              <Button variant="outline" onClick={onGenerate}>
                Gen
              </Button>
            </div>
          </div>
          <div className="lg:col-span-2">
            <FormLabel>ชื่อทีม</FormLabel>
            <Input
              value={form.teamName}
              onChange={(e) =>
                setForm({ ...form, teamName: e.target.value })
              }
              required
            />
          </div>
          <div>
            <FormLabel>ประเภทการแข่งขัน</FormLabel>
            <Select
              value={form.competitionType}
              onChange={(e) =>
                setForm({
                  ...form,
                  competitionType: e.target.value,
                  players: [],
                })
              }
            >
              <option value="Singles">เดี่ยว (Singles)</option>
              <option value="Doubles">คู่ (Doubles)</option>
            </Select>
          </div>
          <div>
            <FormLabel>ประเภทมือ</FormLabel>
            <Select
              value={form.handLevel}
              onChange={(e) =>
                setForm({ ...form, handLevel: e.target.value })
              }
            >
              <option value="">เลือก</option>
              {HAND_LEVEL_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </Select>
          </div>
          <div className="lg:col-span-2">
            <FormLabel>ผู้จัดการทีม</FormLabel>
            <Input
              value={form.managerName}
              onChange={(e) =>
                setForm({ ...form, managerName: e.target.value })
              }
            />
          </div>
          <div>
            <FormLabel>เบอร์โทร</FormLabel>
            <Input
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
            />
          </div>
          <div className="lg:col-span-2">
            <FormLabel>Line ID</FormLabel>
            <Input
              value={form.lineId}
              onChange={(e) =>
                setForm({ ...form, lineId: e.target.value })
              }
            />
          </div>
        </div>

        <div className="mt-4">
          <FormLabel>
            เลือกผู้เล่น{" "}
            {form.competitionType === "Doubles"
              ? "(สูงสุด 2)"
              : "(1 คน)"}
          </FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 border rounded-md bg-gray-50">
            {(players || []).map((p) => {
              const checked = form.players.includes(p._id);
              return (
                <label
                  key={p._id}
                  className={`flex items-center gap-3 rounded-md border p-2 text-sm cursor-pointer ${
                    checked
                      ? "bg-indigo-100 border-indigo-300 ring-1 ring-indigo-300"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePlayer(p._id)}
                  />
                  <span className="font-medium truncate">
                    {p.fullName}
                  </span>
                  {p.nickname ? (
                    <span className="text-gray-500">
                      ({p.nickname})
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          {/* ✅ เพิ่ม type="submit" ตรงนี้ */}
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? "กำลังบันทึก…" : "สร้างทีม"}
          </Button>
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>
      </form>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mt-4">
        <div className="flex gap-2 flex-wrap">
          {["ALL", ...HAND_LEVEL_OPTIONS].map((h) => (
            <button
              key={h}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                hand === h
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setHand(h)}
            >
              {h}
            </button>
          ))}
        </div>
        <Input
          className="max-w-xs"
          placeholder="ค้นหา (ทีม/ผู้เล่น/ID)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left w-32">ID</th>
              <th className="p-3 text-left">ชื่อทีม</th>
              <th className="p-3 text-center">ประเภท</th>
              <th className="p-3 text-center">มือ</th>
              <th className="p-3 text-left">ผู้เล่น</th>
            </tr>
          </thead>
          <tbody>
            {(filtered || []).map((t) => (
              <tr key={t._id} className="border-t">
                <td className="p-3">
                  <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    {t.teamCode || "-"}
                  </span>
                </td>
                <td className="p-3 font-medium">
                  {t.teamName || "-"}
                </td>
                <td className="p-3 text-center">
                  {t.competitionType}
                </td>
                <td className="p-3 text-center">
                  <span className="px-2.5 py-0.5 bg-gray-800 text-white rounded-full text-xs font-medium">
                    {String(t.handLevel)}
                  </span>
                </td>
                <td className="p-3 text-gray-500">
                  {(t.players || [])
                    .map((id) =>
                      playerMap[id] ? playerMap[id].fullName : ""
                    )
                    .filter(Boolean)
                    .join(", ")}
                </td>
              </tr>
            ))}
            {!teams && (
              <tr>
                <td
                  colSpan={5}
                  className="p-4 text-center text-gray-500"
                >
                  กำลังโหลด…
                </td>
              </tr>
            )}
            {teams && filtered.length === 0 && (
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
