import express from "express";
import fetch from "node-fetch";
import pool from "../db/index.js";

const router = express.Router();

const toMeters = ([lon, lat], referenceLat) => [
  lon * 111320 * Math.cos(referenceLat * Math.PI / 180),
  lat * 110540
];

function distanceToSegmentMeters(point, start, end) {
  const referenceLat = point[1];
  const [px, py] = toMeters(point, referenceLat);
  const [ax, ay] = toMeters(start, referenceLat);
  const [bx, by] = toMeters(end, referenceLat);
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const fraction = lengthSquared
    ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared))
    : 0;
  return Math.hypot(px - (ax + fraction * dx), py - (ay + fraction * dy));
}

function scoreRoute(route, incidents) {
  const coordinates = route.geometry?.coordinates || [];
  let weightedExposure = 0;
  let incidentCount = 0;

  for (const incident of incidents) {
    let nearestDistance = Infinity;
    for (let i = 1; i < coordinates.length; i++) {
      nearestDistance = Math.min(
        nearestDistance,
        distanceToSegmentMeters([incident.lon, incident.lat], coordinates[i - 1], coordinates[i])
      );
    }

    if (nearestDistance <= 250) {
      incidentCount++;
      const type = incident.type.toLowerCase();
      const severity = /assault|harassment|violence/.test(type) ? 4
        : /theft|robbery/.test(type) ? 3
          : /accident/.test(type) ? 2 : 1;
      weightedExposure += severity * (1 - nearestDistance / 250);
    }
  }

  return {
    crime_score: Math.min(10, Number((weightedExposure / 2).toFixed(1))),
    nearby_incidents: incidentCount
  };
}

router.get("/route", async (req, res) => {
  try {
    const { startLat, startLon, endLat, endLon } = req.query;

    const coordinates = [startLat, startLon, endLat, endLon].map(Number);
    if (coordinates.some(value => !Number.isFinite(value))) {
      return res.status(400).json({ error: "Missing coordinates" });
    }

    const [startLatitude, startLongitude, endLatitude, endLongitude] = coordinates;
    if (Math.abs(startLatitude) > 90 || Math.abs(endLatitude) > 90
      || Math.abs(startLongitude) > 180 || Math.abs(endLongitude) > 180) {
      return res.status(400).json({ error: "Coordinates are out of range" });
    }
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLongitude},${startLatitude};${endLongitude},${endLatitude}?alternatives=3&steps=true&geometries=geojson`;

    const response = await fetch(osrmUrl, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      return res.status(502).json({ error: "Routing provider unavailable" });
    }
    const osrmData = await response.json();

    if (!osrmData.routes || osrmData.routes.length === 0) {
      return res.status(404).json({ error: "No routes found" });
    }

    const routeCoordinates = osrmData.routes.flatMap(route => route.geometry?.coordinates || []);
    if (!routeCoordinates.length) {
      return res.status(502).json({ error: "Routing provider returned invalid route geometry" });
    }
    const bounds = routeCoordinates.reduce((result, [lon, lat]) => ({
      minLon: Math.min(result.minLon, lon),
      minLat: Math.min(result.minLat, lat),
      maxLon: Math.max(result.maxLon, lon),
      maxLat: Math.max(result.maxLat, lat)
    }), { minLon: Infinity, minLat: Infinity, maxLon: -Infinity, maxLat: -Infinity });
    const incidentsResult = await pool.query(`
      SELECT type, ST_X(geom) AS lon, ST_Y(geom) AS lat
      FROM crime_incidents
      WHERE created_at > NOW() - INTERVAL '30 days'
        AND geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
      ORDER BY created_at DESC
      LIMIT 5000
    `, [bounds.minLon - 0.01, bounds.minLat - 0.01, bounds.maxLon + 0.01, bounds.maxLat + 0.01]);
    const incidents = incidentsResult.rows.map(incident => ({
      ...incident,
      lon: Number(incident.lon),
      lat: Number(incident.lat)
    }));

    const scoredRoutes = osrmData.routes.map(route => ({
      geometry: route.geometry,
      distance: route.distance,
      duration: route.duration,
      legs: route.legs,
      ...scoreRoute(route, incidents)
    }));

    const fastest = [...scoredRoutes].sort((a, b) => a.duration - b.duration)[0];
    const safest = [...scoredRoutes].sort((a, b) =>
      a.crime_score - b.crime_score || a.duration - b.duration
    ).find(route => route !== fastest);
    const routes = safest ? [fastest, safest] : [fastest];

    res.json({ routes });

  } catch (err) {
    console.error("ROUTE ERROR:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
