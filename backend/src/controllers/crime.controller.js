import pool from "../db/index.js";

export const getCrimeScore = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    const query = `
      SELECT severity
      FROM crimes
      WHERE
        ABS(latitude - $1) < 0.02
        AND ABS(longitude - $2) < 0.02
    `;

    const result = await pool.query(query, [lat, lon]);

    let score = 0;
    result.rows.forEach(r => score += r.severity);

    res.json({
      crimeScore: score,
      count: result.rows.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Crime score fetch failed" });
  }
};
