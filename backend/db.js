import pkg from 'pg';
const { Pool } = pkg;

const { DATABASE_URL, NODE_ENV, PGSSL } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

// Enable SSL when running on DO Managed PG (self-signed cert) or when PGSSL=require
const needSsl =
  /ondigitalocean\.com/i.test(DATABASE_URL) ||
  PGSSL === 'require' ||
  NODE_ENV === 'production';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: needSsl ? { rejectUnauthorized: false } : false,
});

export async function query(sql, params = []) {
  const start = Date.now();
  const res = await pool.query(sql, params);
  const ms = Date.now() - start;
  if (ms > 200) console.log(`[db] slow query ${ms}ms:`, sql);
  return res;
}
