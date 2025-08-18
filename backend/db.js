import fs from "fs";
import pg from "pg";
const { Pool } = pg;

const ca = fs.readFileSync(new URL("./do-ca.crt", import.meta.url), "utf8");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { ca }, // verifies using DO's CA
});
