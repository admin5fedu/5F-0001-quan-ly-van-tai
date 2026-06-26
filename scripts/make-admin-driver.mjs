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
  
  // Set la_tai_xe = true for Admin (ID: 1)
  const { data, error } = await client
    .from('var_nhan_vien')
    .update({ la_tai_xe: true })
    .eq('id', 1)
    .select();
    
  if (error) {
    console.error('Error updating employee:', error);
  } else {
    console.log('Successfully updated employee to be driver:', data);
  }
}

run();
