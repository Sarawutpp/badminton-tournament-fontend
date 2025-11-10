console.log("MOUNT: Groups (legacy)");
import React from "react";
import { API } from "@/lib/api.js"; // <-- 1. แก้ไข path
import { HAND_LEVEL_OPTIONS } from "@/lib/types.js"; // <-- 2. Import มาตรฐาน

export default function StandingsPage() {
  const [hand, setHand] = React.useState("Baby"); // เลือกมือเริ่มต้น
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      // API.getStandings ถูกแก้ไขที่ backend ให้ส่ง matchScores มาแล้ว
      const res = await API.getStandings(hand);
      setData(res); // { level, groups: [{ groupName, teams: [...] }] }
    } catch (e) {
      setErr(e.message || "โหลดตารางคะแนนไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, [hand]);

  // --- CSS Classes สำหรับการจัดสไตล์ให้เหมือน Excel ---
  const thStyle = "px-3 py-2 text-left";
  const thCenter = "px-3 py-2 text-center";
  const tdStyle = "px-3 py-2";
  const tdCenter = "px-3 py-2 text-center";
  const tdPlayer = "px-3 py-2 text-slate-600";
  const tdTeam = "px-3 py-2 font-medium";
  const tdPoints = "px-3 py-2 text-center font-semibold";
  // ----------------------------------------------------

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">ตารางคะแนน (รอบแบ่งกลุ่ม)</h2>
        <div className="flex gap-2 items-center">
          <label className="text-sm text-slate-600">ระดับมือ:</label>
          <select
            className="border rounded px-3 py-2"
            value={hand}
            onChange={(e) => setHand(e.target.value)}
            disabled={loading}
          >
            {/* 3. วนลูปจาก HAND_LEVEL_OPTIONS */}
            {HAND_LEVEL_OPTIONS.map((lv) => (
              <option key={lv} value={lv}>{lv}</option>
            ))}
          </select>
          <button
            className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            onClick={load}
            disabled={loading}
          >
            {loading ? "กำลังโหลด..." : "Refresh"}
          </button>
        </div>
      </div>

      {err && <div className="text-red-600 mb-3">{err}</div>}

      {!data ? (
        <div className="text-slate-500">ไม่มีข้อมูล</div>
      ) : (
        <div className="space-y-10">
          {data.groups.map((g) => (
            <div key={g.groupName} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="border-b px-4 py-3 font-semibold">
                ระดับมือ: {data.level} — กลุ่ม {g.groupName}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    {/* แถวที่ 1 สำหรับหัวข้อหลัก */}
                    <tr>
                      <th rowSpan={2} className={thCenter}>อันดับ</th>
                      <th rowSpan={2} className={thStyle}>ID Code</th>
                      <th rowSpan={2} className={thStyle}>Team</th>
                      <th rowSpan={2} className={thStyle}>Player 1</th>
                      <th rowSpan={2} className={thStyle}>Player 2</th>
                      {/* เพิ่มคอลัมน์ Match 1, 2, 3 */}
                      <th rowSpan={2} className={thCenter}>Match1</th>
                      <th rowSpan={2} className={thCenter}>Match2</th>
                      <th rowSpan={2} className={thCenter}>Match3</th>
                      <th rowSpan={2} className={thCenter}>แข่ง</th>
                      <th rowSpan={2} className={thCenter}>ชนะ</th>
                      <th rowSpan={2} className={thCenter}>แพ้</th>
                      <th rowSpan={2} className={thCenter}>คะแนน</th>
                      <th colSpan={3} className={thCenter}>แต้มได้เสีย</th>
                    </tr>
                    {/* แถวที่ 2 สำหรับหัวข้อย่อย */}
                    <tr>
                      <th className={thCenter}>ได้</th>
                      <th className={thCenter}>เสีย</th>
                      <th className={thCenter}>ผลต่าง</th>
                    </tr>
                  </thead>

                  <tbody>
                    {g.teams.map((t, idx) => (
                      <tr key={t._id} className="border-t">
                        <td className={tdCenter}>{idx + 1}</td>
                        <td className={tdStyle}>{t.idCode || ""}</td>
                        <td className={tdTeam}>{t.teamName}</td>
                        <td className={tdPlayer}>{(t.players || [])[0] || ""}</td>
                        <td className={tdPlayer}>{(t.players || [])[1] || ""}</td>
                        
                        {/* แสดงผลคะแนนจาก array (ถ้าไม่มีให้ว่างไว้) */}
                        <td className={tdCenter}>{t.matchScores[0] ?? ''}</td>
                        {/* ⬇⬇ CORRECTED LINE 112 ⬇⬇ */}
                        <td className={tdCenter}>{t.matchScores[1] ?? ''}</td>
                        {/* ⬆⬆ CORRECTED LINE 112 ⬆⬆ */}
                        <td className={tdCenter}>{t.matchScores[2] ?? ''}</td>

                        <td className={tdCenter}>{t.matchesPlayed ?? 0}</td>
                        <td className={tdCenter}>{t.wins ?? 0}</td>
                        <td className={tdCenter}>{t.losses ?? 0}</td>
                        <td className={tdPoints}>{t.points ?? 0}</td>
                        <td className={tdCenter}>{t.scoreFor ?? 0}</td>
                        <td className={tdCenter}>{t.scoreAgainst ?? 0}</td>
                        <td className={tdCenter}>{t.scoreDiff ?? 0}</td>
                      </tr>
                    ))}
                    
                    {g.teams.length === 0 && (
                      <tr>
                        {/* ปรับ colSpan ให้ตรงกับจำนวนคอลัมน์ใหม่ (15) */}
                        <td colSpan={15} className="px-3 py-6 text-center text-slate-500">
                          ยังไม่มีทีมในกลุ่มนี้
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}