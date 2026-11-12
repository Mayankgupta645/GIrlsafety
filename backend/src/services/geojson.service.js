import pool from "../db/index.js";

export async function getRoadsGeoJSON() {
  const result = await pool.query(`
    SELECT
      id,
      risk_score,
      ST_AsGeoJSON(geom)::json AS geometry
    FROM roads
    LIMIT 200;
  `);

  return {
    type: "FeatureCollection",
    features: result.rows.map(row => ({
      type: "Feature",
      geometry: row.geometry,
      properties: {
        id: row.id,
        risk_score: row.risk_score
      }
    }))
  };
}
