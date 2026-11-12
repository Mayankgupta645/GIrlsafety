import pool from "../db/index.js";

/**
 * Calculate risk for ONE road segment
 */
export const calculateRoadRisk = async (roadId) => {
  // Crime influence (last 1 day)
  const crimeRes = await pool.query(`
    SELECT COUNT(*)
    FROM crime_incidents c, roads r
    WHERE r.id = $1
    AND ST_DWithin(c.geom::geography, r.geom::geography, 50)
    AND c.created_at > NOW() - INTERVAL '1 day'
  `, [roadId]);

  const crimeCount = Number(crimeRes.rows[0].count);

  // SOS influence (last 1 days)
  const sosRes = await pool.query(`
    SELECT COUNT(*)
    FROM sos_alerts s, roads r
    WHERE r.id = $1
    AND ST_DWithin(
      ST_SetSRID(ST_Point(s.longitude, s.latitude), 4326)::geography,
      r.geom::geography,
      50
    )
    AND s.created_at > NOW() - INTERVAL '1 day'
  `, [roadId]);

  const sosCount = Number(sosRes.rows[0].count);

  // Time risk
  const hour = new Date().getHours();
  const timeRisk = hour >= 20 || hour <= 5 ? 3 : 0;

  // Final score (clamped)
  let score =
    crimeCount * 0.4 +
    sosCount * 0.5 +
    timeRisk;

  return Math.min(10, Math.round(score));
};
export const updateAllRoadRisks = async () => {
  const roads = await pool.query(`SELECT id FROM roads`);

  for (const r of roads.rows) {
    const risk = await calculateRoadRisk(r.id);
    await pool.query(
      `UPDATE roads SET risk_score = $1 WHERE id = $2`,
      [risk, r.id]
    );
  }

  console.log("✅ Road risks updated");
};
