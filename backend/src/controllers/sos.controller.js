import { createSOS } from "../services/sos.service.js";

export async function sendSOS(req, res) {
  try {
    const { lat, lon, source } = req.body;

    if (!lat || !lon) {
      return res.status(400).json({ error: "Location required" });
    }

    const sos = await createSOS({ lat, lon, source });

    res.json({
      success: true,
      message: "SOS sent successfully",
      sos
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send SOS" });
  }
}
