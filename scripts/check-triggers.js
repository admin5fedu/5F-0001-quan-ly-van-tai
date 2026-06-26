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
    console.log("Checking pg_trigger for trg_sync_auth_user_to_employee...");
    console.log("Attempting to create update trigger...");
    try {
      await client.query(`
        DROP TRIGGER IF EXISTS trg_sync_auth_user_update_to_employee ON auth.users;
        CREATE TRIGGER trg_sync_auth_user_update_to_employee
        AFTER UPDATE OF email, raw_user_meta_data ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.fn_sync_auth_user_update_to_employee();
      `);
      console.log("Create update trigger command succeeded!");
    } catch (e) {
      console.error("Failed to create update trigger:", e);
    }

    console.log("Checking public.var_nhan_vien columns schema...");
    const resCols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'var_nhan_vien' AND table_schema = 'public';
    `);
    console.log("Columns:", resCols.rows);
  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await client.end();
  }
}

run();
