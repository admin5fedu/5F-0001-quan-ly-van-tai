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

    const migrationPath = path.join('supabase', 'migrations', '20260601_sync_auth_users_triggers.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log("Applying migration 20260601_sync_auth_users_triggers.sql...");
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
