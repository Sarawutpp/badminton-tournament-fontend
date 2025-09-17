import React from "react";
import { API, teamName } from "../../lib/api";

export default function GroupsPage() {
  const [levels, setLevels] = React.useState([]);
  const [err, setErr] = React.useState("");

  const load = async () => {
    try {
      setLevels(await API.listGroups());
    } catch (e) {
      setErr(e.message);
    }
  };
  React.useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h2 className="section-title">Groups</h2>
      {err && <div style={{ color: "crimson" }}>{err}</div>}
      {levels.map(({ level, standings, matches }) => (
        <div key={level} style={{ marginBottom: 16 }}>
          <div className="badge" style={{ marginBottom: 8 }}>
            Level: {level}
          </div>

          <table className="table" style={{ marginBottom: 10 }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Team</th>
                <th>Pts</th>
                <th>W</th>
                <th>L</th>
                <th>Diff</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((t, i) => (
                <tr key={t._id}>
                  <td>{i + 1}</td>
                  <td>{teamName(t)}</td>
                  <td>{t.points}</td>
                  <td>{t.wins}</td>
                  <td>{t.losses}</td>
                  <td>{t.scoreDifference}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div>
            <h3>Matches (Group {standings[0]?.group || "-"})</h3>
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
                  <strong>{m.round}</strong> – {teamName(m.team1)} vs{" "}
                  {teamName(m.team2)}
                </div>
              ))}
              {!matches.length && <em>No matches yet.</em>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
