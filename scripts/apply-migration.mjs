import pg from 'pg';
import fs from 'fs';
import path from 'path';

function loadEnv(envPath = '.env.local') {
  const content = fs.readFileSync(envPath, 'utf8');
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

const env = loadEnv();
const connectionString = env.DATABASE_URL;
if (!connectionString) {
  console.error("Error: DATABASE_URL not found in .env.local");
  process.exit(1);
}

const client = new pg.Client({ connectionString });

async function run() {
  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL database.");

    const migrationPath = path.join('supabase', 'migrations', '20260613_fix_payroll_trigger.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log("Applying migration 20260613_fix_payroll_trigger.sql...");
    await client.query(sql);
    console.log("Migration applied successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
