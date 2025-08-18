import pg from "pg";
const { Pool } = pg;

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error("DATABASE_URL is required");

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // <— allow DO's managed cert
});

export async function query(sql, params = []) {
  const start = Date.now();
  const res = await pool.query(sql, params);
  const ms = Date.now() - start;
  if (ms > 200) console.log(`[db] slow query ${ms}ms:`, sql);
  return res;
}