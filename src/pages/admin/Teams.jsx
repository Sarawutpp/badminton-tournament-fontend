import React from "react";
import { API } from "../../lib/api";

const genCode = (prefix, extra = "") =>
  `${prefix}${extra ? "-" + extra : ""}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;

const HAND_LEVEL_OPTIONS = ["N", "NB", "Baby", "BG-", "Mix"]; // ปรับ/เพิ่มตามจริงได้

export default function TeamsPage() {
  const [players, setPlayers] = React.useState([]);
  const [teams, setTeams] = React.useState([]);
  const [q, setQ] = React.useState("");
  const [hand, setHand] = React.useState("ALL");
  const [err, setErr] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const [form, setForm] = React.useState({
    teamCode: "",
    teamName: "",            // 👈 ชื่อทีม
    competitionType: "Doubles", // Singles | Doubles
    handLevel: "",
    players: [],
    managerName: "",
    phone: "",
    lineId: "",
  });

  React.useEffect(() => {
    (async () => {
      try {
        setErr("");
        const [ps, ts] = await Promise.all([API.listPlayers(), API.listTeams()]);
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
    if (hand !== "ALL") list = list.filter((t) => String(t.handLevel).toUpperCase() === hand.toUpperCase());
    if (q) {
      const kw = q.toLowerCase();
      list = list.filter((t) =>
        `${t.teamCode || ""} ${t.teamName || ""} ${t.players
          .map((id) => (playerMap[id] ? playerMap[id].fullName : ""))
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
    if (form.competitionType === "Doubles" && (form.players.length < 1 || form.players.length > 2)) {
      setErr("Doubles เลือก 1–2 คน");
      return;
    }

    const payload = {
      teamCode: form.teamCode || undefined, // ว่างได้ → backend gen ให้
      teamName: form.teamName.trim(),       // 👈 ส่งชื่อทีม
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

  return (
    <div className="card-body" style={{ display: "grid", gap: 12 }}>
      <h2 className="section-title">Teams</h2>

      {/* Inline form */}
      <form onSubmit={onSubmit} className="card" style={{ padding: 12 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "160px 1fr 160px 160px 1fr",
            gap: 8,
          }}
        >
          <div>
            <label>Team ID</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="เว้นว่างให้ระบบสร้าง"
                value={form.teamCode}
                onChange={(e) => setForm({ ...form, teamCode: e.target.value })}
              />
              <button type="button" className="btn-outline" onClick={onGenerate}>
                Generate
              </button>
            </div>
          </div>

          <div>
            <label>ชื่อทีม</label>
            <input
              value={form.teamName}
              onChange={(e) => setForm({ ...form, teamName: e.target.value })}
              required
            />
          </div>

          <div>
            <label>ประเภทการแข่งขัน</label>
            <select
              value={form.competitionType}
              onChange={(e) =>
                setForm({
                  ...form,
                  competitionType: e.target.value,
                  players: [], // เปลี่ยนประเภทแล้วเคลียร์ตัวเลือก
                })
              }
            >
              <option value="Singles">เดี่ยว (Singles)</option>
              <option value="Doubles">คู่ (Doubles)</option>
            </select>
          </div>

          <div>
            <label>ประเภทมือ</label>
            <select
              value={form.handLevel}
              onChange={(e) => setForm({ ...form, handLevel: e.target.value })}
            >
              <option value="">เลือก</option>
              {HAND_LEVEL_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>ผู้จัดการทีม</label>
            <input
              value={form.managerName}
              onChange={(e) => setForm({ ...form, managerName: e.target.value })}
            />
          </div>

          <div>
            <label>เบอร์โทร</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>

          <div>
            <label>Line ID</label>
            <input value={form.lineId} onChange={(e) => setForm({ ...form, lineId: e.target.value })} />
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <div className="text-sm" style={{ marginBottom: 6 }}>
            เลือกผู้เล่น {form.competitionType === "Doubles" ? "(สูงสุด 2)" : "(1 คน)"}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 8,
              maxHeight: 160,
              overflow: "auto",
              padding: 8,
              border: "1px solid var(--border)",
              borderRadius: 8,
            }}
          >
            {(players || []).map((p) => {
              const checked = form.players.indexOf(p._id) !== -1;
              return (
                <label
                  key={p._id}
                  className={"flex items-center gap-8 rounded-md border p-8 text-sm" + (checked ? " is-selected" : "")}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePlayer(p._id)}
                  />
                  <span style={{ fontWeight: 600 }} className="truncate">
                    {p.fullName}
                  </span>
                  {p.nickname ? <span className="muted">({p.nickname})</span> : null}
                  {p.playerCode ? <span className="badge" style={{ marginLeft: "auto" }}>{p.playerCode}</span> : null}
                </label>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <button disabled={submitting}>{submitting ? "กำลังบันทึก…" : "สร้างทีม"}</button>
          {err && <span style={{ color: "crimson" }}>{err}</span>}
        </div>
      </form>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["ALL", ...HAND_LEVEL_OPTIONS].map((h) => (
            <button
              key={h}
              className={"badge" + (hand === h ? " is-primary" : "")}
              onClick={() => setHand(h)}
            >
              {h}
            </button>
          ))}
        </div>
        <input
          style={{ maxWidth: 260 }}
          placeholder="ค้นหา (ทีม/ผู้เล่น/ID)"
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
              <th>ชื่อทีม</th>
              <th style={{ textAlign: "center" }}>ประเภท</th>
              <th style={{ textAlign: "center" }}>มือ</th>
              <th>ผู้เล่น</th>
            </tr>
          </thead>
          <tbody>
            {(filtered || []).map((t) => (
              <tr key={t._id}>
                <td><span className="badge">{t.teamCode || "-"}</span></td>
                <td>{t.teamName || "-"}</td>
                <td style={{ textAlign: "center" }}>{t.competitionType}</td>
                <td style={{ textAlign: "center" }}><span className="badge is-dark">{String(t.handLevel)}</span></td>
                <td className="muted">
                  {(t.players || [])
                    .map((id) => (playerMap[id] ? playerMap[id].fullName : ""))
                    .filter(Boolean)
                    .join(", ")}
                </td>
              </tr>
            ))}
            {!teams && (
              <tr>
                <td colSpan={5} style={{ padding: 12 }}>กำลังโหลด…</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
