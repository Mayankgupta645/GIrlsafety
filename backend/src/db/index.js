import pkg from "pg";
const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL?.trim();
const pool = new Pool(connectionString
  ? { connectionString }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT || 5432),
    });

pool.query("SELECT 1")
  .then(() => console.log("✅ PostgreSQL connected"))
  .catch((err) => {
    const connectionErrors = Array.isArray(err.errors)
      ? err.errors.map(({ code, address, port }) =>
          [code, address && `${address}:${port}`].filter(Boolean).join(" "))
        .join(", ")
      : "";
    console.error(
      "❌ PostgreSQL connection failed:",
      connectionErrors || err.message || err.code || "Unknown connection error"
    );
  });

export default pool;
