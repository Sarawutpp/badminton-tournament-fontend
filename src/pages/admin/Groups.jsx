// src/pages/admin/Groups.jsx
import React from "react";
import { API, teamName } from "../../lib/api";

const letters = (n) => Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i)); // A..Z

export default function GroupsPage() {
  const [handLevel, setHandLevel] = React.useState("N");
  const [groupCount, setGroupCount] = React.useState(4);
  const [allTeams, setAllTeams] = React.useState([]);
  const [unassigned, setUnassigned] = React.useState([]);
  const [groups, setGroups] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  // init groups on count change
  React.useEffect(() => {
    const g = {};
    letters(groupCount).forEach((L) => (g[L] = []));
    setGroups(g);
  }, [groupCount]);

  // load teams by hand level
  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const rows = await API.listTeamsByHand(handLevel);
        setAllTeams(rows || []);
        setUnassigned((rows || []).map((t) => t._id));
        // reset groups
        const g = {};
        letters(groupCount).forEach((L) => (g[L] = []));
        setGroups(g);
      } catch (e) {
        alert(`โหลดทีมไม่สำเร็จ: ${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [handLevel]);

  const map = React.useMemo(() => {
    const m = new Map();
    allTeams.forEach((t) => m.set(t._id, t));
    return m;
  }, [allTeams]);

  const moveToGroup = (id, L) => {
    setUnassigned((prev) => prev.filter((x) => x !== id));
    setGroups((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => (next[k] = next[k].filter((x) => x !== id)));
      next[L] = [...next[L], id];
      return next;
    });
  };

  const moveBack = (id) => {
    setGroups((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => (next[k] = next[k].filter((x) => x !== id)));
      return next;
    });
    setUnassigned((prev) => [...prev, id]);
  };

  const onConfirm = async () => {
    const all = Object.values(groups).flat();
    const dup = all.filter((id, i, arr) => arr.indexOf(id) !== i);
    if (dup.length) return alert("มีทีมซ้ำในหลายกลุ่ม");

    if (unassigned.length) {
      const ok = confirm(`ยังมีทีม ${unassigned.length} ทีมที่ยังไม่จัดกลุ่ม ต้องการดำเนินการต่อหรือไม่?`);
      if (!ok) return;
    }

    try {
      setLoading(true);
      const payload = { handLevel, groups, tournamentId: "default" };
      const resp = await API.manualGroupAndGenerate(payload);
      alert(`สร้างแมตช์สำเร็จ: ${resp?.createdMatches ?? 0} คู่`);
    } catch (e) {
      alert(`บันทึกไม่สำเร็จ: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // DnD
  const onDragStart = (e, id) => e.dataTransfer.setData("text/plain", id);
  const onDropGroup = (e, L) => {
    const id = e.dataTransfer.getData("text/plain");
    if (id) moveToGroup(id, L);
  };
  const onDropUnassigned = (e) => {
    const id = e.dataTransfer.getData("text/plain");
    if (id) moveBack(id);
  };

  return (
    <>
      <h2 className="section-title">🧩 Generator — จัดกลุ่ม</h2>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-body" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ minWidth: 220 }}>
            <div className="muted" style={{ marginBottom: 6 }}>ประเภทมือ</div>
            <select value={handLevel} onChange={(e) => setHandLevel(e.target.value)}>
              {["Baby", "N", "NB", "C", "B", "A", "S"].map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: 220 }}>
            <div className="muted" style={{ marginBottom: 6 }}>จำนวนกลุ่ม</div>
            <input
              type="number"
              min={1}
              max={26}
              value={groupCount}
              onChange={(e) => setGroupCount(parseInt(e.target.value || "1", 10))}
            />
          </div>

          <div style={{ marginLeft: "auto" }}>
            <button onClick={onConfirm} disabled={loading}>
              {loading ? "กำลังบันทึก…" : "ยืนยันและสร้างแมตช์"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
        {/* Unassigned */}
        <div className="card" onDragOver={(e) => e.preventDefault()} onDrop={onDropUnassigned}>
          <div className="card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>ยังไม่จัดกลุ่ม</strong>
              <span className="badge">{unassigned.length} teams</span>
            </div>
            <div style={{ marginTop: 8 }}>
              {unassigned.length === 0 && <div className="muted">— ว่าง —</div>}
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {unassigned.map((id) => {
                  const t = map.get(id);
                  return (
                    <li key={id}
                        draggable
                        onDragStart={(e) => onDragStart(e, id)}
                        style={{ display: "flex", justifyContent: "space-between", padding: "8px 6px", borderBottom: "1px solid #eee" }}>
                      <span>{t?.teamCode ? `${t.teamCode} • ${teamName(t)}` : teamName(t)}</span>
                      <span style={{ display: "flex", gap: 6 }}>
                        {letters(groupCount).map((L) => (
                          <button key={L} onClick={() => moveToGroup(id, L)} title={`ย้ายไปกลุ่ม ${L}`}>{L}</button>
                        ))}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* Groups */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
          {letters(groupCount).map((L) => (
            <div key={L} className="card" onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDropGroup(e, L)}>
              <div className="card-body">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>Group {L}</strong>
                  <span className="badge">{groups[L]?.length ?? 0} teams</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0 0" }}>
                  {(groups[L] || []).map((id) => {
                    const t = map.get(id);
                    return (
                      <li key={id}
                          draggable
                          onDragStart={(e) => onDragStart(e, id)}
                          style={{ display: "flex", justifyContent: "space-between", padding: "8px 6px", borderBottom: "1px solid #eee" }}>
                        <span>{t?.teamCode ? `${t.teamCode} • ${teamName(t)}` : teamName(t)}</span>
                        <span style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => moveBack(id)} title="นำกลับ">⟲</button>
                          {letters(groupCount).filter((x) => x !== L).map((x) => (
                            <button key={x} onClick={() => moveToGroup(id, x)} title={`ย้ายไปกลุ่ม ${x}`}>{x}</button>
                          ))}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
