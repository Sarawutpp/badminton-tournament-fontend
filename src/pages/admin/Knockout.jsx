import React from "react";
import { API, teamName } from "../../lib/api";

export default function KnockoutPage() {
  const [rounds, setRounds] = React.useState([]);
  const [err, setErr] = React.useState("");

  const load = async () => {
    try {
      setRounds(await API.listKnockout());
    } catch (e) {
      setErr(e.message);
    }
  };
  React.useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h2 className="section-title">Knockout</h2>
      {err && <div style={{ color: "crimson" }}>{err}</div>}

      {rounds.map((r) => (
        <div key={r.name} style={{ marginBottom: 16 }}>
          <div className="badge" style={{ marginBottom: 8 }}>
            {r.name}
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {r.matches.map((m) => (
              <div
                key={m._id}
                style={{
                  border: "1px solid #ddd",
                  padding: 8,
                  borderRadius: 6,
                }}
              >
                <strong>{m.round}</strong> — {teamName(m.team1)} vs{" "}
                {teamName(m.team2)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
