import pkg from 'pg';
const { Pool } = pkg;

const { DATABASE_URL, NODE_ENV } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

// Enable SSL in production (DigitalOcean). The DO CA is self-signed;
// rejectUnauthorized:false is the common setting for DO App Platform.
const ssl =
  NODE_ENV === 'production'
    ? { rejectUnauthorized: false }  // DO managed PG
    : false;                          // local docker-compose: no SSL

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl,
});

export async function query(sql, params = []) {
  const start = Date.now();
  const res = await pool.query(sql, params);
  const ms = Date.now() - start;
  if (ms > 200) console.log(`[db] slow query ${ms}ms:`, sql);
  return res;
}
