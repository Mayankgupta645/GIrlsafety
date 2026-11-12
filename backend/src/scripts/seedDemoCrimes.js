import "../config/env.js";
import pool from "../db/index.js";

const legacySeedCoordinates = [
  [27.1758, 78.0094],
  [27.1812, 78.0141],
  [27.1689, 78.0022],
  [27.1901, 78.0235],
  [27.1607, 78.0192],
  [27.1541, 77.9984]
];
const incidentTypes = ["theft", "harassment", "accident", "theft", "assault"];

try {
  await pool.query("BEGIN");
  for (const [lat, lon] of legacySeedCoordinates) {
    await pool.query(`
      DELETE FROM crime_incidents
      WHERE source = 'demo'
        AND demo_key IS NULL
        AND ST_X(geom) = $1
        AND ST_Y(geom) = $2
    `, [lon, lat]);
  }

  let state = 0xA6A2026;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  const demoIncidents = Array.from({ length: 500 }, (_, index) => ({
    demo_key: `agra-demo-${String(index + 1).padStart(4, "0")}`,
    type: incidentTypes[Math.floor(random() * incidentTypes.length)],
    lat: Number((27.105 + random() * 0.13).toFixed(6)),
    lon: Number((77.925 + random() * 0.18).toFixed(6))
  }));

  await pool.query(`
    INSERT INTO crime_incidents (demo_key, type, source, geom, created_at)
    SELECT
      incident.demo_key,
      incident.type,
      'demo',
      ST_SetSRID(ST_Point(incident.lon, incident.lat), 4326),
      NOW()
    FROM jsonb_to_recordset($1::jsonb)
      AS incident(demo_key TEXT, type TEXT, lat DOUBLE PRECISION, lon DOUBLE PRECISION)
    ON CONFLICT (demo_key) DO UPDATE
    SET type = EXCLUDED.type,
        source = 'demo',
        geom = EXCLUDED.geom,
        created_at = NOW()
  `, [JSON.stringify(demoIncidents)]);

  await pool.query("COMMIT");
  console.log("Seeded 500 synthetic Agra map points (marked as demo, not real reports).");
} catch (error) {
  await pool.query("ROLLBACK");
  console.error("Demo crime seeding failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
