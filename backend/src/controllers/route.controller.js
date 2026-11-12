import fetch from "node-fetch";

export const getRoutes = async (req, res) => {
  const { startLat, startLon, endLat, endLon } = req.query;

  const url = `http://router.project-osrm.org/route/v1/foot/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson&steps=true&alternatives=true`;

  const r = await fetch(url);
  const data = await r.json();

  if (!data.routes) return res.status(500).json({ error: "Routing failed" });

  res.json({
    routes: data.routes.map(r => ({
      geometry: r.geometry.coordinates.map(c => [c[1], c[0]]),
      legs: r.legs,
      distance: r.distance,
      duration: r.duration
    }))
  });
};
