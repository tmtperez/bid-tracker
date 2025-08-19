// backend/db.js
import pkg from 'pg';
const { Pool } = pkg;

const { DATABASE_URL, DATABASE_CA_CERT } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

const toPem = (s) => (s ? s.replace(/\\n/g, '\n') : undefined);
const urlWithSsl =
  DATABASE_URL.includes('sslmode=') ? DATABASE_URL
  : DATABASE_URL + (DATABASE_URL.includes('?') ? '&' : '?') + 'sslmode=require';

const caPem = toPem(DATABASE_CA_CERT || '');
const hasCA = !!caPem && !!caPem.trim();

let ssl = hasCA
  ? { rejectUnauthorized: true, ca: caPem }
  : { rejectUnauthorized: false }; // TEMP so app boots while debugging

// --- DEBUG SNAPSHOT (safe to log) ---
const SNAP = {
  hasUrl: !!DATABASE_URL,
  urlHasSslmode: urlWithSsl.includes('sslmode=require'),
  caLen: (DATABASE_CA_CERT || '').length,
  caFirstLine: caPem ? caPem.split('\n')[0] : null,
  caLastLine: caPem ? caPem.trim().split('\n').slice(-1)[0] : null,
  usingStrictTLS: !!hasCA,
};
console.log('DB_SNAPSHOT', SNAP);

console.log('[db] SSL config:', {
  rejectUnauthorized: ssl.rejectUnauthorized,
  caProvided: !!ssl.ca,
});

export const pool = new Pool({ connectionString: urlWithSsl, ssl });

// Catch async pool errors
pool.on('error', (err) => {
  console.error('[db] Pool error:', err.code, err.message);
  console.error(err.stack);
});

// Optional helper
export async function query(sql, params = []) {
  const t0 = Date.now();
  const res = await pool.query(sql, params);
  const ms = Date.now() - t0;
  if (ms > 200) console.log(`[db] slow query ${ms}ms:`, sql);
  return res;
}
