// backend/db.js
import pg from 'pg';

const {
  DATABASE_URL,
  PGHOST = 'db',
  PGPORT = '5432',
  PGDATABASE = 'bidtracker',
  PGUSER = 'do_admin',
  PGPASSWORD = 'supersecure',
  // set to 'true' on DigitalOcean Managed PG
  DB_SSL = 'false',
} = process.env;

const ssl =
  DB_SSL === 'true'
    ? { rejectUnauthorized: false } // <- no-verify; avoids SELF_SIGNED_CERT_IN_CHAIN
    : false;

const useUrl =
  typeof DATABASE_URL === 'string' &&
  DATABASE_URL.trim() !== '' &&
  DATABASE_URL.includes('://');

export const pool = new pg.Pool(
  useUrl
    ? { connectionString: DATABASE_URL, ssl }
    : { host: PGHOST, port: Number(PGPORT), database: PGDATABASE, user: PGUSER, password: PGPASSWORD, ssl }
);

export const query = (text, params) => pool.query(text, params);
