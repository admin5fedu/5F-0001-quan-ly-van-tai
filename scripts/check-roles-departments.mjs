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

const supabase = createClient(url, serviceKey);

async function check() {
  const { data: depts } = await supabase.from('var_phong_ban').select('*');
  const { data: roles } = await supabase.from('var_chuc_vu').select('*');
  
  console.log('DEPARTMENTS:', JSON.stringify(depts, null, 2));
  console.log('POSITIONS:', JSON.stringify(roles, null, 2));
}

check();
