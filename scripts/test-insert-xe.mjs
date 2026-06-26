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
const anonKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, anonKey, { auth: { persistSession: false } });

async function runTest() {
  console.log('Logging in as admin@gmail.com...');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@gmail.com',
    password: '5fedu.com',
  });

  if (authErr) {
    console.error('Login failed:', authErr);
    return;
  }

  console.log('Login successful! Token:', authData.session.access_token.substring(0, 20) + '...');

  console.log('Inserting a vehicle...');
  const { data, error } = await supabase
    .from('vt_xe')
    .insert({
      hang: 'Kia',
      model: 'K250',
      bien_so: `51C-${Math.floor(Math.random() * 90000) + 10000}`,
      trang_thai: 'Đang hoạt động'
    })
    .select()
    .single();

  if (error) {
    console.error('Insert failed:', error);
  } else {
    console.log('Insert successful! Data:', data);
    // Cleanup
    await supabase.from('vt_xe').delete().eq('id', data.id);
    console.log('Cleanup successful!');
  }
}

runTest();
