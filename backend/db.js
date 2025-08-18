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
  DB_SSL,            // e.g. 'true'
  DB_SSL_CA_PEM,     // optional (used in Option 2)
} = process.env;

// If a CA is provided we verify; otherwise if DB_SSL is true we go no-verify.
const ssl = DB_SSL_CA_PEM
  ? { ca: DB_SSL_CA_PEM, rejectUnauthorized: true }
  : toBool(DB_SSL, false)
    ? { rejectUnauthorized: false }
    : false;

const useUrl =
  typeof DATABASE_URL === 'string' &&
  DATABASE_URL.trim() !== '' &&
  DATABASE_URL.includes('://');

const poolConfig = useUrl
  ? { connectionString: DATABASE_URL.trim(), ssl }
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
