// src/pages/admin/Knockout.jsx
// (เวอร์ชันที่แปลเป็น Tailwind CSS แล้ว)

import React from "react";
import { API, teamName } from "@/lib/api.js";

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
  React.useEffect(() => { load(); }, []);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Knockout</h2> {/* "section-title" */}
      {err && <div className="text-red-600 bg-red-100 p-3 rounded-md">{err}</div>}

      {rounds.map((r) => (
        <div key={r.name} className="bg-white p-4 rounded-xl shadow border">
          <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium inline-block mb-3"> {/* "badge" */}
            {r.name}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {r.matches.map((m) => (
              <div key={m._id} className="border p-3 rounded-lg bg-gray-50/50">
                <div className="font-semibold">{m.round}</div>
                <div className="text-sm">
                  {teamName(m.team1)} <span className="text-gray-400">vs</span> {teamName(m.team2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}