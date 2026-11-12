import express from "express";


const router = express.Router();

const photonDisplayName = (properties) => [...new Set([
  properties.name,
  properties.housenumber,
  properties.street,
  properties.locality,
  properties.district,
  properties.city,
  properties.state,
  properties.postcode,
  properties.country
].filter(Boolean))].join(", ");

async function searchPlaces(query, limit) {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("lang", "en");

  const response = await fetch(url, {
    headers: { "User-Agent": "SafeRoute-App/1.0" },
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) {
    throw new Error(`Geocoding provider returned HTTP ${response.status}`);
  }

  const data = await response.json();
  return (data.features || [])
    .filter(feature => feature.properties?.countrycode === "IN")
    .map(feature => {
      const [lon, lat] = feature.geometry.coordinates;
      return {
        lat: Number(lat),
        lon: Number(lon),
        display_name: photonDisplayName(feature.properties),
        type: feature.properties.type || feature.properties.osm_value || "place"
      };
    })
    .filter(place => Number.isFinite(place.lat) && Number.isFinite(place.lon));
}

router.get("/search", async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!q) return res.status(400).json({ error: "Missing query" });

    const places = await searchPlaces(q, 8);
    res.json(places);
  } catch (err) {
    console.error("Place search failed:", err.message);
    res.status(502).json({ error: "Place search is temporarily unavailable" });
  }
});

router.get("/geocode", async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!q) return res.status(400).json({ error: "Missing query" });

    const places = await searchPlaces(q, 1);
    if (!places.length) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.json(places[0]);
  } catch (err) {
    console.error("Geocoding failed:", err.message);
    res.status(502).json({ error: "Geocoding provider unavailable" });
  }
});

export default router;
