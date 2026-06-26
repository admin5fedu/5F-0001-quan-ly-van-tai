#!/usr/bin/env node
/**
 * Snapshot / restore production fixture trip 52 before & after E2E runs.
 * Usage: node scripts/e2e-prod-snapshot-restore.mjs snapshot|restore [file]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_FILE = path.join('output', 'playwright', '.e2e-baseline-trip52.json');
const TRIP_ID = '52';

function readLocalEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith('#'))
      .map((line) => {
        const idx = line.indexOf('=');
        return [line.slice(0, idx), line.slice(idx + 1).trim()];
      }),
  );
}

function getClient() {
  const env = readLocalEnv();
  const url = env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
    process.exit(1);
  }
  return createClient(url, key);
}

async function snapshot(file) {
  const sb = getClient();
  const [{ data: trip }, { data: details }] = await Promise.all([
    sb.from('vt_chuyen_xe').select('*').eq('id', TRIP_ID).maybeSingle(),
    sb.from('vt_chuyen_xe_ct').select('*').eq('id_chuyen_xe', TRIP_ID),
  ]);
  const payload = { trip: trip ?? null, details: details ?? [], savedAt: new Date().toISOString() };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  console.log(`snapshot: trip ${TRIP_ID} + ${payload.details.length} CT → ${file}`);
}

async function restore(file) {
  if (!fs.existsSync(file)) {
    console.warn(`restore: skip — missing ${file}`);
    return;
  }
  const { trip, details } = JSON.parse(fs.readFileSync(file, 'utf8'));
  const sb = getClient();
  if (trip) {
    const { id: _id, ...tripRest } = trip;
    await sb.from('vt_chuyen_xe').update(tripRest).eq('id', TRIP_ID);
  }
  for (const row of details ?? []) {
    if (row.id == null) continue;
    const { id: _rowId, ...rest } = row;
    await sb.from('vt_chuyen_xe_ct').update(rest).eq('id', row.id);
  }
  console.log(`restore: trip ${TRIP_ID} + ${(details ?? []).length} CT from ${file}`);
}

async function cleanupMarker(marker) {
  if (!marker) return;
  const sb = getClient();
  await Promise.allSettled([
    sb.from('vt_chuyen_xe_ct').delete().ilike('ghi_chu', `%${marker}%`),
    sb.from('vt_luong').delete().ilike('ghi_chu_chi_phi', `%${marker}%`),
    sb.from('vt_chuyen_xe').delete().ilike('ghi_chu', `%${marker}%`),
    sb.from('vt_dia_diem').delete().ilike('ghi_chu', `%${marker}%`),
  ]);
  console.log(`cleanup: E2E_MARKER rows containing ${marker}`);
}

const [cmd, arg] = process.argv.slice(2);
const file = arg && !arg.startsWith('E2E-') ? arg : DEFAULT_FILE;
const marker = process.env.E2E_MARKER;

try {
  if (cmd === 'snapshot') await snapshot(file);
  else if (cmd === 'restore') {
    await cleanupMarker(marker);
    await restore(file);
  } else {
    console.error('Usage: node scripts/e2e-prod-snapshot-restore.mjs snapshot|restore [file]');
    process.exit(1);
  }
} catch (err) {
  console.error(err);
  process.exit(1);
}