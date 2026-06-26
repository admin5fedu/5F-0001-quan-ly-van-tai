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

async function checkColumns() {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND (table_name LIKE 'vt_%' OR table_name LIKE 'var_%')
      ORDER BY table_name, column_name;
    `);
    const tables = {};
    for (const row of res.rows) {
      if (!tables[row.table_name]) tables[row.table_name] = [];
      tables[row.table_name].push({ column: row.column_name, type: row.data_type });
    }
    console.log(JSON.stringify(tables, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkColumns();
