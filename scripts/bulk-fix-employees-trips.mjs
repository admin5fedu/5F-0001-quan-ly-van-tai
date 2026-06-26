#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

function loadEnvLocal() {
  const env = {};
  for (const file of ['.env.local', '.env']) {
    if (!fs.existsSync(file)) continue;
    fs.readFileSync(file, 'utf-8')
      .split('\n')
      .forEach((line) => {
        const parts = line.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
          if (key && !key.startsWith('#')) env[key] = val;
        }
      });
    break;
  }
  return env;
}

const env = loadEnvLocal();
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key =
  env.SUPABASE_SECRET_KEY ||
  env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function run() {
  const { data: employees, error: empErr } = await db
    .from('var_nhan_vien')
    .select('id, ho_va_ten, trang_thai')
    .neq('trang_thai', 'Đang làm việc');
  if (empErr) throw empErr;

  if (employees?.length) {
    const { error } = await db
      .from('var_nhan_vien')
      .update({ trang_thai: 'Đang làm việc', tg_cap_nhat: new Date().toISOString() })
      .neq('trang_thai', 'Đang làm việc');
    if (error) throw error;
    console.log(`Updated ${employees.length} employees -> Đang làm việc`);
  } else {
    console.log('All employees already Đang làm việc');
  }

  for (const legacyStatus of ['Chưa thực hiện', 'Đã thực hiện']) {
    const { data: trips, error: tripErr } = await db
      .from('vt_chuyen_xe')
      .select('id, trang_thai')
      .eq('trang_thai', legacyStatus);
    if (tripErr) throw tripErr;
    if (trips?.length) {
      const { error } = await db
        .from('vt_chuyen_xe')
        .update({ trang_thai: 'Chưa duyệt', tg_cap_nhat: new Date().toISOString() })
        .eq('trang_thai', legacyStatus);
      if (error) throw error;
      console.log(`Migrated ${trips.length} trips ${legacyStatus} -> Chưa duyệt`);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
