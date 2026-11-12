import express from "express";
import db from "../db/index.js";

const router = express.Router();

router.get("/score", async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: "Valid latitude and longitude are required" });
  }

  try {
    const result = await db.query(`
      SELECT
        COUNT(*)::int AS count,
        COUNT(*) FILTER (WHERE source = 'demo')::int AS demo_count,
        COALESCE(SUM(CASE
          WHEN type ILIKE '%assault%' OR type ILIKE '%harassment%' OR type ILIKE '%violence%' THEN 4
          WHEN type ILIKE '%theft%' OR type ILIKE '%robbery%' THEN 3
          WHEN type ILIKE '%accident%' THEN 2
          ELSE 1
        END), 0)::int AS weighted_score
      FROM crime_incidents
      WHERE created_at > NOW() - INTERVAL '30 days'
        AND ST_DWithin(
          geom::geography,
          ST_SetSRID(ST_Point($1, $2), 4326)::geography,
          1000
        )
    `, [lon, lat]);

    const row = result.rows[0];
    res.json({
      count: row.count,
      demo_count: row.demo_count,
      crime_score: Math.min(10, Number((row.weighted_score / 2).toFixed(1))),
      radius_meters: 1000,
      window_days: 30
    });
  } catch (err) {
    console.error("Crime score lookup failed:", err.message);
    res.status(500).json({ error: "Crime score lookup failed" });
  }
});

// GET crimes
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, type, source, ST_AsGeoJSON(geom) AS geom, created_at
      FROM crime_incidents
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST crime
router.post("/", async (req, res) => {
  const { type, lat, lon } = req.body;

  try {
    await db.query(
      `INSERT INTO crime_incidents (type, geom)
       VALUES ($1, ST_SetSRID(ST_Point($2, $3), 4326))`,
      [type, lon, lat]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
