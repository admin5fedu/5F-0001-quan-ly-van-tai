import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
});

const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SECRET_KEY;

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log("Fetching vantai info from var_nhan_vien...");
  const { data: nv, error: err } = await supabase
    .from('var_nhan_vien')
    .select(`
      id,
      ho_va_ten,
      ten_dang_nhap,
      id_chuc_vu,
      var_chuc_vu (
        id,
        ten_chuc_vu,
        ma_chuc_vu
      )
    `)
    .eq('ten_dang_nhap', 'vantai')
    .maybeSingle();

  if (err) {
    console.error("Error fetching employee:", err);
    return;
  }

  console.log("Employee Info:", JSON.stringify(nv, null, 2));

  if (nv && nv.id_chuc_vu) {
    console.log(`Fetching permissions for role id: ${nv.id_chuc_vu} (${nv.var_chuc_vu?.ten_chuc_vu})`);
    const { data: perms, error: permsErr } = await supabase
      .from('var_phan_quyen')
      .select('*')
      .eq('id_chuc_vu', nv.id_chuc_vu);

    if (permsErr) {
      console.error("Error fetching permissions:", permsErr);
      return;
    }

    console.log("Permissions for this role:", JSON.stringify(perms, null, 2));
  }
}

run();
