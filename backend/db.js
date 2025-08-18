// backend/db.js
import pg from "pg";
const { Pool } = pg;

// Force SSL defaults for ALL pg clients (even if someone new Pool()s elsewhere)
pg.defaults.ssl = { rejectUnauthorized: false };

const { DATABASE_URL, DATABASE_CA_CERT } = process.env;
if (!DATABASE_URL) throw new Error("DATABASE_URL is required");

// Prefer verifying with CA if provided; else allow self-signed
const ssl =
  DATABASE_CA_CERT && DATABASE_CA_CERT.trim()
    ? { ca: DATABASE_CA_CERT }
    : { rejectUnauthorized: false };

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl,
});

export const query = (text, params) => pool.query(text, params);
export default pool;
