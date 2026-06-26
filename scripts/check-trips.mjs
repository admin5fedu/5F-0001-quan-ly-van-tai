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
  const { data: trips, error: err1 } = await supabase.from('vt_chuyen_xe').select('*');
  const { data: details, error: err2 } = await supabase.from('vt_chuyen_xe_ct').select('*');
  if (err1) console.error('Error vt_chuyen_xe:', err1);
  else console.log(`vt_chuyen_xe: ${trips.length} rows`, trips.map(t => ({ id: t.id, ngay: t.ngay, id_xe: t.id_xe, id_tai_xe: t.id_tai_xe })));
  if (err2) console.error('Error vt_chuyen_xe_ct:', err2);
  else console.log(`vt_chuyen_xe_ct: ${details.length} rows`, details.map(d => ({ id: d.id, id_chuyen_xe: d.id_chuyen_xe, id_dia_diem: d.id_dia_diem, tien_luong: d.tien_luong, chi_phi: d.chi_phi })));
}

checkData();
