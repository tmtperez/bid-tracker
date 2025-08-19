// backend/db.js
import pkg from 'pg';
import { readFileSync } from 'node:fs';

const { Pool } = pkg;

const { DATABASE_URL, NODE_ENV, DO_CA_PEM, DO_PG_SSL } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

// Decide SSL mode:
// - If DO_PG_SSL === 'true'  -> force SSL (prod on DO)
// - Else if NODE_ENV === 'production' -> SSL
// - Else (local docker-compose) -> no SSL
const wantSSL = DO_PG_SSL === 'true' || NODE_ENV === 'production';

// Build SSL config:
// Prefer a proper CA (best). If not provided, fall back to no-verify (works, but less strict).
let ssl = false;
if (wantSSL) {
  if (DO_CA_PEM) {
    ssl = { ca: DO_CA_PEM };               // strict validation using supplied CA
  } else {
    ssl = { rejectUnauthorized: false };   // fallback: accept DO’s self-signed chain
  }
}

export const pool = new Pool({
  connectionString: DATABASE_URL, // e.g. postgres://db:pass@host:25060/db?sslmode=require
  ssl,
});

// Optional: log once so you can confirm what the API is doing
console.log(`[db] NODE_ENV=${NODE_ENV} wantSSL=${wantSSL} using ${DO_CA_PEM ? 'CA' : (ssl ? 'no-verify' : 'no-ssl')}`);

export async function query(sql, params = []) {
  const start = Date.now();
  const res = await pool.query(sql, params);
  const ms = Date.now() - start;
  if (ms > 200) console.log(`[db] slow query ${ms}ms:`, sql);
  return res;
}
