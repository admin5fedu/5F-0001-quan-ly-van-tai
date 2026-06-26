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
  console.log("Fetching public.var_phan_quyen rows for id_chuc_vu: 3...");
  const { data, error } = await supabase
    .from('var_phan_quyen')
    .select('*')
    .eq('id_chuc_vu', 3);

  if (error) {
    console.error("Error fetching permissions:", error);
    return;
  }

  console.log("Raw permission rows:", JSON.stringify(data, null, 2));

  // Let's mimic phanQuyenRowsToGrants
  const grants = {};
  for (const row of (data || [])) {
    const mod = row.id_module || row.module_key;
    if (!mod) continue;
    if (!grants[mod]) grants[mod] = [];
    
    // Map db quyen to app action
    const dbQuyen = row.quyen;
    let action = dbQuyen;
    if (dbQuyen === 'xem') action = 'view';
    else if (dbQuyen === 'them') action = 'create';
    else if (dbQuyen === 'sua') action = 'update';
    else if (dbQuyen === 'xoa') action = 'delete';
    else if (dbQuyen === 'kiem_tra') action = 'check';
    else if (dbQuyen === 'quan_tri') action = 'admin';
    
    if (action && !grants[mod].includes(action)) {
      grants[mod].push(action);
    }
  }

  console.log("Grants by module map:", JSON.stringify(grants, null, 2));
}

run();
