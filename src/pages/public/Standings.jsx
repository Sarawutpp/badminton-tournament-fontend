// src/pages/public/Standings.jsx
// (เวอร์ชันที่แปลเป็น Tailwind CSS 100% แล้ว)
console.log("MOUNT: StandingsTabs v2 (Tailwind Fixed)");
import React from "react";
import { API } from "@/lib/api.js"; // <-- แก้ไข path ให้สอดคล้อง
import { HAND_LEVEL_OPTIONS } from "@/lib/types.js"; // <-- 1. Import มาตรฐาน

// (ลบ Array 'LEVELS' ที่ hard-code ทิ้ง)

// --- ตรวจหน้าจอมือถือ (<768px) ด้วย matchMedia เพื่อเลือกเรนเดอร์แบบเดียว ---
function useIsMobile() {
  const get = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767.98px)").matches;

  const [isMobile, setIsMobile] = React.useState(get());

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767.98px)");
    const onChange = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  return isMobile;
}

export default function StandingsPage() {
  // 2. ใช้ HAND_LEVEL_OPTIONS[0] เป็นค่าเริ่มต้น
  const [active, setActive] = React.useState(HAND_LEVEL_OPTIONS[0]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [data, setData] = React.useState(null);
  const isMobile = useIsMobile();

  async function load(level) {
    setLoading(true);
    setErr("");
    try {
      const res = await API.getStandings(level);
      const cleaned = {
        level: res?.level ?? level,
        groups: Array.isArray(res?.groups) ? res.groups : [],
      };
      cleaned.groups = cleaned.groups.map((g) => ({
        groupName: g.groupName ?? "-",
        teams: (g.teams ?? []).map((t) => ({
          _id: t._id ?? `${Math.random()}`,
          idCode: t.idCode ?? "",
          teamName: t.teamName ?? "",
          players: t.players ?? ["", ""],
          matchesPlayed: t.matchesPlayed ?? 0,
          wins: t.wins ?? 0,
          losses: t.losses ?? 0,
          points: t.points ?? 0,
          scoreFor: t.scoreFor ?? 0,
          scoreAgainst: t.scoreAgainst ?? 0,
          scoreDiff: t.scoreDiff ?? (t.scoreFor ?? 0) - (t.scoreAgainst ?? 0),
          matchScores: t.matchScores ?? [], // [m1, m2, m3]
        })),
      }));
      setData(cleaned);
    } catch (e) {
      console.error(e);
      setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      setData({ level, groups: [] });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Component ปุ่ม Tab (ถูกต้องแล้ว)
  const Tab = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={
        "px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-colors " +
        (isActive
          ? "bg-emerald-600 text-white border-emerald-600 shadow"
          : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200")
      }
    >
      {label}
    </button>
  );

  return (
    <div className="px-2 md:px-6 py-6"> {/* ลด padding ซ้ายขวาบนมือถือ */}
      <div className="mb-4">
        <h2 className="text-3xl font-extrabold tracking-tight">
          ตารางคะแนน (รอบแบ่งกลุ่ม)
        </h2>
      </div>

      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {/* 3. วนลูปจาก HAND_LEVEL_OPTIONS */}
          {HAND_LEVEL_OPTIONS.map((lv) => (
            <Tab
              key={lv}
              label={lv}
              isActive={active === lv}
              onClick={() => setActive(lv)}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <button
            className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            onClick={() => load(active)}
            disabled={loading}
          >
            {loading ? "กำลังโหลด..." : "Refresh"}
          </button>
          {err && <span className="text-red-600 text-sm">{err}</span>}
        </div>
      </div>

      {loading && !data ? (
        <div className="text-slate-500">กำลังโหลดข้อมูล...</div>
      ) : !data || !data.groups?.length ? (
        <div className="text-slate-500">
          ยังไม่มีข้อมูลกลุ่มในระดับมือ {active}
        </div>
      ) : (
        <div className="space-y-10">
          {data.groups.map((g) => (
            <GroupBlock
              key={g.groupName}
              level={data.level}
              group={g}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- [แก้ไข] ใช้สไตล์ Tailwind "card" ----------
function GroupBlock({ level, group, isMobile }) {
  return (
    // "card" -> ใช้ Tailwind card
    <div className="bg-white rounded-xl shadow border overflow-hidden">
      {/* Header card */}
      <div className="px-4 py-3 border-b flex items-center gap-2 bg-gray-50/50">
        {/* "badge" -> ใช้ Tailwind badge */}
        <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
          ระดับมือ: {level}
        </span>
        <h3 className="text-lg font-semibold">
          — กลุ่ม {group.groupName}
        </h3>
      </div>

      {isMobile ? <CardsMobile group={group} /> : <TableDesktop group={group} />}
    </div>
  );
}

/* ---------- [แก้ไข] Desktop Table (ใช้สไตล์ Tailwind) ---------- */
function TableDesktop({ group }) {
  return (
    <div className="overflow-x-auto">
      {/* "table" -> ใช้ Tailwind table */}
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-3 py-2 text-center w-16">อันดับ</th>
            <th className="px-3 py-2 text-left w-32">ID Code</th>
            <th className="px-3 py-2 text-left">Team</th>
            <th className="px-3 py-2 text-left">Player 1</th>
            <th className="px-3 py-2 text-left">Player 2</th>
            <th className="px-3 py-2 text-center w-20">Match1</th>
            <th className="px-3 py-2 text-center w-20">Match2</th>
            <th className="px-3 py-2 text-center w-20">Match3</th>
            <th className="px-3 py-2 text-center w-16">แข่ง</th>
            <th className="px-3 py-2 text-center w-16">ชนะ</th>
            <th className="px-3 py-2 text-center w-16">แพ้</th>
            <th className="px-3 py-2 text-center w-20">คะแนน</th>
            <th className="px-3 py-2 text-center w-16">ได้</th>
            <th className="px-3 py-2 text-center w-16">เสีย</th>
            <th className="px-3 py-2 text-center w-20">ผลต่าง</th>
          </tr>
        </thead>

        <tbody>
          {group.teams.map((t, idx) => {
            const sd = t.scoreDiff ?? (t.scoreFor ?? 0) - (t.scoreAgainst ?? 0);
            return (
              <tr key={t._id || idx} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-center">{idx + 1}</td>
                <td className="px-3 py-2">{t.idCode}</td>
                <td className="px-3 py-2 font-medium">{t.teamName}</td>
                <td className="px-3 py-2 text-gray-600">{(t.players || [])[0] || ""}</td>
                <td className="px-3 py-2 text-gray-600">{(t.players || [])[1] || ""}</td>
                <td className="px-3 py-2 text-center">
                  {(t.matchesPlayed ?? 0) >= 1 ? t.matchScores?.[0] ?? "" : ""}
                </td>
                <td className="px-3 py-2 text-center">
                  {(t.matchesPlayed ?? 0) >= 2 ? t.matchScores?.[1] ?? "" : ""}
                </td>
                <td className="px-3 py-2 text-center">
                  {(t.matchesPlayed ?? 0) >= 3 ? t.matchScores?.[2] ?? "" : ""}
                </td>
                <td className="px-3 py-2 text-center">{t.matchesPlayed ?? 0}</td>
                <td className="px-3 py-2 text-center">{t.wins ?? 0}</td>
                <td className="px-3 py-2 text-center">{t.losses ?? 0}</td>
                <td className="px-3 py-2 text-center font-bold text-indigo-700">
                  {t.points ?? 0}
                </td>
                <td className="px-3 py-2 text-center">{t.scoreFor ?? 0}</td>
                <td className="px-3 py-2 text-center">{t.scoreAgainst ?? 0}</td>
                <td
                  className={`px-3 py-2 text-center font-medium ${
                    sd >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {sd}
                </td>
              </tr>
            );
          })}

          {group.teams.length === 0 && (
            <tr>
              <td colSpan={15} className="px-3 py-6 text-center text-slate-500">
                ยังไม่มีทีมในกลุ่มนี้
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Mobile Cards (<md) (ถูกต้องแล้ว) ---------- */
function CardsMobile({ group }) {
  return (
    <div className="divide-y divide-slate-100">
      {group.teams.length === 0 && (
        <div className="px-4 py-6 text-slate-500 text-center">
          ยังไม่มีทีมในกลุ่มนี้
        </div>
      )}
      {group.teams.map((t, idx) => {
        const sd = t.scoreDiff ?? (t.scoreFor ?? 0) - (t.scoreAgainst ?? 0);
        return (
          <article key={t._id || idx} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-slate-500">อันดับ</div>
                <div className="text-lg font-bold">{idx + 1}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">คะแนน</div>
                <div className="text-xl font-extrabold text-indigo-700">{t.points ?? 0}</div>
              </div>
            </div>

            <div className="mt-2">
              <div className="text-xs text-slate-500">ทีม</div>
              <div className="font-medium">{t.teamName}</div>
              <div className="text-xs text-slate-500 mt-1">ID Code</div>
              <div className="text-sm">{t.idCode}</div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-slate-500">Player 1</div>
                <div className="text-sm">{(t.players || [])[0] || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Player 2</div>
                <div className="text-sm">{(t.players || [])[1] || "-"}</div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <MiniBox label="แข่ง" value={t.matchesPlayed ?? 0} />
              <MiniBox label="ชนะ" value={t.wins ?? 0} />
              <MiniBox label="แพ้" value={t.losses ?? 0} />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <MiniBox label="ได้" value={t.scoreFor ?? 0} />
              <MiniBox label="เสีย" value={t.scoreAgainst ?? 0} />
              <MiniBox
                label="ผลต่าง"
                value={sd}
                color={sd >= 0 ? "text-green-600" : "text-red-600"}
              />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <MiniBox label="M1" value={(t.matchesPlayed ?? 0) >= 1 ? t.matchScores?.[0] ?? "-" : "-"} />
              <MiniBox label="M2" value={(t.matchesPlayed ?? 0) >= 2 ? t.matchScores?.[1] ?? "-" : "-"} />
              <MiniBox label="M3" value={(t.matchesPlayed ?? 0) >= 3 ? t.matchScores?.[2] ?? "-" : "-"} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function MiniBox({ label, value, color = "text-slate-900" }) {
  return (
    <div className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-center shadow-sm">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className={`text-base font-semibold ${color}`}>{value}</div>
    </div>
  );
}

/* tip: ถ้าจะซ่อน scrollbar ของแท็บให้เนียน ๆ
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
*/