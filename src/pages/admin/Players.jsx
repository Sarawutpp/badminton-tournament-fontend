import React from "react";
import { API } from "../../lib/api";

// preview โค้ดฝั่งหน้าเว็บ (ถ้าไม่กรอก Backend จะ gen ให้เอง)
const genCode = (prefix) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export default function PlayersPage() {
  const [players, setPlayers] = React.useState(null);
  const [q, setQ] = React.useState("");
  const [err, setErr] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const [form, setForm] = React.useState({
    playerCode: "",
    fullName: "",
    nickname: "",
    age: "",
    lastCompetition: "",
    photoUrl: "",
  });

  const refresh = React.useCallback(async () => {
    try {
      setErr("");
      const list = await API.listPlayers();
      setPlayers(list);
    } catch (e) {
      setErr(e && e.message ? e.message : "โหลดข้อมูลไม่สำเร็จ");
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = React.useMemo(() => {
    const list = players || [];
    if (!q) return list;
    const kw = q.toLowerCase();
    return list.filter((p) =>
      `${p.playerCode || ""} ${p.fullName} ${p.nickname || ""}`
        .toLowerCase()
        .includes(kw)
    );
  }, [players, q]);

  function onGenerate() {
    setForm((f) => ({ ...f, playerCode: genCode("PL") }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.fullName || !form.fullName.trim()) {
      setErr("กรอกชื่อ–สกุล");
      return;
    }
    const payload = {
      playerCode: form.playerCode || undefined, // ว่างได้ → backend gen ให้
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
      setForm({
        playerCode: "",
        fullName: "",
        nickname: "",
        age: "",
        lastCompetition: "",
        photoUrl: "",
      });
      setErr("");
    } catch (e) {
      setErr(e && e.message ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card-body" style={{ display: "grid", gap: 12 }}>
      <h2 className="section-title">Players</h2>

      {/* Inline form */}
      <form onSubmit={onSubmit} className="card" style={{ padding: 12 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "160px 1fr 160px 1fr",
            gap: 8,
          }}
        >
          <div>
            <label>Player ID</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="เว้นว่างให้ระบบสร้าง"
                value={form.playerCode}
                onChange={(e) =>
                  setForm({ ...form, playerCode: e.target.value })
                }
              />
              <button type="button" className="btn-outline" onClick={onGenerate}>
                Generate
              </button>
            </div>
          </div>
          <div>
            <label>ชื่อ–สกุล</label>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </div>
          <div>
            <label>ชื่อเล่น</label>
            <input
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
            />
          </div>
          <div>
            <label>อายุ</label>
            <input
              inputMode="numeric"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />
          </div>
          <div>
            <label>รายการล่าสุดที่ลงแข่ง</label>
            <input
              value={form.lastCompetition}
              onChange={(e) =>
                setForm({ ...form, lastCompetition: e.target.value })
              }
            />
          </div>
          <div>
            <label>ลิงก์รูป</label>
            <input
              value={form.photoUrl}
              onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
            />
          </div>
        </div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <button disabled={submitting}>
            {submitting ? "กำลังบันทึก…" : "เพิ่มผู้เล่น"}
          </button>
          {err && <span style={{ color: "crimson" }}>{err}</span>}
        </div>
      </form>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>รายชื่อนักกีฬา</strong>
        <input
          style={{ maxWidth: 260 }}
          placeholder="ค้นหา (ชื่อ/ID/ชื่อเล่น)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <table className="table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th style={{ width: 120 }}>ID</th>
              <th>ชื่อ–สกุล</th>
              <th>ชื่อเล่น</th>
              <th style={{ textAlign: "center" }}>อายุ</th>
              <th>ล่าสุด</th>
            </tr>
          </thead>
          <tbody>
            {(filtered || []).map((p) => (
              <tr key={p._id}>
                <td>
                  <span className="badge">{p.playerCode || "-"}</span>
                </td>
                <td>{p.fullName}</td>
                <td>{p.nickname || "-"}</td>
                <td style={{ textAlign: "center" }}>{typeof p.age === "number" ? p.age : "-"}</td>
                <td className="muted">{p.lastCompetition || "-"}</td>
              </tr>
            ))}
            {!players && (
              <tr>
                <td colSpan={5} style={{ padding: 12 }}>
                  กำลังโหลด…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
