// db.js
import pkg from 'pg';
const { Pool } = pkg;

const { DATABASE_URL, DATABASE_CA_CERT } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

const toPem = (s) => (s ? s.replace(/\\n/g, '\n') : '');

// always require TLS in URL
const urlWithSsl =
  DATABASE_URL.includes('sslmode=') ? DATABASE_URL
  : DATABASE_URL + (DATABASE_URL.includes('?') ? '&' : '?') + 'sslmode=require';

const caPem = toPem(DATABASE_CA_CERT);

// Extract ALL cert blocks if it’s a bundle
const caBlocks = (caPem.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) || [])
  .map(b => b.trim());

// Build SSL opts (array if multiple, string if one)
const ssl = caBlocks.length > 1
  ? { ca: caBlocks, rejectUnauthorized: true }
  : { ca: caPem,    rejectUnauthorized: true };

// (Optional but harmless) set SNI host explicitly
const { hostname } = new URL(urlWithSsl.replace('postgres://', 'http://'));
ssl.servername = hostname;

console.log('DB_SNAPSHOT', {
  urlHasSslmode: urlWithSsl.includes('sslmode=require'),
  host: hostname,
  caBlocks: caBlocks.length,
  firstLine: caBlocks[0]?.split('\n')[0] || caPem.split('\n')[0],
  lastLine: (caBlocks[caBlocks.length-1] || caPem).trim().split('\n').slice(-1)[0],
});

export const pool = new Pool({ connectionString: urlWithSsl, ssl });

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
