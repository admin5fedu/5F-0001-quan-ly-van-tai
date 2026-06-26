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

async function checkData() {
  const { data: locations, error: err1 } = await supabase.from('vt_dia_diem').select('*');
  const { data: vehicles, error: err2 } = await supabase.from('vt_xe').select('*');
  if (err1) console.error('Error vt_dia_diem:', err1);
  else console.log(`vt_dia_diem: ${locations.length} rows`, locations);
  if (err2) console.error('Error vt_xe:', err2);
  else console.log(`vt_xe: ${vehicles.length} rows`, vehicles);
}

checkData();
