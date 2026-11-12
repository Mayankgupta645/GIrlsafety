import pool from "../db/index.js";

export async function createSOS({ lat, lon, source }) {
  const query = `
    INSERT INTO sos_alerts (latitude, longitude, source)
    VALUES ($1, $2, $3)
    RETURNING id, latitude, longitude, source, created_at;
  `;

  const { rows } = await pool.query(query, [lat, lon, source]);
  return rows[0];
}
