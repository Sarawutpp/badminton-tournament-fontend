import React from "react";
import { API, teamName } from "../../lib/api";
import MatchEditor from "../../components/MatchEditor.jsx";

export default function MatchesPage() {
  const [levels, setLevels] = React.useState([]);
  const [err, setErr] = React.useState("");

  const load = async () => {
    try {
      setLevels(await API.listGroupMatches());
    } catch (e) {
      setErr(e.message);
    }
  };
  React.useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h2 className="section-title">Matches (Group stage)</h2>
      {err && <div style={{ color: "crimson" }}>{err}</div>}

      {levels.map(({ level, matches }) => (
        <div key={level} style={{ marginBottom: 16 }}>
          <div className="badge" style={{ marginBottom: 8 }}>
            Level: {level}
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {matches.map((m) => (
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
                <div style={{ marginTop: 6 }}>
                  <MatchEditor match={m} onSaved={load} />
                </div>
              </div>
            ))}
            {!matches.length && <em>No matches yet.</em>}
          </div>
        </div>
      ))}
    </div>
  );
}
