import "./config/env.js";
import express from "express";
import cors from "cors";
import geojsonRoutes from "./routes/geojson.routes.js";
import routeRoutes from "./routes/route.routes.js";
import crimeRoutes from "./routes/crime.routes.js";
import sosRoutes from "./routes/sos.routes.js";
import geoRoutes from "./routes/geo.routes.js";

const app = express();

// 🔴 CRITICAL: Proper CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 🔴 CRITICAL: Body parsers MUST come after CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/routes", routeRoutes);
app.use("/api/crimes", crimeRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/geojson", geojsonRoutes);
app.use("/api/geo", geoRoutes);

app.get("/", (req, res) => {
  res.send("SafeRoute API running");
});

export default app;