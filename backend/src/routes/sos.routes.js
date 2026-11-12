import express from "express";
import { makeSOSCall } from "../services/twilio.service.js";
import { createSOS } from "../services/sos.service.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { phone, lat, lon, source } = req.body;
    const mode = process.env.SOS_MODE?.trim().toLowerCase() || "demo";
    const destination = phone || process.env.EMERGENCY_PHONE;
    if (mode === "twilio" && !destination) {
      return res.status(400).json({ error: "Emergency phone number is not configured" });
    }

    if (mode !== "demo" && mode !== "twilio") {
      return res.status(500).json({ error: "SOS_MODE must be 'demo' or 'twilio'" });
    }

    let sosRecord = null;
    if (lat != null && lon != null) {
      const latitude = Number(lat);
      const longitude = Number(lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return res.status(400).json({ error: "Valid latitude and longitude are required" });
      }
      sosRecord = await createSOS({ lat: latitude, lon: longitude, source: source || "Manual" });
    }

    if (mode === "twilio") {
      await makeSOSCall(destination);
    }

    res.json({
      success: true,
      mode,
      message: mode === "demo"
        ? "Demo SOS call simulated. No phone call was placed."
        : "SOS call placed successfully",
      sos: sosRecord
    });

  } catch (err) {
    console.error("SOS request failed:", err.message);
    res.status(500).json({ error: "SOS request failed" });
  }
});

export default router;