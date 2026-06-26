import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const BASE_URL = process.env.E2E_BASE_URL ?? 'https://tah-app.vercel.app';
export const TEST_MARKER = process.env.E2E_MARKER ?? `E2E-${Date.now()}`;
export const AUTH_DIR = path.join('output/playwright', '.auth');

type StorageStateOrigin = {
  origin: string;
  localStorage: Array<{ name: string; value: string }>;
};

type StorageStateFile = {
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Strict' | 'Lax' | 'None';
  }>;
  origins?: StorageStateOrigin[];
};

export type RoleAccount = {
  key: string;
  username: string;
  password: string;
  capBac: number;
  note: string;
};

/** Tài khoản production đã map từ var_nhan_vien + var_chuc_vu. */
export const ROLE_ACCOUNTS: RoleAccount[] = [
  { key: 'admin', username: 'admin', password: '5fedu.com', capBac: 1, note: 'Quản trị hệ thống' },
  { key: 'director', username: 'thuyan', password: '123456', capBac: 1, note: 'Giám đốc' },
  { key: 'manager', username: 'tahdieuphoi', password: '123456', capBac: 3, note: 'Cap 3 + kiem_tra — phạm vi cá nhân trừ khi DB gán cap_bac=2' },
  { key: 'driver', username: '0933650398', password: '123456', capBac: 4, note: 'Tài xế NV 115 — fixture trip 52' },
];

export const TRANSPORT_ROUTES = [
  '/quan-ly-van-tai/chuyen-xe?tab=danh-sach',
  '/quan-ly-van-tai/chuyen-xe?tab=danh-sach-ct',
  '/quan-ly-van-tai/bang-luong',
  '/quan-ly-van-tai/thong-ke-chuyen-di',
  '/quan-ly-van-tai/thong-ke-luong',
  '/quan-ly-van-tai/tai-xe',
  '/quan-ly-van-tai/dia-diem',
  '/quan-ly-van-tai/danh-sach-xe',
] as const;

export const SYSTEM_ROUTES = [
  '/he-thong/nhan-vien',
  '/he-thong/phong-ban',
  '/he-thong/chuc-vu',
  '/he-thong/thong-tin-cong-ty',
  '/he-thong/phan-quyen',
] as const;

/** Dữ liệu cố định trên production để assert nghiệp vụ (cập nhật khi seed đổi). */
export const FIXTURES = {
  payrollWithApprovedTrips: {
    id: '607',
    driverId: 115,
    driverLogin: '0933650398',
    /** CT đủ R6 (Đã duyệt + Đã thực hiện) — 0 cho đến khi tài xế báo cáo CT trên production. */
    payrollEligibleCtCount: 0,
  },
  approvedTripIds: ['49', '50', '51'],
  pendingDriverTrip: { id: '52', driverLogin: '0933650398', searchDate: '2026-06-12' },
};

/** Các token hiển thị trên grid chuyến xe cho fixture 52 (VN date, id, tài xế, ghi chú). */
export const FIXTURE_TRIP_SEARCH_TERMS = [
  FIXTURES.pendingDriverTrip.id,
  '12/06/2026',
  FIXTURES.pendingDriverTrip.searchDate,
  FIXTURES.pendingDriverTrip.driverLogin,
  'Nguyễn Hồng Tuấn',
  'Abcdef',
] as const;

function readLocalEnv(): Record<string, string> {
  if (!fs.existsSync('.env.local')) return {};
  return Object.fromEntries(
    fs
      .readFileSync('.env.local', 'utf8')
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith('#'))
      .map((line) => {
        const idx = line.indexOf('=');
        return [line.slice(0, idx), line.slice(idx + 1).trim()];
      }),
  );
}

let supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseAdmin) return supabaseAdmin;
  const env = readLocalEnv();
  const url = env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  supabaseAdmin = createClient(url, key);
  return supabaseAdmin;
}

function getYearMonth(value: unknown): { year: number; month: number } | null {
  const date = String(value ?? '');
  if (!date) return null;
  const parts = date.split(/[-T]/);
  if (parts.length < 2) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  return { year, month };
}

export async function countApprovedPayrollTrips(payrollId: string | number): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return -1;
  const { data: payroll } = await sb.from('vt_luong').select('*').eq('id', payrollId).maybeSingle();
  if (!payroll) return 0;
  const [{ data: trips }, { data: details }] = await Promise.all([
    sb.from('vt_chuyen_xe').select('*'),
    sb.from('vt_chuyen_xe_ct').select('*'),
  ]);
  const year = Number(payroll.nam);
  const month = Number(payroll.thang);
  const approvedTrips = (trips ?? []).filter((trip) => {
    const parsed = getYearMonth(trip.ngay);
    return (
      parsed &&
      parsed.year === year &&
      parsed.month === month &&
      String(trip.id_tai_xe) === String(payroll.id_tai_xe) &&
      trip.trang_thai === 'Đã duyệt'
    );
  });
  const tripIds = new Set(approvedTrips.map((t) => String(t.id)));
  return (details ?? []).filter(
    (d) =>
      tripIds.has(String(d.id_chuyen_xe)) &&
      d.phe_duyet === 'Đã duyệt' &&
      d.trang_thai === 'Đã thực hiện',
  ).length;
}

export type TripExecutionSnapshot = {
  trip: Record<string, unknown> | null;
  details: Record<string, unknown>[];
};

export async function snapshotPendingDriverTrip(): Promise<TripExecutionSnapshot | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const tripId = FIXTURES.pendingDriverTrip.id;
  const [{ data: trip }, { data: details }] = await Promise.all([
    sb.from('vt_chuyen_xe').select('*').eq('id', tripId).maybeSingle(),
    sb.from('vt_chuyen_xe_ct').select('*').eq('id_chuyen_xe', tripId),
  ]);
  return { trip: trip ?? null, details: details ?? [] };
}

export async function restorePendingDriverTrip(snapshot: TripExecutionSnapshot | null): Promise<void> {
  if (!snapshot) return;
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const tripId = FIXTURES.pendingDriverTrip.id;
  if (snapshot.trip) {
    const { id: _id, ...tripRest } = snapshot.trip;
    await sb.from('vt_chuyen_xe').update(tripRest).eq('id', tripId);
  }
  for (const row of snapshot.details) {
    const id = row.id;
    if (id == null) continue;
    const { id: _rowId, ...rest } = row;
    await sb.from('vt_chuyen_xe_ct').update(rest).eq('id', id);
  }
}

export async function cleanupE2EAuthUsers(loginPrefix: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const { data: list } = await sb.auth.admin.listUsers({ perPage: 1000 });
  const users = list?.users ?? [];
  for (const user of users) {
    const login = String(user.user_metadata?.ten_dang_nhap ?? user.email ?? '');
    if (login.startsWith(loginPrefix)) {
      await sb.auth.admin.deleteUser(user.id).catch(() => undefined);
    }
  }
}

export async function cleanupE2EMarker(marker: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const { data: markerEmployees } = await sb
    .from('var_nhan_vien')
    .select('id,ten_dang_nhap')
    .or(`ghi_chu.ilike.%${marker}%,thong_tin_khac.ilike.%${marker}%`);
  for (const emp of markerEmployees ?? []) {
    if (emp.ten_dang_nhap) {
      const { data: list } = await sb.auth.admin.listUsers({ perPage: 1000 });
      const authUser = (list?.users ?? []).find(
        (u) => String(u.user_metadata?.ten_dang_nhap ?? '') === String(emp.ten_dang_nhap),
      );
      if (authUser) await sb.auth.admin.deleteUser(authUser.id).catch(() => undefined);
    }
    await sb.from('var_nhan_vien').delete().eq('id', emp.id);
  }
  await Promise.allSettled([
    sb.from('vt_chuyen_xe_ct').delete().ilike('ghi_chu', `%${marker}%`),
    sb.from('vt_luong').delete().ilike('ghi_chu_chi_phi', `%${marker}%`),
    sb.from('vt_luong').delete().ilike('ghi_chu_khoan_tru', `%${marker}%`),
  ]);
  await Promise.allSettled([
    sb.from('vt_chuyen_xe').delete().ilike('ghi_chu', `%${marker}%`),
    sb.from('vt_dia_diem').delete().ilike('mo_ta', `%${marker}%`),
    sb.from('vt_dia_diem').delete().ilike('ghi_chu', `%${marker}%`),
    sb.from('vt_xe').delete().ilike('thong_tin_khac', `%${marker}%`),
    sb.from('var_phong_ban').delete().ilike('mo_ta', `%${marker}%`),
    sb.from('var_chuc_vu').delete().ilike('mo_ta', `%${marker}%`),
  ]);
}

export type PayrollFixtureSnapshot = Record<string, unknown> | null;

export async function snapshotPayrollFixture(): Promise<PayrollFixtureSnapshot> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data } = await sb
    .from('vt_luong')
    .select('*')
    .eq('id', FIXTURES.payrollWithApprovedTrips.id)
    .maybeSingle();
  return data ?? null;
}

export async function restorePayrollFixture(snapshot: PayrollFixtureSnapshot): Promise<void> {
  if (!snapshot) return;
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const { id: _id, ...rest } = snapshot;
  await sb.from('vt_luong').update(rest).eq('id', FIXTURES.payrollWithApprovedTrips.id);
}

export async function ensurePayrollFixturePending(): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb.from('vt_luong').update({ trang_thai: 'Chưa duyệt' }).eq('id', FIXTURES.payrollWithApprovedTrips.id);
}

export function attachProductionGuards(page: Page): void {
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (text.includes('Failed to load resource')) return;
    if (/Failed to load Roboto fonts/i.test(text)) return;
    if (/Auth sync (network\/execution error|status warning)/i.test(text)) return;
    throw new Error(`Console error: ${text}`);
  });
  page.on('response', (response) => {
    const url = response.url();
    const status = response.status();
    if (status === 0) return;
    const allowedMissingAsset = status === 404 && /favicon|manifest|\.map($|\?)/i.test(url);
    const allowedChucVuRefetch = status === 400 && /\/var_chuc_vu\b/i.test(url);
    if (status >= 400 && !allowedMissingAsset && !allowedChucVuRefetch) {
      throw new Error(`HTTP ${status}: ${url}`);
    }
  });
  page.on('pageerror', (error) => {
    throw error;
  });
}

async function safeGoto(page: Page, url: string): Promise<void> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  } catch (error) {
    const message = String(error);
    if (!message.includes('ERR_ABORTED') && !message.includes('NS_BINDING_ABORTED')) {
      throw error;
    }
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => undefined);
  }
}

export async function login(page: Page, username: string, password?: string): Promise<void> {
  const resolvedPassword = password ?? (username === 'admin' ? '5fedu.com' : '123456');

  for (let attempt = 0; attempt < 3; attempt++) {
    await safeGoto(page, `${BASE_URL}/dang-nhap`);
    await page.locator('input[name="username"]').fill(username);
    await page.locator('input[name="password"]').fill(resolvedPassword);
    await page.locator('form button[type="submit"]').click();

    const errorAlert = page.getByText(/Sai tên đăng nhập hoặc mật khẩu/i);
    if (await errorAlert.isVisible({ timeout: 2000 }).catch(() => false)) {
      if (username !== 'admin' && resolvedPassword !== '5fedu.com') {
        await page.locator('input[name="password"]').fill('5fedu.com');
        await page.locator('form button[type="submit"]').click();
      }
    }

    try {
      await expect(page).not.toHaveURL(/\/dang-nhap/, { timeout: 20_000 });
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
      return;
    } catch (error) {
      if (attempt === 2) throw error;
      await page.waitForTimeout(1500 * (attempt + 1));
    }
  }
}

export async function logout(page: Page): Promise<void> {
  if (page.url().includes('/dang-nhap')) return;

  const profileBtn = page.locator('button[aria-label="Menu người dùng"]');
  if (await profileBtn.isVisible().catch(() => false)) {
    await profileBtn.click();
    const menuLogout = page
      .getByRole('menuitem', { name: /^Đăng xuất$/i })
      .or(page.locator('button, a').filter({ hasText: /^Đăng xuất$/i }))
      .first();
    if (await menuLogout.isVisible({ timeout: 5000 }).catch(() => false)) {
      await menuLogout.click({ force: true });
      const confirmLogout = page.locator('button.bg-rose-600').filter({ hasText: /^Đăng xuất$/i }).first();
      if (await confirmLogout.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmLogout.click({ force: true });
      }
      try {
        await expect(page).toHaveURL(/\/dang-nhap/, { timeout: 15_000 });
        return;
      } catch {
        // fall through to hard reset
      }
    }
  }

  await page.context().clearCookies();
  await safeGoto(page, `${BASE_URL}/dang-nhap`);
}

export async function resetSession(page: Page): Promise<void> {
  await page.context().clearCookies();
  await safeGoto(page, `${BASE_URL}/dang-nhap`);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

function storageStatePath(accountKey: string): string {
  return path.join(AUTH_DIR, `${accountKey}.json`);
}

export async function applyRoleStorageState(page: Page, account: RoleAccount): Promise<boolean> {
  const statePath = storageStatePath(account.key);
  if (!fs.existsSync(statePath)) return false;

  const state = JSON.parse(fs.readFileSync(statePath, 'utf8')) as StorageStateFile;
  if (state.cookies?.length) {
    await page.context().addCookies(state.cookies);
  }

  if (state.origins?.length) {
    await page.addInitScript((origins: StorageStateOrigin[]) => {
      localStorage.clear();
      sessionStorage.clear();
      for (const origin of origins) {
        for (const entry of origin.localStorage ?? []) {
          localStorage.setItem(entry.name, entry.value);
        }
      }
    }, state.origins);
  }

  await safeGoto(page, BASE_URL);
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);

  return true;
}

export async function gotoRoute(page: Page, path: string): Promise<void> {
  const target = `${BASE_URL}${path}`;
  const pathPrefix = path.split('?')[0];

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    } catch (error) {
      const message = String(error);
      if (!message.includes('ERR_ABORTED') && !message.includes('NS_BINDING_ABORTED')) {
        throw error;
      }
    }

    if (page.url().includes(pathPrefix)) break;

    try {
      await page.waitForURL(`**${pathPrefix}**`, { timeout: 10_000 });
      break;
    } catch {
      if (attempt === 2) {
        throw new Error(`Failed to navigate to ${path} (last URL: ${page.url()})`);
      }
      await page.waitForTimeout(500);
    }
  }

  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
}

export async function gotoAuthed(page: Page, path: string, account: RoleAccount): Promise<void> {
  await page.context().clearCookies();

  const restored = await applyRoleStorageState(page, account);
  if (!restored) {
    await safeGoto(page, `${BASE_URL}/dang-nhap`);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await login(page, account.username, account.password);
  }

  await gotoRoute(page, path);

  if (page.url().includes('/dang-nhap')) {
    await login(page, account.username, account.password);
    await gotoRoute(page, path);
  }
}

export async function expectAccessDenied(page: Page): Promise<void> {
  await expect(page.getByText(/Truy cập bị từ chối/i)).toBeVisible({ timeout: 10_000 });
}

export async function expectNoFatalPageError(page: Page): Promise<void> {
  await expect(page.locator('body')).not.toContainText(/Cannot GET|Application error|Something went wrong/i);
}

export async function closeTopDialog(page: Page): Promise<void> {
  const dialog = page.locator('[role="dialog"]').first();
  if (!(await dialog.isVisible().catch(() => false))) return;
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden({ timeout: 8000 }).catch(() => undefined);
}

export async function closeConfirmDialog(page: Page): Promise<void> {
  const dialog = page.locator('[role="alertdialog"]').first();
  if (!(await dialog.isVisible().catch(() => false))) return;
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.keyboard.press('Escape');
    if (!(await dialog.isVisible().catch(() => false))) return;
    await page.waitForTimeout(200);
  }
}

export async function clickModuleTab(page: Page, label: RegExp | string): Promise<void> {
  await page.getByRole('button', { name: label }).click();
}

export async function openFirstTableRowDetail(page: Page): Promise<void> {
  const row = page.locator('tbody tr').first();
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.click();
  await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 10_000 });
}

export async function selectTableRowCheckbox(row: ReturnType<Page['locator']>): Promise<void> {
  const desktopCheckbox = row.locator('input[type="checkbox"]').first();
  if ((await desktopCheckbox.count()) > 0) {
    if (!(await desktopCheckbox.isChecked().catch(() => false))) {
      await desktopCheckbox.click({ force: true });
    }
    return;
  }
  const mobileCheckbox = row.getByRole('checkbox', { name: 'Chọn dòng' });
  await expect(mobileCheckbox).toBeVisible({ timeout: 10_000 });
  if (!(await mobileCheckbox.isChecked().catch(() => false))) {
    await mobileCheckbox.click({ force: true });
  }
}

export async function selectFirstTableRow(page: Page): Promise<void> {
  const row = page.locator('tbody tr').first();
  await expect(row).toBeVisible({ timeout: 15_000 });
  await selectTableRowCheckbox(row);
}

export async function clearAllRowSelections(page: Page): Promise<void> {
  const headerCheckbox = page.locator('thead input[type="checkbox"]').first();
  if (await headerCheckbox.isVisible().catch(() => false)) {
    const isChecked = await headerCheckbox.isChecked().catch(() => false);
    const isMixed = await headerCheckbox
      .evaluate((el: HTMLInputElement) => el.indeterminate)
      .catch(() => false);
    if (isChecked || isMixed) {
      await headerCheckbox.click({ force: true });
      await page.waitForTimeout(200);
    }
  }
  for (let attempt = 0; attempt < 30; attempt++) {
    const checked = page.locator('tbody input[type="checkbox"]:checked').first();
    if (!(await checked.isVisible().catch(() => false))) break;
    await checked.click({ force: true });
    await page.waitForTimeout(100);
  }
}

async function bulkApproveToolbarButton(page: Page) {
  return page.getByRole('button', { name: /^Quản lý duyệt$/i }).first();
}

/** Bulk edit toolbar — accessible name là aria-label "Chỉnh sửa dòng", không phải text "Sửa 1 dòng". */
export function bulkEditToolbarButton(page: Page) {
  return page.getByRole('button', { name: /Chỉnh sửa dòng|Sửa 1 dòng/i }).first();
}

/** Chọn dòng đầu tiên khiến bulk Quản lý duyệt hiện. Trả về false nếu không có. */
export async function selectFixtureTripRow(page: Page): Promise<ReturnType<Page['locator']>> {
  await closeTopDialog(page);
  await clearAllRowSelections(page);
  await page.getByText(/Đang tải/i).first().waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => undefined);
  await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 30_000 });
  const search = page.locator('input[type="search"]:visible').first();

  for (const term of FIXTURE_TRIP_SEARCH_TERMS) {
    if (await search.isVisible().catch(() => false)) {
      await search.fill(term);
      await page.waitForTimeout(500);
    }
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const row = page.locator('tbody tr').filter({ hasText: new RegExp(escaped, 'i') }).first();
    if (await row.isVisible({ timeout: 4000 }).catch(() => false)) {
      return row;
    }
  }

  const fallback = page.locator('tbody tr').filter({ hasText: /Chưa duyệt/i }).first();
  await expect(fallback, `Fixture trip ${FIXTURES.pendingDriverTrip.id} not found in grid`).toBeVisible({
    timeout: 20_000,
  });
  return fallback;
}

export async function selectFixtureTripCheckbox(page: Page): Promise<void> {
  const row = await selectFixtureTripRow(page);
  await selectTableRowCheckbox(row);
}

export async function openBulkApproveForFixtureTrip(page: Page): Promise<void> {
  await selectFixtureTripCheckbox(page);
  const btn = page.getByRole('button', { name: /^Quản lý duyệt$/i }).first();
  await expect(btn).toBeVisible({ timeout: 15_000 });
  await btn.click();
  await expectTripParentApprovalDialog(page);
}

export async function confirmApprovalDialog(
  page: Page,
  decision: 'Duyệt' | 'Không duyệt' = 'Duyệt',
): Promise<void> {
  const dialog = page.locator('[role="alertdialog"]').first();
  await expect(dialog).toBeVisible({ timeout: 15_000 });

  const decisionCard = dialog.getByRole('button', { name: new RegExp(`^${decision}$`, 'i') });
  if (await decisionCard.isVisible().catch(() => false)) {
    await decisionCard.click();
  }

  const confirmLabels = ['Cập nhật duyệt', 'Xác nhận'] as const;
  let confirmed = false;
  for (const label of confirmLabels) {
    const confirmBtn = dialog.getByRole('button', { name: new RegExp(`^${label}$`, 'i') });
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
      confirmed = true;
      break;
    }
  }
  expect(confirmed, 'Approval dialog footer confirm button not found').toBe(true);
  await expect(dialog).toBeHidden({ timeout: 25_000 });
}

export async function submitDriverCtReport(page: Page): Promise<void> {
  const reportDialog = page.locator('[role="alertdialog"]').filter({ hasText: /TRẠNG THÁI THỰC HIỆN/i });
  await expect(reportDialog).toBeVisible({ timeout: 15_000 });
  await reportDialog.getByRole('button', { name: /^Lưu báo cáo$/i }).click();
  await expect(reportDialog).toBeHidden({ timeout: 25_000 });
}

export async function openDriverCtReportForFixtureTrip(page: Page): Promise<void> {
  const row = await selectFixtureTripRow(page);
  await selectTableRowCheckbox(row);
  const reportTripBtn = page.getByRole('button', { name: /^Báo cáo CT$/i }).first();
  await expect(reportTripBtn).toBeVisible({ timeout: 10_000 });
  await reportTripBtn.click();
  const pickCtDialog = page.locator('[role="alertdialog"]').filter({ hasText: /Chọn chi tiết chuyến/i });
  if (await pickCtDialog.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await pickCtDialog.getByRole('button', { name: /^Tiếp tục$/i }).click();
  }
}

export async function selectFirstApprovableRow(page: Page): Promise<boolean> {
  const rows = page.locator('tbody tr');
  const count = await rows.count();

  for (let i = 0; i < Math.min(count, 25); i++) {
    const row = rows.nth(i);
    const rowCheckbox = row.locator('input[type="checkbox"]').first();
    if ((await rowCheckbox.count()) === 0) continue;
    await selectTableRowCheckbox(row);
    const bulkBtn = await bulkApproveToolbarButton(page);
    if (await bulkBtn.isVisible().catch(() => false)) return true;
    if (await rowCheckbox.isChecked().catch(() => false)) {
      await rowCheckbox.click({ force: true });
      await page.waitForTimeout(150);
    }
  }

  try {
    await selectFixtureTripCheckbox(page);
    const bulkBtn = await bulkApproveToolbarButton(page);
    await expect(bulkBtn).toBeVisible({ timeout: 5000 });
    return true;
  } catch {
    // fall through
  }

  const pendingRow = page.locator('tbody tr').filter({ hasText: /Chưa duyệt/i }).first();
  if (await pendingRow.isVisible().catch(() => false)) {
    await clearAllRowSelections(page);
    await selectTableRowCheckbox(pendingRow);
    const bulkBtn = await bulkApproveToolbarButton(page);
    try {
      await expect(bulkBtn).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

/** Quản lý duyệt bulk chỉ hiện sau khi chọn ít nhất 1 dòng duyệt được trong phạm vi role. */
export async function clickBulkApproveToolbar(page: Page): Promise<boolean> {
  await closeTopDialog(page);
  await clearAllRowSelections(page);
  const found = await selectFirstApprovableRow(page);
  if (!found) return false;
  const btn = await bulkApproveToolbarButton(page);
  if (!(await btn.isVisible({ timeout: 10_000 }).catch(() => false))) return false;
  await btn.click();
  await expect(page.locator('[role="alertdialog"]').first()).toBeVisible({ timeout: 15_000 });
  return true;
}

export async function openDetailDrawer(page: Page): Promise<ReturnType<Page['locator']>> {
  return page.locator('[role="dialog"]').first();
}

export async function clickDetailToolbarAction(page: Page, label: RegExp): Promise<void> {
  const detail = await openDetailDrawer(page);
  const link = detail.getByRole('link', { name: label }).first();
  if (await link.isVisible().catch(() => false)) {
    await link.click();
    return;
  }
  const button = detail.getByRole('button', { name: label }).first();
  await expect(button).toBeVisible({ timeout: 10_000 });
  await button.click();
}

/** Modal duyệt bảng lương / CT đơn — thẻ Duyệt / Không duyệt. */
export async function expectApprovalCards(page: Page): Promise<void> {
  const dialog = page.locator('[role="alertdialog"]').first();
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await expect(dialog.getByRole('button', { name: /^Duyệt$/i })).toBeVisible();
  await expect(dialog.getByRole('button', { name: /^Không duyệt$/i })).toBeVisible();
}

/** Modal duyệt chuyến xe (bulk/detail) — cascade từ chuyến cha. */
export async function expectTripParentApprovalDialog(page: Page): Promise<void> {
  const dialog = page.locator('[role="alertdialog"]').first();
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await expect(dialog.getByText(/Quản lý duyệt chuyến/i)).toBeVisible({ timeout: 15_000 });
  await expectApprovalCards(page);
}

export async function openPayrollFixtureDetail(page: Page): Promise<ReturnType<Page['locator']>> {
  const { id, driverLogin } = FIXTURES.payrollWithApprovedTrips;
  const search = page.locator('input[type="search"]:visible').first();
  if (await search.isVisible().catch(() => false)) {
    await search.fill(driverLogin);
  }
  const targetRow = page
    .locator('tbody tr')
    .filter({ hasText: /6\/2026|06\/2026|2026/ })
    .first();
  await expect(targetRow).toBeVisible({ timeout: 15_000 });
  await targetRow.click();
  const detail = page.locator('[role="dialog"]').first();
  await expect(detail).toBeVisible({ timeout: 10_000 });
  return detail;
}

export async function expectNoPageOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width + 2);
}

export function accountByKey(key: string): RoleAccount {
  const found = ROLE_ACCOUNTS.find((a) => a.key === key);
  if (!found) throw new Error(`Unknown role key: ${key}`);
  return found;
}

export async function fetchEmployeeByLogin(login: string): Promise<{
  id: number;
  id_chuc_vu: number | null;
  id_phong_ban: number | null;
  cap_bac: number | null;
} | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data: emp } = await sb.from('var_nhan_vien').select('id,id_chuc_vu,id_phong_ban').eq('ten_dang_nhap', login).maybeSingle();
  if (!emp) return null;
  let cap_bac: number | null = null;
  if (emp.id_chuc_vu != null) {
    const { data: cv } = await sb.from('var_chuc_vu').select('cap_bac').eq('id', emp.id_chuc_vu).maybeSingle();
    cap_bac = cv?.cap_bac != null ? Number(cv.cap_bac) : null;
  }
  return {
    id: Number(emp.id),
    id_chuc_vu: emp.id_chuc_vu != null ? Number(emp.id_chuc_vu) : null,
    id_phong_ban: emp.id_phong_ban != null ? Number(emp.id_phong_ban) : null,
    cap_bac,
  };
}

export async function fetchPositionGrants(chucVuId: number, moduleId: string): Promise<string[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data } = await sb
    .from('var_phan_quyen')
    .select('quyen')
    .eq('id_chuc_vu', chucVuId)
    .eq('id_module', moduleId);
  return (data ?? []).map((row) => String(row.quyen));
}

export async function fetchTripParentStatus(tripId: string | number): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data } = await sb.from('vt_chuyen_xe').select('trang_thai').eq('id', tripId).maybeSingle();
  return data?.trang_thai != null ? String(data.trang_thai) : null;
}

export async function fetchTripChildApprovals(tripId: string | number): Promise<string[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data } = await sb.from('vt_chuyen_xe_ct').select('phe_duyet').eq('id_chuyen_xe', tripId);
  return (data ?? []).map((row) => String(row.phe_duyet ?? 'Chưa duyệt'));
}

/** Rollup cha từ CT — khớp deriveParentTripStatus trên app. */
export function expectedParentStatusFromChildren(childStatuses: string[]): string {
  if (childStatuses.length === 0) return 'Chưa duyệt';
  if (childStatuses.some((s) => s === 'Chưa duyệt')) return 'Chưa duyệt';
  if (childStatuses.some((s) => s === 'Đã duyệt')) return 'Đã duyệt';
  return 'Không duyệt';
}

/** Sửa rollup cha trên DB production khi dữ liệu cũ lệch CT (one-shot reconcile). */
export async function repairParentTripStatusInDatabase(tripId: string | number): Promise<boolean> {
  const sb = getSupabaseAdmin();
  if (!sb) return false;
  const children = await fetchTripChildApprovals(tripId);
  const expected = expectedParentStatusFromChildren(children);
  const parent = await fetchTripParentStatus(tripId);
  if (parent === expected) return false;
  const { error } = await sb.from('vt_chuyen_xe').update({ trang_thai: expected }).eq('id', tripId);
  if (error) throw error;
  return true;
}

export async function repairFixtureTripRollups(): Promise<void> {
  const tripIds = [...FIXTURES.approvedTripIds, FIXTURES.pendingDriverTrip.id];
  for (const tripId of tripIds) {
    await repairParentTripStatusInDatabase(tripId);
  }
}

export async function assertTripParentMatchesChildren(tripId: string | number): Promise<void> {
  const children = await fetchTripChildApprovals(tripId);
  const parent = await fetchTripParentStatus(tripId);
  const expected = expectedParentStatusFromChildren(children);
  expect(parent, `trip ${tripId} parent=${parent} children=${children.join(',')}`).toBe(expected);
}

export async function countPayrollRowsForDriver(driverId: number, year: number, month: number): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return -1;
  const { count } = await sb
    .from('vt_luong')
    .select('id', { count: 'exact', head: true })
    .eq('id_tai_xe', driverId)
    .eq('nam', year)
    .eq('thang', month);
  return count ?? 0;
}