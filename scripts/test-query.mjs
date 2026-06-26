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

async function checkTable() {
  console.log('--- Querying vt_chuyen_xe_ct structure ---');
  
  // Alternative: query 1 row to see keys
  const { data: singleRow, error: singleErr } = await supabase
    .from('vt_chuyen_xe_ct')
    .select('*')
    .limit(1);
    
  if (singleErr) {
    console.error('Error fetching single row:', singleErr);
  } else {
    console.log('Single row sample:', singleRow);
  }

  console.log('--- Fetching all rows from vt_chuyen_xe_ct ordered by tg_cap_nhat desc ---');
  const { data: rowsWithOrder, error: orderErr } = await supabase
    .from('vt_chuyen_xe_ct')
    .select('*')
    .order('tg_cap_nhat', { ascending: false });

  if (orderErr) {
    console.error('Error fetching with order:', orderErr);
  } else {
    console.log(`Fetched ${rowsWithOrder.length} rows with tg_cap_nhat order.`);
  }

  console.log('--- Fetching all rows from vt_chuyen_xe_ct without ordering ---');
  const { data: rowsNoOrder, error: noOrderErr } = await supabase
    .from('vt_chuyen_xe_ct')
    .select('*');

  if (noOrderErr) {
    console.error('Error fetching without order:', noOrderErr);
  } else {
    console.log(`Fetched ${rowsNoOrder.length} rows without order.`);
  }
}

checkTable();
