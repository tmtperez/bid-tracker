// backend/db.js
import pkg from 'pg';
const { Pool } = pkg;

const { DATABASE_URL, DATABASE_CA_CERT } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

// normalize \n for local .env; on DO it will already be multiline
const toPem = (s) => (s ? s.replace(/\\n/g, '\n') : undefined);

const urlWithSsl =
  DATABASE_URL.includes('sslmode=') ? DATABASE_URL
  : DATABASE_URL + (DATABASE_URL.includes('?') ? '&' : '?') + 'sslmode=require';

// Extract hostname for SNI (Node uses this in TLS handshake)
const { hostname, port } = new URL(urlWithSsl.replace('postgres://', 'http://'));

const caPem = toPem(DATABASE_CA_CERT || '');
const hasCA = !!caPem && !!caPem.trim();

const ssl = hasCA
  ? {
      ca: [caPem],                // array form is friendlier for chains
      rejectUnauthorized: true,
      servername: hostname,       // SNI must match *.db.ondigitalocean.com
    }
  : { rejectUnauthorized: false }; // TEMP fallback while debugging

console.log('DB_SNAPSHOT', {
  hasUrl: true,
  urlHasSslmode: urlWithSsl.includes('sslmode=require'),
  host: hostname,
  port,
  caLen: (DATABASE_CA_CERT || '').length,
  caFirstLine: caPem ? caPem.split('\n')[0] : null,
  caLastLine: caPem ? caPem.trim().split('\n').slice(-1)[0] : null,
  usingStrictTLS: hasCA,
});

export const pool = new Pool({ connectionString: urlWithSsl, ssl });

export async function query(sql, params = []) {
  const t0 = Date.now();
  const res = await pool.query(sql, params);
  const ms = Date.now() - t0;
  if (ms > 200) console.log(`[db] slow query ${ms}ms:`, sql);
  return res;
}

// One-time probe so we can see the TLS verdict //
(async () => {
  try {
    const client = await pool.connect();
    await client.query('select 1');
    const s = client.connection?.stream;
    const peer = s?.getPeerCertificate?.(true);
    console.log('[db] test-connect OK;', {
      tls: !!s?.encrypted,
      authorized: s?.authorized,
      authorizationError: s?.authorizationError || null,
      servername: s?.servername || null,
      peerCN: peer?.subject?.CN,
      issuerCN: peer?.issuer?.CN,
    });
    client.release();
  } catch (e) {
    console.error('[db] test-connect FAIL:', e.code, e.message);
  }
})();
