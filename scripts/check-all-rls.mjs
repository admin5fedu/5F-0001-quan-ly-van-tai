import fs from 'node:fs';
import pg from 'pg';

function loadEnv(path = '.env.local') {
  const content = fs.readFileSync(path, 'utf8');
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

async function checkAllRLS() {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    console.log("--- Row Level Security (RLS) Status ---");
    const statusRes = await client.query(`
      select tablename, rowsecurity 
      from pg_tables 
      where schemaname = 'public' 
        and (tablename like 'vt_%' or tablename like 'var_%');
    `);
    console.table(statusRes.rows);

    console.log("\n--- Active Policies ---");
    const policiesRes = await client.query(`
      select 
        tablename, 
        policyname, 
        roles, 
        cmd, 
        qual, 
        with_check 
      from pg_policies 
      where schemaname = 'public';
    `);
    console.log(JSON.stringify(policiesRes.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkAllRLS();
