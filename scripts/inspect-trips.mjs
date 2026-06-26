import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve('.env.local');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const matchUrl = line.match(/^\s*(VITE_SUPABASE_URL|SUPABASE_URL)\s*=\s*(.+?)\s*$/);
    const matchKey = line.match(/^\s*(SUPABASE_SECRET_KEY|VITE_SUPABASE_ANON_KEY)\s*=\s*(.+?)\s*$/);
    if (matchUrl) supabaseUrl = matchUrl[2].replace(/['"]/g, '');
    if (matchKey) supabaseKey = matchKey[2].replace(/['"]/g, '');
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Could not find Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('=== CHUYẾN XE (vt_chuyen_xe) ===');
  const { data: trips, error: tripsErr } = await supabase.from('vt_chuyen_xe').select('*').order('ngay', { ascending: false });
  if (tripsErr) console.error(tripsErr);
  else console.log(trips);

  console.log('\n=== CHI TIẾT CHUYẾN (vt_chuyen_xe_ct) ===');
  const { data: details, error: detailsErr } = await supabase.from('vt_chuyen_xe_ct').select('*').order('id', { ascending: true });
  if (detailsErr) console.error(detailsErr);
  else console.log(details);
}

run();
