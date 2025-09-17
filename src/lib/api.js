// src/lib/api.js
// Frontend API helper used by Admin/Public pages

const BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || ""; // e.g. http://127.0.0.1:5000 or http://119.59.102.134

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...opts,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    try {
      const j = JSON.parse(txt || "{}");
      throw new Error(
        j.message || j.error || `${res.status} ${res.statusText}`
      );
    } catch {
      throw new Error(txt || `${res.status} ${res.statusText}`);
    }
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export const API = {
  // ------- Teams -------
  async listTeams() {
    return request("/api/teams");
  },
  async createTeam(data) {
    return request("/api/teams", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // ------- Matches -------
  async listAllMatches() {
    return request("/api/matches"); // expects your backend to support GET /api/matches
  },
  async updateMatch(id, payload) {
    return request(`/api/matches/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  // ------- Tournaments utils (optional) -------
  async generateGroups(payload) {
    return request("/api/tournaments/generate-groups", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async generateKnockout(payload) {
    return request("/api/tournaments/generate-knockout", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // ------- Derived helpers (computed on FE so it works with current backend) -------
  // Build group standings per hand level from /api/teams
  async listGroups() {
    const teams = await request("/api/teams");
    const byLevel = {};
    for (const t of teams) {
      const level = t.handLevel || "UNKNOWN";
      if (!byLevel[level])
        byLevel[level] = { level, standings: [], matches: [] };
      byLevel[level].standings.push(t);
    }
    // sort standings (points desc, diff desc)
    Object.values(byLevel).forEach((g) => {
      g.standings.sort(
        (a, b) =>
          (b.points ?? 0) - (a.points ?? 0) ||
          (b.scoreDifference ?? 0) - (a.scoreDifference ?? 0)
      );
    });
    return Object.values(byLevel);
  },

  // Group-stage matches grouped by hand level
  async listGroupMatches() {
    const matches = await request("/api/matches"); // fallback to all matches then filter
    const byLevel = {};
    for (const m of matches) {
      const isGroup = /group/i.test(m.round || "group");
      if (!isGroup) continue;
      const level =
        m.handLevel ||
        m.level ||
        m.team1?.handLevel ||
        m.team2?.handLevel ||
        "UNKNOWN";
      if (!byLevel[level]) byLevel[level] = { level, matches: [] };
      byLevel[level].matches.push(m);
    }
    return Object.values(byLevel);
  },

  // Knockout matches grouped by round name
  async listKnockout() {
    const matches = await request("/api/matches");
    const byRound = {};
    for (const m of matches) {
      const isGroup = /group/i.test(m.round || "");
      if (isGroup) continue;
      const name = m.round || "Knockout";
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

// Helper: get team display name robustly
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
