import express from "express";
import { roadsGeoJSON } from "../controllers/geojson.controller.js";

const router = express.Router();

router.get("/roads", roadsGeoJSON);

export default router;
