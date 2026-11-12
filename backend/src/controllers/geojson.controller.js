import { getRoadsGeoJSON } from "../services/geojson.service.js";

export async function roadsGeoJSON(req, res) {
  try {
    const data = await getRoadsGeoJSON();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch roads GeoJSON" });
  }
}
