// backend/db.js
import pg from "pg";
const { Pool } = pg;

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error("DATABASE_URL is required");

// DO Managed Postgres: accept their cert (or swap to CA verify later)
export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// helper so routes can do: import { query } from '../db.js'
export const query = (text, params) => pool.query(text, params);

export default pool;
