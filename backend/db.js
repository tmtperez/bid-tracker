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

// --- DEBUG SNAPSHOT (safe to log) ---
const SNAP = {
  hasUrl: !!process.env.DATABASE_URL,
  urlHasSslmode: (process.env.DATABASE_URL || '').includes('sslmode='),
  caLen: (process.env.DATABASE_CA_CERT || '').length,
  caStartsWith: (process.env.DATABASE_CA_CERT || '').slice(0, 30),
  caEndsWith: (process.env.DATABASE_CA_CERT || '').slice(-30),
  // after normalization
};
console.log('DB_SNAPSHOT {', 
  `hasUrl: ${SNAP.hasUrl},`,
  `urlHasSslmode: ${SNAP.urlHasSslmode},`,
  `caLen: ${SNAP.caLen},`,
  `caStartsWith: ${JSON.stringify(SNAP.caStartsWith)},`,
  `caEndsWith: ${JSON.stringify(SNAP.caEndsWith)}`,
'}');

export const pool = new Pool({ connectionString: urlWithSsl, ssl });

export async function query(sql, params = []) {
  const t0 = Date.now();
  const res = await pool.query(sql, params);
  const ms = Date.now() - t0;
  if (ms > 200) console.log(`[db] slow query ${ms}ms:`, sql);
  return res;
}
