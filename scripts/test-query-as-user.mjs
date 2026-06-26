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
  console.log('Logging in as vantai@gmail.com...');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'vantai@gmail.com',
    password: '5fedu.com',
  });

  if (authErr) {
    console.error('Login failed:', authErr);
    return;
  }

  console.log('Login successful! Token:', authData.session.access_token.substring(0, 20) + '...');

  // Set the authorization header or use the authenticated client
  const { data: rows, error: queryErr } = await supabase
    .from('vt_chuyen_xe_ct')
    .select('*')
    .order('tg_cap_nhat', { ascending: false });

  if (queryErr) {
    console.error('Query failed:', queryErr);
  } else {
    console.log(`Query successful! Fetched ${rows.length} rows as vantai.`);
    console.log('Rows:', rows);
  }
}

runTest();
