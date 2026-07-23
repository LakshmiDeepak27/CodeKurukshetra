const { query } = require("../config/db");

async function getLeaderboard() {
  const rows = await query(
    `SELECT
       u.id, u.name, u.email, u.role, u.institution, u.avatar_url AS avatarUrl, u.battle_rating AS battleRating,
       COUNT(DISTINCT CASE WHEN s.verdict = 'Accepted' THEN s.problem_id END) AS solvedCount,
       COUNT(s.id) AS totalSubmissions,
       ROUND(
         (COUNT(DISTINCT CASE WHEN s.verdict = 'Accepted' THEN s.problem_id END) /
          NULLIF(COUNT(s.id), 0)) * 100, 1
       ) AS acceptanceRate
     FROM users u
     LEFT JOIN submissions s ON s.user_id = u.id
     GROUP BY u.id
     ORDER BY battleRating DESC, solvedCount DESC, acceptanceRate DESC, totalSubmissions ASC
     LIMIT 100`
  );

  return rows.map((row, index) => ({
    rank: index + 1,
    id: row.id,
    name: row.name,
    role: row.role,
    institution: row.institution || "Independent Coder",
    avatarUrl: row.avatarUrl || null,
    battleRating: Number(row.battleRating || 1200),
    solvedCount: Number(row.solvedCount || 0),
    totalSubmissions: Number(row.totalSubmissions || 0),
    acceptanceRate: row.acceptanceRate ? Number(row.acceptanceRate) : 0,
  }));
}

module.exports = { getLeaderboard };
