// backend/db.js
import pg from 'pg';

const {
  DATABASE_URL,
  PGHOST = 'db',
  PGPORT = '5432',
  PGDATABASE = 'bidtracker',
  PGUSER = 'do_admin',
  PGPASSWORD = 'supersecure',
  DB_SSL = 'false', // 'true' on DO Managed PG, 'false' for local/docker postgres
} = process.env;

const useSsl = DB_SSL === 'true';

const poolConfig = DATABASE_URL
  ? {
      connectionString: DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    }
  : {
      host: PGHOST,
      port: Number(PGPORT),
      database: PGDATABASE,
      user: PGUSER,
      password: PGPASSWORD,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    };

export const pool = new pg.Pool(poolConfig);
export const query = (text, params) => pool.query(text, params);
