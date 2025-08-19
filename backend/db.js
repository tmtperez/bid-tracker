// backend/db.js
import pkg from 'pg';
const { Pool } = pkg;

const { DATABASE_URL, DATABASE_CA_CERT, NODE_ENV } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

// If the cert value uses "\n" (typical in .env files), convert to real newlines.
const toPem = (s) => (s ? s.replace(/\\n/g, '\n') : undefined);

// Append sslmode=require to the URL if not present
const urlWithSsl =
  DATABASE_URL.includes('sslmode=') ? DATABASE_URL
  : DATABASE_URL + (DATABASE_URL.includes('?') ? '&' : '?') + 'sslmode=require';

// Only pass the ssl object when we actually have a CA (useful for local dev)
const ssl =
  DATABASE_CA_CERT
    ? { rejectUnauthorized: true, ca: toPem(DATABASE_CA_CERT) }
    : (NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined);

export const pool = new Pool({
  connectionString: urlWithSsl,
  ssl,
});

export async function query(sql, params = []) {
  const t0 = Date.now();
  const res = await pool.query(sql, params);
  const ms = Date.now() - t0;
  if (ms > 200) console.log(`[db] slow query ${ms}ms:`, sql);
  return res;
}
