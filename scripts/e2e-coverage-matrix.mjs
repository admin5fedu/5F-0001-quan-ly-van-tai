#!/usr/bin/env node
/**
 * In ma trận phủ E2E production — đối chiếu spec vs gap/debt.
 * Doc: .agents/5fedu/14-production-e2e-harness.md §12
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SPEC_DIR = path.join(ROOT, 'output/playwright');

/** @type {Array<{id:string, dim:string, area:string, spec:string, roles:string, status:'PASS'|'PARTIAL'|'GAP'|'BLOCKED', note:string}>} */
const ROWS = [
  { id: 'R-SMOKE', dim: 'D7,D8', area: 'Route smoke (20 routes)', spec: 'production-full-app-smoke', roles: 'admin', status: 'PASS', note: 'Desktop + mobile overflow' },
  { id: 'R-TRIP-R1R7', dim: 'D1,D5', area: 'TH vs duyệt, báo cáo CT, duyệt cha', spec: 'production-trip-execution', roles: 'driver,manager', status: 'PASS', note: 'Fixture trip 52; filter TH column/filter' },
  { id: 'R-ADMIN-LOCK', dim: 'D2,D4', area: 'Admin/quan_tri bypass khóa Đã duyệt', spec: 'production-admin-trip-lock-bypass', roles: 'admin,manager', status: 'PASS', note: 'isRowLockedForUser + approved trips 49-51' },
  { id: 'R-PERM-LIVE', dim: 'D2,D5', area: 'Grant/revoke ma trận → UI', spec: 'live-permission-verification', roles: 'admin,Tài xế', status: 'PASS', note: '1 module nhan-vien; revert in-spec' },
  { id: 'R-PERM-MATRIX', dim: 'D2', area: 'Route deny/allow 4 role', spec: 'production-permissions-matrix', roles: 'admin,director,manager,driver', status: 'PASS', note: 'DB rollup assert' },
  { id: 'R-MULTI-ROLE', dim: 'D2,D1', area: 'Cross-role transport', spec: 'production-multi-role', roles: '4 role', status: 'PASS', note: 'Bulk duyệt fixture trip 52' },
  { id: 'R-TRANSPORT-DEEP', dim: 'D3,D6', area: 'CRUD marker, export, payroll', spec: 'production-transport-deep', roles: 'admin,director,driver', status: 'PASS', note: 'Payroll 607 pending + matrix layout' },
  { id: 'R-BUSINESS', dim: 'D1,D3', area: 'Master detail lịch sử', spec: 'production-business-coverage', roles: 'admin,director,manager,driver', status: 'PASS', note: '' },
  { id: 'R-UNIT-SYNC', dim: 'D5,D8', area: 'Rollup/approval pure fn', spec: 'trip-*-sync.test.ts', roles: 'n/a', status: 'PASS', note: 'Local vitest step 3' },
  { id: 'R-DB-AUDIT', dim: 'D5,D8', area: 'Fixture trip52 + payroll607', spec: 'e2e-db-audit.mjs', roles: 'n/a', status: 'PASS', note: '13 gates; reconcile trước/sau' },
  { id: 'R-CRUD-MASTER', dim: 'D3', area: 'CRUD master NV/PB/CV/TX/DD/Xe', spec: 'production-master-crud', roles: 'admin', status: 'PASS', note: 'Marker E2E + cleanup auth' },
  { id: 'R-CHAIN-TH', dim: 'D1,D5', area: 'TH → duyệt → lương R6 end-to-end', spec: 'production-chain-th-payroll', roles: 'driver,director', status: 'PASS', note: 'Trip 52 + payroll 607; snapshot restore' },
  { id: 'R-STATS', dim: 'D1', area: 'Thống kê TH vs duyệt', spec: 'production-stats-th-duyet', roles: 'admin', status: 'PASS', note: 'Tỷ lệ TH + Tỷ lệ duyệt tách biệt' },
  { id: 'R-TRANSPORT-FLOW', dim: 'D7,D3', area: 'Transport flow production', spec: 'production-transport-flow', roles: 'admin', status: 'PASS', note: 'Desktop/mobile routes + CRUD marker' },
];

function countTestsInFile(filePath) {
  if (!fs.existsSync(filePath)) return { tests: 0, skipped: 0 };
  const text = fs.readFileSync(filePath, 'utf8');
  const tests = (text.match(/\btest\s*\(/g) ?? []).length;
  const skipped = (text.match(/test\.skip\s*\(/g) ?? []).length;
  return { tests, skipped };
}

function main() {
  const specFiles = fs.readdirSync(SPEC_DIR).filter((f) => f.endsWith('.spec.ts'));
  console.log('=== E2E COVERAGE MATRIX ===');
  console.log(`Specs in output/playwright: ${specFiles.length}`);
  console.log('');

  let totalSkip = 0;
  for (const f of specFiles.sort()) {
    const counts = countTestsInFile(path.join(SPEC_DIR, f));
    if (counts.tests > 0) {
      totalSkip += counts.skipped;
      console.log(`  ${f}: ${counts.tests} test()${counts.skipped ? `, ${counts.skipped} skip` : ''}`);
    }
  }
  console.log('');

  const byStatus = { PASS: 0, PARTIAL: 0, GAP: 0, BLOCKED: 0 };
  console.log('| ID | Dim | Area | Spec | Roles | Status | Note |');
  console.log('|----|-----|------|------|-------|--------|------|');
  for (const row of ROWS) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    console.log(`| ${row.id} | ${row.dim} | ${row.area} | ${row.spec} | ${row.roles} | ${row.status} | ${row.note} |`);
  }
  console.log('');
  console.log('SUMMARY:', Object.entries(byStatus).map(([k, v]) => `${k}=${v}`).join(', '));
  if (totalSkip > 0) {
    console.log(`WARN: ${totalSkip} test.skip() còn trong spec — chưa 100%`);
    process.exitCode = 1;
  }
  console.log('');
  console.log('L4 command: bash scripts/run-e2e-full-release.sh');
}

main();