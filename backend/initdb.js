// backend/initdb.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function tableExists(name) {
  const { rows } = await query(
    `SELECT to_regclass($1)::text AS exists`,
    [`public.${name}`]
  );
  return rows[0]?.exists !== null;
}

export async function ensureSchema() {
  // If companies table exists, assume schema is present.
  const hasCompanies = await tableExists('companies');
  if (hasCompanies) return;

  const schemaPath = path.join(__dirname, 'schema.sql');
  const seedPath = path.join(__dirname, 'seed.sql');

  const schemaSql = await fs.readFile(schemaPath, 'utf8');
  // Run schema (contains CREATE TABLE IF NOT EXISTS, safe to re-run)
  await query(schemaSql);

  if (process.env.SEED === 'true') {
    const seedSql = await fs.readFile(seedPath, 'utf8');
    await query(seedSql);
  }
}
