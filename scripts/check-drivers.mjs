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
  const key = env.SUPABASE_SECRET_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('No Supabase credentials found');
    return;
  }
  const client = createClient(url, key);
  
  const tables = ['var_nhan_vien', 'vt_xe', 'vt_dia_diem', 'vt_chuyen_xe', 'vt_chuyen_xe_ct'];
  for (const t of tables) {
    const { data, error } = await client.from(t).select('*');
    if (error) {
      console.error(`Error fetching ${t}:`, error);
    } else {
      console.log(`Table ${t}: ${data.length} rows`);
      if (data.length > 0) {
        console.log('Sample:', data.slice(0, 2));
      }
    }
  }
}

run();
