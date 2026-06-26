import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

function readLocalEnv() {
  if (!fs.existsSync('.env.local')) return {};
  return Object.fromEntries(
    fs
      .readFileSync('.env.local', 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((line) => !line.trim().startsWith('#'))
      .map((line) => {
        const idx = line.indexOf('=');
        return [line.slice(0, idx), line.slice(idx + 1).trim()];
      }),
  );
}

async function run() {
  const env = readLocalEnv();
  const url = env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY;
  const client = createClient(url, key);

  const res = await client.from('var_phan_quyen').select('*');
  console.log(res);
}

run();
