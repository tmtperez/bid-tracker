// backend/db.js
import pkg from 'pg';
const { Pool } = pkg;

const { DATABASE_URL, DATABASE_CA_CERT } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

const toPem = (s) => (s ? s.replace(/\\n/g, '\n') : '');

// Ensure TLS in URL
const urlWithSsl =
  DATABASE_URL.includes('sslmode=') ? DATABASE_URL
  : DATABASE_URL + (DATABASE_URL.includes('?') ? '&' : '?') + 'sslmode=require';

// Parse bundle into one-or-many certs
const caPem = toPem(process.env.DATABASE_CA_CERT);
// split into all certs if it's a bundle
const caBlocks = (caPem.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) || [])
  .map(b => b.trim());

// SSL options
const { hostname } = new URL(urlWithSsl.replace('postgres://', 'http://'));

const ssl = caBlocks.length > 1
  ? { ca: caBlocks, rejectUnauthorized: true, servername: hostname }
  : { ca: caPem,    rejectUnauthorized: true, servername: hostname };

console.log('DB_SNAPSHOT', {
  urlHasSslmode: urlWithSsl.includes('sslmode=require'),
  host: hostname,
  caBlocks: caBlocks.length || (caPem ? 1 : 0),
});

export const pool = new Pool({ connectionString: urlWithSsl, ssl });

// ✅ Export named `query`
export async function query(sql, params = []) {
  const t0 = Date.now();
  const res = await pool.query(sql, params);
  const ms = Date.now() - t0;
  if (ms > 200) console.log(`[db] slow query ${ms}ms:`, sql);
  return res;
}

// one-time probe
(async () => {
  try {
    const client = await pool.connect();
    await client.query('select 1');
    const s = client.connection?.stream;
    console.log('[db] test-connect OK;', {
      tls: !!s?.encrypted,
      authorized: s?.authorized,
      authorizationError: s?.authorizationError || null,
    });
    client.release();
  } catch (e) {
    console.error('[db] test-connect FAIL:', e.code, e.message);
  }
})();
