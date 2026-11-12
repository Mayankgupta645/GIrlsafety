import pool from "../db/index.js";

export async function calculateRiskScores() {
  const query = `
    UPDATE roads
    SET risk_score =
      CASE
        WHEN highway_type = 'motorway' THEN 10
        WHEN highway_type = 'primary' THEN 20
        WHEN highway_type = 'secondary' THEN 30
        WHEN highway_type = 'residential' THEN 50
        ELSE 60
      END
  `;
  await pool.query(query);
}
