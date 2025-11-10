// src/lib/api.js

// 1) ถ้าหน้าเว็บรันบน localhost ให้ "บังคับใช้" backend local ทันที
const DEV_FORCE =
  (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "http://localhost:5000/api"
    : null;

// 2) อ่านจาก env ถ้ามี; ถ้าไม่มีให้ใช้ origin ปัจจุบัน
const RAW_ENV = import.meta.env.VITE_API_URL || `${window.location.origin}`;

// 3) เลือก BASE: localhost (ถ้า dev) > env > origin และ normalize ให้ลงท้าย /api เสมอ
function normalizeApiBase(s) {
  const b = String(s).trim().replace(/\/$/, "");
  return b.endsWith("/api") ? b : `${b}/api`;
}
export const API_BASE = normalizeApiBase(DEV_FORCE || RAW_ENV);

// ---------- helpers ----------
async function handle(res) {
// ... existing code ...
  if (!res.ok) {
    let msg = await res.text().catch(() => "");
    try { msg = JSON.parse(msg)?.message || msg; } catch {}
    throw new Error(msg || `${res.status} ${res.statusText}`);
  }
// ... existing code ...
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

async function request(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...opts,
  });
  return handle(res);
}

// ---------- exported API ----------
export const API = {
// ... existing code ...
  // Teams
  listTeams: () => request("/teams"),
  listTeamsByHand: (hand) => request(`/teams?handLevel=${encodeURIComponent(hand)}`),
// ... existing code ...
  createTeam: (data) => request("/teams", { method: "POST", body: JSON.stringify(data) }),

  // Matches (พื้นฐาน)
  // listAllMatches: () => request("/matches"), // This is now replaced by listSchedule
  // updateMatch: (id, body) => request(`/matches/${id}`, { method: "PUT", body: JSON.stringify(body) }), // Replaced by updateScore

  // ✅ ตารางเวลา + กรอง/แบ่งหน้า (ตัวใหม่ที่หน้า Matches/Admin เรียกใช้)
  listSchedule: ({
    page = 1,
    pageSize = 50,
    day = "", // ADDED
    handLevel = "",
    group = "",
    court = "",
    status = "",
    q = "",
    sort = "matchNo,scheduledAt", // UPDATED DEFAULT SORT
  } = {}) => {
    const qs = new URLSearchParams();
    if (day) qs.set("day", day); // ADDED
    if (handLevel) qs.set("handLevel", handLevel);
    if (group) qs.set("group", group);
    if (court) qs.set("court", court);
    if (status) qs.set("status", status);
    if (q) qs.set("q", q);
    if (sort) qs.set("sort", sort);
    qs.set("page", page);
    qs.set("pageSize", pageSize);
    return request(`/matches?${qs.toString()}`);
  },

  // ✅ NEW: Schedule Plan APIs (From previous step)
  reorderMatches: (data) => request("/matches/reorder", { method: "PATCH", body: JSON.stringify(data) }),
  updateSchedule: (id, data) => request(`/matches/${id}/schedule`, { method: "PUT", body: JSON.stringify(data) }),
  updateScore: (id, data) => request(`/matches/${id}/score`, { method: "PUT", body: JSON.stringify(data) }),

  // Tournaments
  generateGroups: (body) => request("/tournaments/generate-groups", { method: "POST", body: JSON.stringify(body) }),
// ... existing code ...
  manualGroupAndGenerate: (body) => request("/tournaments/generate-groups/manual", { method: "POST", body: JSON.stringify(body) }),
  generateKnockout: (body) => request("/tournaments/generate-knockout", { method: "POST", body: JSON.stringify(body) }),
// ... existing code ...

  // Players
  listPlayers: () => request("/players"),
// ... existing code ...
  createPlayer: (data) => request("/players", { method: "POST", body: JSON.stringify(data) }),

  // Standings
// ... existing code ...
  getStandings: (hand) =>
    request(`/standings${hand ? `?handLevel=${encodeURIComponent(hand)}` : ""}`),

  // Utilities เดิม (คงไว้)
// ... existing code ...
  async listGroups() {
    const teams = await request("/teams");
    const byLevel = {};
// ... existing code ...
    for (const t of teams) {
      const level = t.handLevel || "UNKNOWN";
      const g = t.group ?? null;
// ... existing code ...
      if (!byLevel[level]) byLevel[level] = { level, groups: {} };
      if (g === null) continue;
      if (!byLevel[level].groups[g]) byLevel[level].groups[g] = { groupName: g, teams: [] };
// ... existing code ...
      byLevel[level].groups[g].teams.push(t);
    }
    const result = Object.values(byLevel)
// ... existing code ...
      .map((lvl) => {
        Object.values(lvl.groups).forEach((g) => {
          g.teams.sort((a, b) =>
// ... existing code ...
            (b.points ?? 0) - (a.points ?? 0) ||
            (b.scoreDiff ?? ((b.scoreFor ?? 0) - (b.scoreAgainst ?? 0))) -
              (a.scoreDiff ?? ((a.scoreFor ?? 0) - (a.scoreAgainst ?? 0)))
// ... existing code ...
          );
        });
        return {
// ... existing code ...
          level: lvl.level,
          groups: Object.values(lvl.groups).sort((a, b) => a.groupName.localeCompare(b.groupName)),
        };
      })
      .sort((a, b) => a.level.localeCompare(b.level));
    return result;
  },

  async listGroupMatches() {
// ... existing code ...
    const matches = await request("/matches");
    const byLevel = {};
    for (const m of matches) {
// ... existing code ...
      if (!/group/i.test(m.round || "group")) continue;
      const level =
        (m.level && m.level.toUpperCase()) ||
// ... existing code ...
        (m.team1?.handLevel?.toUpperCase()) ||
        (m.team2?.handLevel?.toUpperCase()) ||
        "UNKNOWN";
// ... existing code ...
      if (!byLevel[level]) byLevel[level] = { level, matches: [] };
      byLevel[level].matches.push(m);
    }
// ... existing code ...
    return Object.values(byLevel);
  },

  async listKnockout() {
// ... existing code ...
    const matches = await request("/matches");
    const byRound = {};
    for (const m of matches) {
// ... existing code ...
      if (/group/i.test(m.round || "")) continue;
      const name = m.round || "Knockout";
      if (!byRound[name]) byRound[name] = { name, matches: [] };
// ... existing code ...
      byRound[name].matches.push(m);
    }
    const order = ["Round of 16", "Quarter-final", "Semifinal", "Final"];
// ... existing code ...
    return Object.values(byRound).sort(
      (a, b) => (order.indexOf(a.name) + 1 || 99) - (order.indexOf(b.name) + 1 || 99)
    );
  },
};

export function teamName(t) {
// ... existing code ...
  if (!t) return "-";
  if (typeof t === "string") return t;
  if (t.teamName) return t.teamName;
  if (t.name) return t.name;
  const n1 = t.players?.[0]?.nickname || t.players?.[0]?.fullName || "";
  const n2 = t.players?.[1]?.nickname || t.players?.[1]?.fullName || "";
// ... existing code ...
  const duo = [n1, n2].filter(Boolean).join("/");
  return duo || "-";
}

