import "../config/env.js";
import pool from "../db/index.js";

try {
  await pool.query("CREATE EXTENSION IF NOT EXISTS postgis");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS crime_incidents (
      id BIGSERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'reported',
      geom geometry(Point, 4326) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    ALTER TABLE crime_incidents
    ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'reported'
  `);
  await pool.query(`
    ALTER TABLE crime_incidents
    ADD COLUMN IF NOT EXISTS demo_key TEXT
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS crime_incidents_demo_key_unique
    ON crime_incidents (demo_key)
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roads (
      id BIGSERIAL PRIMARY KEY,
      osm_id BIGINT UNIQUE,
      name TEXT,
      highway_type TEXT,
      geom geometry(LineString, 4326) NOT NULL,
      risk_score NUMERIC NOT NULL DEFAULT 0
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sos_alerts (
      id BIGSERIAL PRIMARY KEY,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      source TEXT NOT NULL DEFAULT 'Manual',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log("Database tables are ready.");
} catch (error) {
  console.error("Database setup failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
