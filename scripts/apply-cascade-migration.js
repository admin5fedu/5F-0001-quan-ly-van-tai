import pg from 'pg';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
});

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

    const mig1Path = path.join('supabase', 'migrations', '20260602_cascade_delete_employees.sql');
    const sql1 = fs.readFileSync(mig1Path, 'utf-8');
    console.log("Applying migration 20260602_cascade_delete_employees.sql...");
    await client.query(sql1);
    console.log("Migration 1 applied successfully!");

    const mig2Path = path.join('supabase', 'migrations', '20260602_fix_luong_trigger_on_delete.sql');
    const sql2 = fs.readFileSync(mig2Path, 'utf-8');
    console.log("Applying migration 20260602_fix_luong_trigger_on_delete.sql...");
    await client.query(sql2);
    console.log("Migration 2 applied successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
