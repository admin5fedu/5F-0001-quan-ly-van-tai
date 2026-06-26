#!/usr/bin/env node
/** Align trip 52 parent totals with R6 app logic before snapshot/audit. */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const TRIP_ID = '52';

function readEnv() {
  return Object.fromEntries(
    fs
      .readFileSync('.env.local', 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i), l.slice(i + 1).trim()];
      }),
  );
}

function isEligible(ct) {
  return ct.phe_duyet === 'Đã duyệt' && ct.trang_thai === 'Đã thực hiện';
}

async function main() {
  const env = readEnv();
  const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: cts } = await sb.from('vt_chuyen_xe_ct').select('*').eq('id_chuyen_xe', TRIP_ID);
  const executed = (cts ?? []).filter((c) => c.trang_thai === 'Đã thực hiện').length;
  const eligible = (cts ?? []).filter(isEligible);
  const tongLuong = eligible.reduce((s, c) => s + (Number(c.tien_luong) || 0), 0);
  const tongPhi = eligible.reduce((s, c) => s + (Number(c.chi_phi) || 0), 0);
  await sb
    .from('vt_chuyen_xe')
    .update({ so_chuyen: executed, tong_tien_luong: tongLuong, tong_phi: tongPhi })
    .eq('id', TRIP_ID);
  console.log(`reconcile trip ${TRIP_ID}: so_chuyen=${executed} tong_luong=${tongLuong} tong_phi=${tongPhi}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});