import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

function loadEnvLocal() {
  const env = {};
  for (const file of ['.env.local', '.env']) {
    if (!fs.existsSync(file)) continue;
    fs.readFileSync(file, 'utf-8')
      .split('\n')
      .forEach((line) => {
        const parts = line.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
          if (key && !key.startsWith('#')) env[key] = val;
        }
      });
    break;
  }
  return env;
}

const env = loadEnvLocal();
const URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SECRET = env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY;

if (!URL || !SECRET) {
  console.error('Set SUPABASE_SECRET_KEY and VITE_SUPABASE_URL in .env.local');
  process.exit(1);
}

const db = createClient(URL, SECRET, { auth: { persistSession: false } });

const out = {};
async function dump(table, query) {
  const { data, error } = await query;
  if (error) { console.log(table, 'ERR', error.message); out[table] = { error: error.message }; }
  else { out[table] = data; console.log(`== ${table} (${data.length}) ==`); console.log(JSON.stringify(data, null, 1)); }
}

await dump('vt_chuyen_xe', db.from('vt_chuyen_xe').select('*').order('ngay'));
await dump('vt_chuyen_xe_ct', db.from('vt_chuyen_xe_ct').select('*'));
await dump('vt_luong', db.from('vt_luong').select('*'));
await dump('vt_dia_diem', db.from('vt_dia_diem').select('id, ten, nhom, tien_luong, chi_phi, trang_thai').order('nhom'));

fs.writeFileSync('snapshot.json', JSON.stringify(out, null, 1));
console.log('\nSAVED snapshot.json');
