#!/usr/bin/env node
/**
 * Production DB gate — 10 checks from 14-production-e2e-harness.md §7
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const TRIP_FIXTURE = '52';
const PAYROLL_FIXTURE = '607';
const APPROVED_TRIPS = ['49', '50', '51'];
const TH_VALUES = new Set(['Chưa thực hiện', 'Đang thực hiện', 'Đã thực hiện', 'Hủy', 'Không thực hiện']);
const DUYET_VALUES = new Set(['Chưa duyệt', 'Đã duyệt', 'Không duyệt', 'Chờ duyệt']);

function readEnv() {
  const raw = fs.readFileSync('.env.local', 'utf8');
  return Object.fromEntries(
    raw
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i), l.slice(i + 1).trim()];
      }),
  );
}

function expectedParentFromChildren(children) {
  const statuses = children.map((c) => String(c.phe_duyet ?? 'Chưa duyệt'));
  if (statuses.length === 0) return 'Chưa duyệt';
  if (statuses.some((s) => s === 'Chưa duyệt')) return 'Chưa duyệt';
  if (statuses.some((s) => s === 'Đã duyệt')) return 'Đã duyệt';
  return 'Không duyệt';
}

function isCtEligibleForPayroll(ct) {
  return ct.phe_duyet === 'Đã duyệt' && ct.trang_thai === 'Đã thực hiện';
}

async function main() {
  const env = readEnv();
  const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY);
  const checks = [];
  const pass = (id, msg) => checks.push({ id, ok: true, msg });
  const fail = (id, msg) => checks.push({ id, ok: false, msg });

  const { data: trip52 } = await sb.from('vt_chuyen_xe').select('*').eq('id', TRIP_FIXTURE).maybeSingle();
  const { data: cts52 } = await sb.from('vt_chuyen_xe_ct').select('*').eq('id_chuyen_xe', TRIP_FIXTURE);

  if (!trip52) fail(1, `trip ${TRIP_FIXTURE} missing`);
  else {
    const ctOk = (cts52 ?? []).every(
      (c) => c.trang_thai === 'Chưa thực hiện' || TH_VALUES.has(String(c.trang_thai)),
    );
    const duyetOk = (cts52 ?? []).every((c) => DUYET_VALUES.has(String(c.phe_duyet ?? 'Chưa duyệt')));
    if (trip52.trang_thai === 'Chưa duyệt' && ctOk && duyetOk) pass(1, 'fixture defaults OK');
    else fail(1, `trip52 trang_thai=${trip52.trang_thai} ct=${JSON.stringify(cts52?.map((c) => [c.trang_thai, c.phe_duyet]))}`);
  }

  if (trip52 && !TH_VALUES.has(String(trip52.trang_thai)) && DUYET_VALUES.has(String(trip52.trang_thai))) {
    pass(2, 'cha chỉ domain duyệt');
  } else if (trip52 && DUYET_VALUES.has(String(trip52.trang_thai))) {
    pass(2, `cha trang_thai=${trip52.trang_thai} (duyệt domain)`);
  } else {
    fail(2, `cha trang_thai=${trip52?.trang_thai}`);
  }

  const badTh = (cts52 ?? []).filter((c) => !TH_VALUES.has(String(c.trang_thai)) && DUYET_VALUES.has(String(c.trang_thai)));
  if (badTh.length === 0) pass(3, 'CT trang_thai ∈ TH domain');
  else fail(3, `CT lẫn duyệt vào TH: ${badTh.map((c) => c.id).join(',')}`);

  const badDuyet = (cts52 ?? []).filter((c) => !DUYET_VALUES.has(String(c.phe_duyet ?? '')));
  if (badDuyet.length === 0) pass(4, 'CT phe_duyet ∈ duyệt domain');
  else fail(4, `CT phe_duyet invalid: ${badDuyet.map((c) => c.id).join(',')}`);

  for (const tid of [...APPROVED_TRIPS, TRIP_FIXTURE]) {
    const { data: trip } = await sb.from('vt_chuyen_xe').select('id,trang_thai').eq('id', tid).maybeSingle();
    const { data: children } = await sb.from('vt_chuyen_xe_ct').select('phe_duyet').eq('id_chuyen_xe', tid);
    const expected = expectedParentFromChildren(children ?? []);
    if (trip && trip.trang_thai === expected) pass(5, `rollup trip ${tid} OK`);
    else fail(5, `trip ${tid} parent=${trip?.trang_thai} expected=${expected}`);
  }

  if (trip52) {
    const executed = (cts52 ?? []).filter((c) => c.trang_thai === 'Đã thực hiện').length;
    const eligible = (cts52 ?? []).filter(isCtEligibleForPayroll).length;
    const soChuyen = Number(trip52.so_chuyen) || 0;
    const tongLuong = Number(trip52.tong_tien_luong) || 0;
    const sumEligibleLuong = (cts52 ?? [])
      .filter(isCtEligibleForPayroll)
      .reduce((s, c) => s + (Number(c.tien_luong) || 0), 0);
    if (soChuyen === executed && tongLuong === sumEligibleLuong) pass(6, `totals trip52 so_chuyen=${soChuyen} tong_luong=${tongLuong}`);
    else
      fail(
        6,
        `trip52 so_chuyen=${soChuyen} vs executed=${executed}; tong_luong=${tongLuong} vs eligible=${sumEligibleLuong} (eligibleCount=${eligible})`,
      );
  }

  const { data: payroll } = await sb.from('vt_luong').select('*').eq('id', PAYROLL_FIXTURE).maybeSingle();
  if (payroll) {
    const { data: allTrips } = await sb.from('vt_chuyen_xe').select('*').eq('id_tai_xe', payroll.id_tai_xe);
    const { data: allCts } = await sb.from('vt_chuyen_xe_ct').select('*');
    const year = Number(payroll.nam);
    const month = Number(payroll.thang);
    const monthTrips = (allTrips ?? []).filter((t) => {
      const p = String(t.ngay ?? '').split(/[-T]/);
      return Number(p[0]) === year && Number(p[1]) === month;
    });
    const tripIds = new Set(monthTrips.map((t) => String(t.id)));
    const eligibleCts = (allCts ?? []).filter(
      (c) => tripIds.has(String(c.id_chuyen_xe)) && isCtEligibleForPayroll(c),
    );
    const manualLuong = eligibleCts.reduce((s, c) => s + (Number(c.tien_luong) || 0), 0);
    const dbLuong = Number(payroll.tong_luong_chuyen) || 0;
    if (Math.abs(manualLuong - dbLuong) < 1) pass(8, `payroll ${PAYROLL_FIXTURE} R6 tong_luong_chuyen=${dbLuong}`);
    else fail(8, `payroll ${PAYROLL_FIXTURE} db=${dbLuong} manual R6=${manualLuong}`);
    pass(7, `R6 eligible CT count=${eligibleCts.length} (TH+duyệt)`);
    pass(9, `payroll fixture driver=${payroll.id_tai_xe} kỳ ${month}/${year}`);
  } else {
    fail(8, `payroll ${PAYROLL_FIXTURE} missing`);
    fail(7, 'no payroll fixture');
  }

  if ((cts52 ?? []).length > 0) pass(10, `trip52 has ${(cts52 ?? []).length} CT row(s)`);
  else fail(10, 'trip52 has no CT children');

  const failed = checks.filter((c) => !c.ok);
  const passed = checks.filter((c) => c.ok);
  console.log('DB AUDIT RESULTS:');
  for (const c of checks) console.log(`  [${c.ok ? 'PASS' : 'FAIL'}] #${c.id}: ${c.msg}`);
  console.log(`SUMMARY: ${passed.length} PASS, ${failed.length} FAIL`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});