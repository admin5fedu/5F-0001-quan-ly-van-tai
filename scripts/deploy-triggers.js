import pg from 'pg';
import fs from 'fs';

function loadEnv() {
  const content = fs.readFileSync('.env.local', 'utf8');
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

const env = loadEnv();
const { Client } = pg;
const client = new Client({
  connectionString: env.DATABASE_URL,
});

async function run() {
  await client.connect();
  try {
    console.log("Reading migration file 20260601_sync_auth_users_triggers.sql...");
    const sql = fs.readFileSync('supabase/migrations/20260601_sync_auth_users_triggers.sql', 'utf8');
    
    console.log("Executing migration on database...");
    await client.query(sql);
    console.log("Migration executed successfully!");
    
    // Now inspect pg_proc to verify the functions are updated
    console.log("\nVerifying pg_proc updated functions...");
    const resSrc = await client.query(`
      SELECT proname, prosrc 
      FROM pg_proc 
      WHERE proname LIKE 'fn_sync_auth%';
    `);
    resSrc.rows.forEach(row => {
      console.log(`\n--- ${row.proname} ---`);
      console.log(row.prosrc.substring(0, 200) + "...");
    });
  } catch (err) {
    console.error("Migration execution failed:", err);
  } finally {
    await client.end();
  }
}

run();
