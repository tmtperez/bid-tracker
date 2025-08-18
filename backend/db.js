// backend/db.js
import pg from "pg";
const { Pool } = pg;

const { DATABASE_URL, DATABASE_CA_CERT } = process.env;
if (!DATABASE_URL) throw new Error("DATABASE_URL is required");

const ssl = DATABASE_CA_CERT ? { ca: DATABASE_CA_CERT } : { rejectUnauthorized: false };

export const pool = new Pool({ connectionString: DATABASE_URL, ssl });
export const query = (text, params) => pool.query(text, params);
export default pool;
