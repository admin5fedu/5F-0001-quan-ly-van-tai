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

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);

async function run() {
  console.log("Restoring testsyncuser username...");
  const { error } = await supabase
    .from('var_nhan_vien')
    .update({ ten_dang_nhap: 'testsyncuser' })
    .eq('email', 'testsyncuser@gmail.com');

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Successfully updated testsyncuser in DB.");
  }
}

run();
