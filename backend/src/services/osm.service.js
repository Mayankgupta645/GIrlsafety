import axios from "axios";
import pool from "../db/index.js";

export async function fetchAndStoreRoads() {
  try {
    const overpassQuery = `
      [out:json][timeout:25];
      (
        way["highway"](13.028,80.230,13.038,80.340);
      );
      out geom;
    `;

    const url = "https://overpass-api.de/api/interpreter";

    const response = await axios.post(url, overpassQuery, {
      headers: { "Content-Type": "text/plain" },
      timeout: 60000 // 30 seconds
    });

    let count = 0;

    for (const element of response.data.elements) {
      if (!element.geometry) continue;

      const coords = element.geometry
        .map(p => `${p.lon} ${p.lat}`)
        .join(",");

      const lineString = `LINESTRING(${coords})`;

      await pool.query(
        `
        INSERT INTO roads (osm_id, name, highway_type, geom)
        VALUES ($1, $2, $3, ST_GeomFromText($4, 4326))
        ON CONFLICT DO NOTHING
        `,
        [
          element.id,
          element.tags?.name || null,
          element.tags?.highway || null,
          lineString
        ]
      );

      count++;
    }

    console.log(` Roads loaded from OpenStreetMap: ${count}`);
  } catch (error) {
    console.error(" OSM fetch failed:", error.message);
  }
}
