// backend/db.js
import pkg from 'pg';
const { Pool } = pkg;

const { DATABASE_URL, DATABASE_CA_CERT } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

// Normalize for local .env when lines are "\n"
const toPem = (s) => (s ? s.replace(/\\n/g, '\n') : undefined);

// Always require SSL in the URL (belt & suspenders)
const urlWithSsl =
  DATABASE_URL.includes('sslmode=') ? DATABASE_URL
  : DATABASE_URL + (DATABASE_URL.includes('?') ? '&' : '?') + 'sslmode=require';

let ssl;
if (DATABASE_CA_CERT && DATABASE_CA_CERT.trim()) {
  ssl = { rejectUnauthorized: true, ca: toPem(DATABASE_CA_CERT) };
} else {
  // temporary fallback so the app can boot even before you paste the CA
  // (remove this once CA is set)
  ssl = { rejectUnauthorized: false };
}

export const pool = new Pool({ connectionString: urlWithSsl, ssl });

export async function query(sql, params = []) {
  const t0 = Date.now();
  const res = await pool.query(sql, params);
  const ms = Date.now() - t0;
  if (ms > 200) console.log(`[db] slow query ${ms}ms:`, sql);
  return res;
}
