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

if (!url || !serviceKey) {
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const expectedTables = [
  'var_cong_ty',
  'var_phong_ban',
  'var_chuc_vu',
  'var_nhan_vien',
  'var_phan_quyen',
  'vt_tai_xe',
  'vt_xe',
  'vt_dia_diem',
  'vt_chuyen_xe',
  'vt_chuyen_xe_ct',
  'vt_luong',
];

const legacyTables = [
  'he_thong_phong_ban',
  'he_thong_chuc_vu',
  'he_thong_nhan_vien',
  'he_thong_chi_nhanh',
  'phan_quyen',
];

async function probeTable(table) {
  const { data, error } = await supabase.from(table).select('*').limit(1);
  if (error) return { table, ok: false, message: `${error.code}: ${error.message}` };
  const row = data?.[0] ?? null;
  return {
    table,
    ok: true,
    idType: row?.id == null ? 'empty' : typeof row.id,
    columns: Object.keys(row ?? {}),
  };
}

const expected = await Promise.all(expectedTables.map(probeTable));
const legacy = await Promise.all(legacyTables.map(probeTable));

let failed = false;

for (const result of expected) {
  if (!result.ok) {
    failed = true;
    console.log(`FAIL expected ${result.table}: ${result.message}`);
    continue;
  }
  if (result.idType === 'string') {
    failed = true;
    console.log(`FAIL expected ${result.table}: id is string; schema must use int8 identity`);
    continue;
  }
  console.log(`PASS expected ${result.table}`);
}

for (const result of legacy) {
  if (result.ok) {
    failed = true;
    console.log(`FAIL legacy ${result.table}: still exists`);
  } else {
    console.log(`PASS legacy ${result.table}: absent`);
  }
}

if (failed) process.exitCode = 1;
