import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

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
const url = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SECRET_KEY;

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function checkLookups() {
  const tables = ['vt_tai_xe', 'vt_xe', 'vt_dia_diem', 'var_nhan_vien'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) console.error(`Error fetching ${table}:`, error);
    else console.log(`${table}: ${data.length} rows`, data.map(r => ({ id: r.id, label: r.ho_ten || r.ten || r.bien_so || r.ho_va_ten })));
  }
}

checkLookups();
