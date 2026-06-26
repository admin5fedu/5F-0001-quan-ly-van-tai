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
  console.log("Fetching all employees from public.var_nhan_vien...");
  const { data, error } = await supabase
    .from('var_nhan_vien')
    .select('id, ho_va_ten, ten_dang_nhap, email, la_tai_xe')
    .order('id', { ascending: true });

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("DB_EMPLOYEES:", JSON.stringify(data, null, 2));
  }
}

run();
