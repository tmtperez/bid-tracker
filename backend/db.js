// backend/db.js
import pg from 'pg';

const {
  DATABASE_URL,
  PGHOST = 'db',
  PGPORT = '5432',
  PGDATABASE = 'bidtracker',
  PGUSER = 'do_admin',
  PGPASSWORD = 'supersecure',
  // 'disable' | 'no-verify' | 'require'
  DB_SSL_MODE = 'disable',
} = process.env;

function sslFromMode(mode) {
  switch ((mode || '').toLowerCase()) {
    case 'disable':
    case 'false':
    case 'off':
      return false;
    case 'require':
    case 'verify-full':
      return { rejectUnauthorized: true };
    case 'no-verify':
    case 'require-nv':
    case 'true':
      return { rejectUnauthorized: false };
    default:
      return false;
  }
}
const ssl = sslFromMode(DB_SSL_MODE);

// Use DATABASE_URL only if it looks real: non-empty and has "://"
const hasUrl =
  typeof DATABASE_URL === 'string' &&
  DATABASE_URL.trim() !== '' &&
  DATABASE_URL.includes('://');

const poolConfig = hasUrl
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
