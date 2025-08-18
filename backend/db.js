// backend/db.js
import pg from 'pg';

const {
  DATABASE_URL,
  PGHOST = 'db',
  PGPORT = '5432',
  PGDATABASE = 'bidtracker',
  PGUSER = 'do_admin',
  PGPASSWORD = 'supersecure',
  // New: flexible SSL mode. One of: 'disable' | 'require' | 'no-verify'
  DB_SSL_MODE = 'disable',
} = process.env;

// Map our mode to node-postgres options
function sslFromMode(mode) {
  switch ((mode || '').toLowerCase()) {
    case 'disable':
    case 'false':
    case 'off':
      return false;
    case 'require':
    case 'verify-full':
      // This enforces verification (you must also supply a CA via 'ssl.ca' to actually pass)
      return { rejectUnauthorized: true };
    case 'no-verify':
    case 'require-nv':
    case 'require-no-verify':
    case 'true': // treat true as no-verify for DO convenience
      return { rejectUnauthorized: false };
    default:
      return false;
  }
}

const ssl = sslFromMode(DB_SSL_MODE);

// Prefer DATABASE_URL when present (App Platform)
const poolConfig = DATABASE_URL
  ? { connectionString: DATABASE_URL, ssl }
  : {
      host: PGHOST,
      port: Number(PGPORT),
      database: PGDATABASE,
      user: PGUSER,
      password: PGPASSWORD,
      ssl,
    };

export const pool = new pg.Pool(poolConfig);
export const query = (text, params) => pool.query(text, params);
