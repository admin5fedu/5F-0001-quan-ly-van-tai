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

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function checkTripDetails() {
  const { data, error } = await supabase.from('vt_chuyen_xe_ct').select('*');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

checkTripDetails();
