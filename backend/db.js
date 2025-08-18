// backend/db.js
import pg from 'pg';

function toBool(v, def = false) {
  if (v == null) return def;
  return /^(1|true|yes|on)$/i.test(String(v).trim());
}

const {
  DATABASE_URL,
  PGHOST = 'db',
  PGPORT = '5432',
  PGDATABASE = 'bidtracker',
  PGUSER = 'do_admin',
  PGPASSWORD = 'supersecure',
  DB_SSL, // e.g. 'true', 'TRUE', '1', 'yes'
} = process.env;

const useSSL = toBool(DB_SSL, false);
// DO Managed PG: use SSL but skip verification (no CA bundle needed)
const ssl = useSSL ? { rejectUnauthorized: false } : false;

const useUrl =
  typeof DATABASE_URL === 'string' &&
  DATABASE_URL.trim() !== '' &&
  DATABASE_URL.includes('://');

const poolConfig = useUrl
  ? { connectionString: DATABASE_URL.trim(), ssl } // ssl overrides URL's sslmode behavior
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
