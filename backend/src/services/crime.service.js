import express from "express";
import { getCrimeScore } from "../controllers/crime.controller.js";

const router = express.Router();

router.get("/score", getCrimeScore);

export default router;
