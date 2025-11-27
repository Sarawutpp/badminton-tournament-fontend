// src/lib/api.js

// 1) ถ้าหน้าเว็บรันบน localhost ให้ "บังคับใช้" backend local ทันที
const DEV_FORCE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
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
  if (!res.ok) {
    let msg = await res.text().catch(() => "");
    try {
      msg = JSON.parse(msg)?.message || msg;
    } catch {}
    throw new Error(msg || `${res.status} ${res.statusText}`);
  }

  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

async function request(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    credentials: "include", // ✅ สำคัญสำหรับ cookie-based auth
    ...opts,
  });
  return handle(res);
}

// ---------- exported API ----------
export const API = {
  // ===== Auth =====
  login: ({ username, password }) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  logout: () =>
    request("/auth/logout", {
      method: "POST",
    }),

  getMe: () => request("/auth/me"),

  // ===== Teams =====
  listTeams: () => request("/teams"),
  listTeamsByHand: (hand) =>
    request(`/teams?handLevel=${encodeURIComponent(hand)}`),
  createTeam: (data) =>
    request("/teams", { method: "POST", body: JSON.stringify(data) }),
  
  // อัปเดตอันดับ (Manual Rank)
  updateTeamRanks: (updates) =>
    request("/teams/update-ranks", {
      method: "PUT",
      body: JSON.stringify({ updates }),
    }),

  // ===== Players =====
  listPlayers: () => request("/players"),
  createPlayer: (data) =>
    request("/players", { method: "POST", body: JSON.stringify(data) }),

  // ===== Matches / Schedule =====
  listSchedule: ({
    page = 1,
    pageSize = 50,
    day = "",
    handLevel = "",
    group = "",
    court = "",
    status = "",
    q = "",
    sort = "matchNo,scheduledAt",
  } = {}) => {
    const qs = new URLSearchParams();
    if (day) qs.set("day", day);
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

  // ใช้สำหรับหน้า AdminMatchScoring
  listMatchesForScoring: async ({
    page = 1,
    pageSize = 24,
    handLevel = "",
    group = "",
    q = "",
    roundType = "",
    onlyFinished = false,
  } = {}) => {
    const qs = new URLSearchParams();
    if (handLevel) qs.set("handLevel", handLevel);
    if (group) qs.set("group", group);
    if (roundType) qs.set("roundType", roundType);

    const base = await request(
      `/matches${qs.toString() ? `?${qs.toString()}` : ""}`
    );

    const all = Array.isArray(base?.items)
      ? base.items
      : Array.isArray(base)
      ? base
      : [];

    let items = all;

    if (onlyFinished) {
      items = items.filter((m) => m.status === "finished");
    }

    if (q) {
      const keyword = q.toLowerCase();
      items = items.filter((m) => {
        const id =
          (m.matchId && String(m.matchId).toLowerCase()) ||
          (m.matchNo && String(m.matchNo).toLowerCase()) ||
          "";
        const t1 =
          (teamName(m.team1) || m.team1Name || "").toLowerCase();
        const t2 =
          (teamName(m.team2) || m.team2Name || "").toLowerCase();
        return (
          id.includes(keyword) || t1.includes(keyword) || t2.includes(keyword)
        );
      });
    }

    const total = items.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = items.slice(start, end);

    return { items: pageItems, total, page };
  },

  reorderMatches: (data) =>
    request("/matches/reorder", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateSchedule: (id, data) =>
    request(`/matches/${id}/schedule`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateScore: (id, data) =>
    request(`/matches/${id}/score`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // ✅✅✅ เพิ่มฟังก์ชันสำหรับ Mock คะแนน ✅✅✅
  mockScores: ({ handLevel }) =>
    request("/matches/mock-scores", {
      method: "POST",
      body: JSON.stringify({ handLevel }),
    }),

  // ===== Tournament / Groups / Knockout =====
  generateGroups: (body) =>
    request("/tournaments/generate-groups", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  manualGroupAndGenerate: (body) =>
    request("/tournaments/generate-groups/manual", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  generateKnockout: (body) =>
    request("/tournaments/generate-knockout/manual", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    
  // ฟังก์ชันสร้าง Knockout อัตโนมัติ
  generateKnockoutAuto: (body) =>
    request("/matches/generate-knockout-auto", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // ===== Standings =====
  getStandings: (hand) =>
    request(
      `/standings${hand ? `?handLevel=${encodeURIComponent(hand)}` : ""}`
    ),

  clearStandings: ({ handLevel, resetMatches = true, tournamentId }) =>
    request("/standings/clear", {
      method: "POST",
      body: JSON.stringify({
        handLevel,
        resetMatches,
        tournamentId,
      }),
    }),
  recalculateStandings: ({ handLevel, tournamentId }) =>
    request("/standings/recalculate", {
      method: "POST",
      body: JSON.stringify({ handLevel, tournamentId }),
    }),

  // Utilities: group standings จาก teams
  async listGroups() {
    const teams = await request("/teams");
    const byLevel = {};

    for (const t of teams) {
      const level = t.handLevel || "UNKNOWN";
      const g = t.group ?? null;

      if (!byLevel[level]) byLevel[level] = { level, groups: {} };
      if (g === null) continue;

      if (!byLevel[level].groups[g]) {
        byLevel[level].groups[g] = { groupName: g, teams: [] };
      }
      byLevel[level].groups[g].teams.push(t);
    }

    const result = Object.values(byLevel)
      .map((lvl) => {
        Object.values(lvl.groups).forEach((g) => {
          g.teams.sort(
            (a, b) =>
              (b.points ?? 0) - (a.points ?? 0) ||
              (b.scoreDiff ??
                (b.scoreFor ?? 0) - (b.scoreAgainst ?? 0)) -
                (a.scoreDiff ??
                  (a.scoreFor ?? 0) - (a.scoreAgainst ?? 0))
          );
        });

        return {
          level: lvl.level,
          groups: Object.values(lvl.groups).sort((a, b) =>
            a.groupName.localeCompare(b.groupName)
          ),
        };
      })
      .sort((a, b) => a.level.localeCompare(b.level));

    return result;
  },

  async listGroupMatches() {
    const matches = await request("/matches");
    const byLevel = {};

    for (const m of matches) {
      if (!/group/i.test(m.round || "group")) continue;

      const level =
        (m.level && m.level.toUpperCase()) ||
        (m.team1?.handLevel?.toUpperCase &&
          m.team1.handLevel.toUpperCase()) ||
        (m.team2?.handLevel?.toUpperCase &&
          m.team2.handLevel.toUpperCase()) ||
        "UNKNOWN";

      if (!byLevel[level]) byLevel[level] = { level, matches: [] };
      byLevel[level].matches.push(m);
    }

    return Object.values(byLevel);
  },

  async listKnockout() {
    const matches = await request("/matches");
    const byRound = {};

    for (const m of matches) {
      if (m.roundType !== "knockout") continue;
      const name = m.roundName || m.round || "Unknown";

      if (!byRound[name]) byRound[name] = { name, matches: [] };
      byRound[name].matches.push(m);
    }

    const order = ["Round of 16", "Quarter-final", "Semifinal", "Final"];
    return Object.values(byRound).sort(
      (a, b) =>
        (order.indexOf(a.name) + 1 || 99) -
        (order.indexOf(b.name) + 1 || 99)
    );
  },
};

// ---------- Helpers ----------
export function teamName(t) {
  if (!t) return "-";
  if (typeof t === "string") return t;
  if (t.teamName) return t.teamName;
  if (t.name) return t.name;

  const n1 =
    t.players?.[0]?.nickname || t.players?.[0]?.fullName || "";
  const n2 =
    t.players?.[1]?.nickname || t.players?.[1]?.fullName || "";

  const duo = [n1, n2].filter(Boolean).join("/");
  return duo || "-";
}