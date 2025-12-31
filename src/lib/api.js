// src/lib/api.js
export const API_BASE = `${window.location.origin}/api`;

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

// [Phase 3] Helper: ดึง Active Tournament ID
function getActiveTournamentId() {
  try {
    return localStorage.getItem("selectedTournamentId");
  } catch (e) {
    return null;
  }
}

async function request(path, opts = {}) {
  // 1. สร้าง URL Object เพื่อจัดการ Query Params ง่ายๆ
  const urlObj = new URL(`${API_BASE}${path}`);

  // 2. [Auto-Inject] ใส่ tournamentId ลงใน Query Param เสมอ (สำหรับ GET)
  const activeTid = getActiveTournamentId();
  if (activeTid) {
    urlObj.searchParams.set("tournamentId", activeTid);
  }

  // 3. [Auto-Inject] ใส่ tournamentId ลงใน Body (สำหรับ POST/PUT)
  let options = { ...opts };
  if (activeTid && options.body && typeof options.body === "string") {
    try {
      const headers = options.headers || {};
      const isJson =
        headers["Content-Type"] === "application/json" ||
        !headers["Content-Type"];

      if (
        isJson &&
        options.method &&
        ["POST", "PUT", "PATCH"].includes(options.method.toUpperCase())
      ) {
        const bodyObj = JSON.parse(options.body);
        if (!bodyObj.tournamentId) {
          bodyObj.tournamentId = activeTid;
          options.body = JSON.stringify(bodyObj);
        }
      }
    } catch (e) {
      // ignore error
    }
  }

  const res = await fetch(urlObj.toString(), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
    ...options,
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

  // ===== Tournaments (New) =====
  listTournaments: () => request("/tournaments"),
  getTournament: (id) => request(`/tournaments/${id}`),

  createTournament: (data) =>
    request("/tournaments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // ===== Teams =====
  listTeams: () => request("/teams"),
  listTeamsByHand: (hand) =>
    request(`/teams?handLevel=${encodeURIComponent(hand)}`),

  createTeam: (data) =>
    request("/teams", { method: "POST", body: JSON.stringify(data) }),

  updateTeam: (id, data) =>
    request(`/teams/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteTeam: (id) => request(`/teams/${id}`, { method: "DELETE" }),

  updateTeamRanks: (updates) =>
    request("/teams/update-ranks", {
      method: "PUT",
      body: JSON.stringify({ updates }),
    }),

  // ✅ [NEW] Upload Team Photo
  // ต้องใช้ fetch แยก เพราะห้ามใส่ Content-Type เป็น application/json
  uploadTeamPhoto: async (teamId, file) => {
    const formData = new FormData();
    formData.append("photo", file); // ชื่อ field ต้องตรงกับ backend upload.single('photo')

    const res = await fetch(`${API_BASE}/teams/${teamId}/upload-photo`, {
      method: "POST",
      credentials: "include", // ส่ง cookie auth ไปด้วย
      body: formData, // Browser จะจัดการ Content-Type + Boundary ให้เอง
    });

    return handle(res);
  },

  // ===== Players =====
  listPlayers: () => request("/players"),

  createPlayer: (data) =>
    request("/players", { method: "POST", body: JSON.stringify(data) }),

  updatePlayer: (id, data) =>
    request(`/players/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deletePlayer: (id) => request(`/players/${id}`, { method: "DELETE" }),

  importPlayers: (playersData) =>
    request("/players/import", {
      method: "POST",
      body: JSON.stringify({ players: playersData }),
    }),

  // ===== Matches / Schedule =====
  createMatch: (data) =>
    request("/matches", { method: "POST", body: JSON.stringify(data) }),

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
    qs.set("pageSize", 2000);
    return request(`/matches?${qs.toString()}`);
  },

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
    qs.set("pageSize", 10000);

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
        const t1 = (teamName(m.team1) || m.team1Name || "").toLowerCase();
        const t2 = (teamName(m.team2) || m.team2Name || "").toLowerCase();
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

  mockScores: ({ handLevel }) =>
    request("/matches/mock-scores", {
      method: "POST",
      body: JSON.stringify({ handLevel }),
    }),

  // ===== Tournament Logic =====
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

  generateKnockoutAuto: (body) =>
    request("/matches/generate-knockout-auto", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // ===== Standings =====
  getStandings: (hand, tournamentId) => {
    const qs = new URLSearchParams();
    if (hand) qs.set("handLevel", hand);
    if (tournamentId) qs.set("tournamentId", tournamentId);
    return request(`/standings?${qs.toString()}`);
  },

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

  updateTournament: (id, data) =>
    request(`/tournaments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // 1. ดึงทีมวาง (Prepare Seeds)
  prepareKnockoutSeeds: ({ handLevel, tournamentId }) =>
    request("/matches/prepare-seeds", {
      method: "POST",
      body: JSON.stringify({ handLevel, tournamentId }),
    }),

  // 2. อัปเดตการจับคู่ (Manual Pairing) - เลือกคู่แข่ง
  updateMatchPairing: (matchId, { team1Id, team2Id }) =>
    request(`/matches/${matchId}/pairing`, {
      method: "PATCH",
      body: JSON.stringify({ team1Id, team2Id }),
    }),

  resetKnockoutMatches: ({ handLevel, tournamentId }) =>
    request("/matches/reset-knockout", {
      method: "POST",
      body: JSON.stringify({ handLevel, tournamentId }),
    }),

  // Utilities
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
              (b.scoreDiff ?? (b.scoreFor ?? 0) - (b.scoreAgainst ?? 0)) -
                (a.scoreDiff ?? (a.scoreFor ?? 0) - (a.scoreAgainst ?? 0))
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
        (m.team1?.handLevel?.toUpperCase && m.team1.handLevel.toUpperCase()) ||
        (m.team2?.handLevel?.toUpperCase && m.team2.handLevel.toUpperCase()) ||
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
        (order.indexOf(a.name) + 1 || 99) - (order.indexOf(b.name) + 1 || 99)
    );
  },
};

export function teamName(t) {
  if (!t) return "-";
  if (typeof t === "string") return t;
  if (t.teamName) return t.teamName;
  if (t.name) return t.name;
  const n1 = t.players?.[0]?.nickname || t.players?.[0]?.fullName || "";
  const n2 = t.players?.[1]?.nickname || t.players?.[1]?.fullName || "";
  const duo = [n1, n2].filter(Boolean).join("/");
  return duo || "-";
}
