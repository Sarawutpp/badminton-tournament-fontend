// src/pages/public/Standings.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { API } from "@/lib/api.js";
import { HAND_LEVEL_OPTIONS } from "@/lib/types.js";

// ======= Helpers และ Hooks ย่อย =======
// (เอา useState ออกจากตรงนี้)

const useIsMobile = () => {
  const get = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches;

  const [isMobile, setIsMobile] = useState(get());

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const listener = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", listener);
    else mq.addListener(listener);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", listener);
      else mq.removeListener(listener);
    };
  }, []);

  return isMobile;
};

const normalizeName = (player) => {
  if (!player) return "";
  if (typeof player === "string") return player;
  return player.nickname || player.fullName || "";
};

const normalizeTeam = (team) => ({
  idCode: team.idCode || team.teamCode || "",
  teamName: team.teamName || "-",
  playerNames:
    [normalizeName(team.players?.[0]), normalizeName(team.players?.[1])]
      .filter(Boolean)
      .join("/") || "-",
  players: Array.isArray(team.players)
    ? team.players.map((p) => normalizeName(p) || "-")
    : ["-", "-"],
  matchesPlayed: team.matchesPlayed ?? 0,
  wins: team.wins ?? 0,
  draws: team.draws ?? 0,
  losses: team.losses ?? 0,
  points: team.points ?? 0,
  scoreFor: team.scoreFor ?? 0,
  scoreAgainst: team.scoreAgainst ?? 0,
  scoreDiff: team.scoreDiff ?? (team.scoreFor ?? 0) - (team.scoreAgainst ?? 0),
  setsFor: team.setsFor ?? 0,
  setsAgainst: team.setsAgainst ?? 0,
  setsDiff: team.setsDiff ?? (team.setsFor ?? 0) - (team.setsAgainst ?? 0),
  matchScores: Array.isArray(team.matchScores) ? team.matchScores : [],
});

const normalizeGroups = (raw, level) => {
  if (!raw || !Array.isArray(raw.groups)) {
    return { level, groups: [] };
  }
  return {
    level: raw.level || level,
    groups: raw.groups.map((g) => ({
      groupName: g.groupName || g.name || "-",
      teams: Array.isArray(g.teams) ? g.teams.map(normalizeTeam) : [],
    })),
  };
};

async function fetchLevelData(level) {
  const res = await API.getStandings(level);
  return normalizeGroups(res, level);
}

// ======= Component หลัก =======

const StandingsPage = () => {
  // ✅ ย้าย state มาไว้ใน component
  const [recalculating, setRecalculating] = useState(false);
  
  const [active, setActive] = useState(HAND_LEVEL_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [groupsData, setGroupsData] = useState({ level: "", groups: [] });

  const isMobile = useIsMobile();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!active?.value) return;
      setLoading(true);
      setError("");
      try {
        const normalized = await fetchLevelData(active.value);
        setGroupsData(normalized);
      } catch (e) {
        setGroupsData({ level: active.value, groups: [] });
        setError(e.message || "ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [active?.value]);

  const handleRecalculate = async () => {
    if (!isAdminRoute || !active?.value) return;

    const confirmed = window.confirm(
      `ต้องการ "คำนวณคะแนนใหม่" (Re-sync) สำหรับรุ่น ${active.label} ใช่ไหม?\nระบบจะนับคะแนนจากแมตช์ที่ "จบแล้ว" ทั้งหมดใหม่อีกครั้ง`
    );
    if (!confirmed) return;

    setRecalculating(true);
    setError("");
    try {
      await API.post("/standings/recalculate", {
        handLevel: active.value,
        tournamentId: "default",
      });

      const normalized = await fetchLevelData(active.value);
      setGroupsData(normalized);
      alert("คำนวณคะแนนใหม่เรียบร้อย ข้อมูลตรงกันแล้วครับ ✅");
    } catch (e) {
      setError(e.message || "เกิดข้อผิดพลาดในการคำนวณใหม่");
    } finally {
      setRecalculating(false);
    }
  };

  // ✅ เพิ่มฟังก์ชัน handleClear ที่ขาดหายไป
  const handleClear = async () => {
    if (!isAdminRoute || !active?.value) return;
    
    if(!window.confirm(`ยืนยันการ "ล้างคะแนน" ทั้งหมดของรุ่น ${active.label}?\nคะแนนจะถูกรีเซ็ตเป็น 0 (ข้อมูลแมตช์จะถูกล้างด้วยถ้าเลือกไว้)`)) {
      return;
    }

    setClearing(true);
    try {
      await API.post("/standings/clear", { 
        handLevel: active.value,
        tournamentId: "default",
        resetMatches: true 
      });
      
      const normalized = await fetchLevelData(active.value);
      setGroupsData(normalized);
      alert("ล้างข้อมูลเรียบร้อย");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setClearing(false);
    }
  };

  const levelChoices = useMemo(
    () =>
      HAND_LEVEL_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.labelShort || opt.label || opt.value,
      })),
    []
  );

  const groups = groupsData.groups || [];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            ตารางคะแนน — รอบแบ่งกลุ่ม
          </h1>
          <p className="text-sm text-slate-500">
            คิดคะแนน 3-1-0 และจัดอันดับตามแต้ม ผลต่างเซ็ต ผลต่างแต้ม
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="inline-flex rounded-full bg-slate-100 p-1">
            {levelChoices.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setActive(opt)}
                className={
                  "px-3 py-1 text-xs md:text-sm rounded-full font-medium transition " +
                  (opt.value === active.value
                    ? "bg-white shadow text-slate-900"
                    : "text-slate-500 hover:text-slate-800")
                }
              >
                {opt.label}
              </button>
            ))}
          </div>

          {isAdminRoute && (
            <div className="flex gap-2 mt-2 md:mt-0">
              <button
                type="button"
                onClick={handleRecalculate}
                disabled={loading || recalculating}
                className="px-4 py-2 rounded-full bg-indigo-600 text-white text-xs md:text-sm font-medium shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {recalculating ? "กำลังคำนวณ..." : "🔄 คำนวณใหม่"}
              </button>

              <button
                type="button"
                onClick={handleClear}
                disabled={loading || clearing}
                className="px-4 py-2 rounded-full bg-red-100 text-red-600 border border-red-200 text-xs md:text-sm font-medium shadow-sm hover:bg-red-200 disabled:opacity-50"
              >
                {clearing ? "..." : "ล้างค่า"}
              </button>
            </div>
          )}
        </div>
      </header>

      {loading && (
        <div className="p-4 text-center text-slate-500">กำลังโหลดข้อมูล...</div>
      )}
      {!loading && error && (
        <div className="p-4 text-center text-red-500 text-sm">{error}</div>
      )}
      {!loading && !error && groups.length === 0 && (
        <div className="p-4 text-center text-slate-500">
          ยังไม่มีกลุ่มในระดับมือนี้
        </div>
      )}

      {!loading &&
        !error &&
        groups.map((group) => (
          <GroupSection
            key={group.groupName}
            group={group}
            isMobile={isMobile}
            isAdminRoute={isAdminRoute}
          />
        ))}
    </div>
  );
};

// ======= Group + Table / Card (ส่วนล่างเหมือนเดิมทุกประการ) =======

const GroupSection = ({ group, isMobile, isAdminRoute }) => (
  <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-4">
    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold">
          {group.groupName || "-"}
        </div>
        <div>
          <div className="font-semibold text-slate-900">
            กลุ่ม {group.groupName || "-"}
          </div>
          <div className="text-xs text-slate-500">
            {group.teams?.length || 0} ทีม
          </div>
        </div>
      </div>
    </div>

    {isMobile ? (
      <CardsMobile group={group} isAdminRoute={isAdminRoute} />
    ) : (
      <TableDesktop group={group} isAdminRoute={isAdminRoute} />
    )}
  </section>
);

const TableDesktop = ({ group, isAdminRoute }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-slate-600">
        <tr>
          <th className="px-3 py-2 text-center w-16">อันดับ</th>
          <th className="px-3 py-2 text-left w-32">ID Code</th>
          <th className="px-3 py-2 text-left">ทีม</th>
          <th className="px-3 py-2 text-left">ผู้เล่น 1</th>
          <th className="px-3 py-2 text-left">ผู้เล่น 2</th>
          <th className="px-3 py-2 text-center">Match1</th>
          <th className="px-3 py-2 text-center">Match2</th>
          <th className="px-3 py-2 text-center">Match3</th>
          <th className="px-3 py-2 text-center">แข่ง</th>
          <th className="px-3 py-2 text-center">ชนะ</th>
          <th className="px-3 py-2 text-center">เสมอ</th>
          <th className="px-3 py-2 text-center">แพ้</th>
          <th className="px-3 py-2 text-center">คะแนน</th>
          <th className="px-3 py-2 text-center">ได้</th>
          <th className="px-3 py-2 text-center">เสีย</th>
          <th className="px-3 py-2 text-center">ผลต่าง</th>
          {isAdminRoute && (
            <>
              <th className="px-3 py-2 text-center">เซ็ตได้</th>
              <th className="px-3 py-2 text-center">เซ็ตเสีย</th>
              <th className="px-3 py-2 text-center">เซ็ตต่าง</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {group.teams.map((team, index) => {
          const scoreDiff =
            team.scoreDiff ?? (team.scoreFor ?? 0) - (team.scoreAgainst ?? 0);
          const setDiff =
            team.setsDiff ?? (team.setsFor ?? 0) - (team.setsAgainst ?? 0);

          return (
            <tr
              key={team._id || `${team.teamName}-${index}`}
              className="border-t hover:bg-slate-50 transition-colors"
            >
              <td className="px-3 py-2 text-center font-medium text-slate-800">
                {index + 1}
              </td>
              <td className="px-3 py-2 text-left text-slate-700">
                {team.idCode}
              </td>
              <td className="px-3 py-2 text-left font-semibold text-slate-900">
                {team.teamName}
              </td>
              <td className="px-3 py-2 text-left text-slate-700">
                {team.players?.[0] || "-"}
              </td>
              <td className="px-3 py-2 text-left text-slate-700">
                {team.players?.[1] || "-"}
              </td>
              <td className="px-3 py-2 text-center text-slate-700">
                {team.matchScores?.[0] ?? "-"}
              </td>
              <td className="px-3 py-2 text-center text-slate-700">
                {team.matchScores?.[1] ?? "-"}
              </td>
              <td className="px-3 py-2 text-center text-slate-700">
                {team.matchScores?.[2] ?? "-"}
              </td>
              <td className="px-3 py-2 text-center text-slate-700">
                {team.matchesPlayed}
              </td>
              <td className="px-3 py-2 text-center text-emerald-700">
                {team.wins}
              </td>
              <td className="px-3 py-2 text-center text-slate-700">
                {team.draws}
              </td>
              <td className="px-3 py-2 text-center text-rose-600">
                {team.losses}
              </td>
              <td className="px-3 py-2 text-center font-bold text-indigo-600">
                {team.points}
              </td>
              <td className="px-3 py-2 text-center text-slate-800">
                {team.scoreFor}
              </td>
              <td className="px-3 py-2 text-center text-slate-800">
                {team.scoreAgainst}
              </td>
              <td
                className={
                  "px-3 py-2 text-center font-semibold " +
                  (scoreDiff > 0
                    ? "text-emerald-600"
                    : scoreDiff < 0
                    ? "text-rose-600"
                    : "text-slate-800")
                }
              >
                {scoreDiff}
              </td>

              {isAdminRoute && (
                <>
                  <td className="px-3 py-2 text-center text-slate-800">
                    {team.setsFor}
                  </td>
                  <td className="px-3 py-2 text-center text-slate-800">
                    {team.setsAgainst}
                  </td>
                  <td
                    className={
                      "px-3 py-2 text-center font-semibold " +
                      (setDiff > 0
                        ? "text-emerald-600"
                        : setDiff < 0
                        ? "text-rose-600"
                        : "text-slate-800")
                    }
                  >
                    {setDiff}
                  </td>
                </>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const CardsMobile = ({ group, isAdminRoute }) => (
  <div className="space-y-3 p-3">
    {group.teams.map((team, index) => {
      const scoreDiff =
        team.scoreDiff ?? (team.scoreFor ?? 0) - (team.scoreAgainst ?? 0);
      const setDiff =
        team.setsDiff ?? (team.setsFor ?? 0) - (team.setsAgainst ?? 0);
      return (
        <article
          key={team._id || `${team.teamName}-${index}`}
          className="border border-slate-200 rounded-2xl bg-white shadow-sm p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                {index + 1}
              </div>
              <div>
                <div className="text-xs text-slate-500">{team.idCode}</div>
                <div className="text-sm font-semibold text-slate-900">
                  {team.teamName}
                </div>
                <div className="text-[11px] text-slate-500">
                  {team.playerNames}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-400">คะแนน</div>
              <div className="text-lg font-bold text-indigo-600">
                {team.points}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <MiniBox label="แข่ง" value={team.matchesPlayed} />
            <MiniBox label="ชนะ" value={team.wins} color="text-emerald-600" />
            <MiniBox label="แพ้" value={team.losses} color="text-rose-600" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <MiniBox label="ได้" value={team.scoreFor} />
            <MiniBox label="เสีย" value={team.scoreAgainst} />
            <MiniBox
              label="ผลต่าง"
              value={scoreDiff}
              color={
                scoreDiff > 0
                  ? "text-emerald-600"
                  : scoreDiff < 0
                  ? "text-rose-600"
                  : "text-slate-900"
              }
            />
          </div>

          {isAdminRoute && (
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <MiniBox label="เซ็ตได้" value={team.setsFor} />
              <MiniBox label="เซ็ตเสีย" value={team.setsAgainst} />
              <MiniBox
                label="เซ็ตต่าง"
                value={setDiff}
                color={
                  setDiff > 0
                    ? "text-emerald-600"
                    : setDiff < 0
                    ? "text-rose-600"
                    : "text-slate-900"
                }
              />
            </div>
          )}

          <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t mt-1">
            <span>
              M1: {team.matchScores?.[0] ?? "-"} / M2:{" "}
              {team.matchScores?.[1] ?? "-"} / M3:{" "}
              {team.matchScores?.[2] ?? "-"}
            </span>
          </div>
        </article>
      );
    })}
  </div>
);

const MiniBox = ({ label, value, color = "text-slate-900" }) => (
  <div className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-center shadow-sm">
    <div className="text-[11px] text-slate-500">{label}</div>
    <div className={`text-base font-semibold ${color}`}>{value}</div>
  </div>
);

export default StandingsPage;