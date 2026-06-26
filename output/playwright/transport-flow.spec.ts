import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5174';
const testMarker = `E2E-CLEANUP-${Date.now()}`;

const routes = [
  ['/quan-ly-van-tai', /Kế hoạch/i],
  ['/quan-ly-van-tai/chuyen-xe?tab=danh-sach', /Chuyến xe/i],
  ['/quan-ly-van-tai/chuyen-xe?tab=danh-sach-ct', /Danh sách CT/i],
  ['/quan-ly-van-tai/bang-luong', /Bảng lương/i],
  ['/quan-ly-van-tai/thong-ke-chuyen-di', /Thống kê chuyến đi/i],
  ['/quan-ly-van-tai/thong-ke-luong', /Thống kê lương/i],
  ['/quan-ly-van-tai/dia-diem', /Địa điểm/i],
  ['/quan-ly-van-tai/danh-sach-xe', /Danh sách xe/i],
] as const;

function readLocalEnv(): Record<string, string> {
  if (!fs.existsSync('.env.local')) return {};
  return Object.fromEntries(
    fs
      .readFileSync('.env.local', 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((line) => !line.trim().startsWith('#'))
      .map((line) => {
        const idx = line.indexOf('=');
        return [line.slice(0, idx), line.slice(idx + 1).trim()];
      }),
  );
}

async function cleanupSupabaseRows(marker: string) {
  const env = readLocalEnv();
  const key = env.SUPABASE_SECRET_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!env.VITE_SUPABASE_URL || !key) return;
  const client = createClient(env.VITE_SUPABASE_URL, key);
  await client.auth.signInWithPassword({ email: 'admin@gmail.com', password: '5fedu.com' });
  await Promise.allSettled([
    client.from('vt_chuyen_xe_ct').delete().ilike('ghi_chu', `%${marker}%`),
    client.from('vt_luong').delete().ilike('ghi_chu_chi_phi', `%${marker}%`),
  ]);
  await Promise.allSettled([
    client.from('vt_chuyen_xe').delete().ilike('ghi_chu', `%${marker}%`),
    client.from('vt_tai_xe').delete().ilike('ghi_chu', `%${marker}%`),
    client.from('vt_dia_diem').delete().ilike('ghi_chu', `%${marker}%`),
  ]);
}

async function loginIfNeeded(page: Page) {
  const username = page.locator('input[name="username"]');
  const password = page.locator('input[name="password"]');
  if (!(await username.isVisible().catch(() => false))) return;
  await username.fill('admin');
  await password.fill('5fedu.com');
  await page.locator('form button[type="submit"]').click();
  await expect(username).toBeHidden({ timeout: 15_000 });
}

async function gotoAuthed(page: Page, path: string) {
  await page.goto(`${baseURL}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  await loginIfNeeded(page);
  await page.goto(`${baseURL}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
}

async function expectNoPageOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width + 2);
}

async function fillFirstTextarea(page: Page, value: string) {
  const textarea = page.locator('textarea').first();
  await expect(textarea).toBeVisible();
  await textarea.fill(value);
}

test.describe('Quản lý vận tải full smoke', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      const text = msg.text();
      if (
        msg.type() === 'error' &&
        !text.includes('Failed to load resource') &&
        !text.includes('same key')
      ) {
        throw new Error(`Console error: ${text}`);
      }
    });
    page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();
      const allowedMissingAsset = status === 404 && /favicon|manifest|\.map($|\?)/i.test(url);
      if (status >= 400 && !allowedMissingAsset) {
        let body = '';
        try {
          body = await response.text();
        } catch (e) {}
        throw new Error(`HTTP ${status}: ${url}\nResponse body: ${body}`);
      }
    });
    page.on('pageerror', (error) => {
      throw error;
    });
  });

  test.afterEach(async () => {
    await cleanupSupabaseRows(testMarker);
  });

  test('desktop routes and CRUD/report actions', async ({ page }) => {
    await cleanupSupabaseRows(testMarker);
    await page.setViewportSize({ width: 1280, height: 720 });

    for (const [path, heading] of routes) {
      await gotoAuthed(page, path);
      await expect(
        page.locator('h1, h2, h3, [aria-current="page"], [role="tab"], button, a').filter({ hasText: heading }).first()
      ).toBeVisible();
      await expectNoPageOverflow(page);
      await page.screenshot({
        path: `output/playwright/desktop-${path.replaceAll('/', '-').replaceAll('?', '-').replaceAll('=', '-') || 'home'}.png`,
        fullPage: true,
      });
    }

    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach');
    await page.getByRole('button', { name: /^Thêm$/i }).click();
    await expect(page.getByRole('dialog', { name: /Thêm Chuyến xe/i })).toBeVisible();
    await fillFirstTextarea(page, testMarker);
    await page.getByRole('dialog', { name: /Thêm Chuyến xe/i }).getByRole('button', { name: /^Thêm$/i }).click();
    await expect(page.getByText(/Đã thêm Chuyến xe/i)).toBeVisible();

    await page.locator('input[type="search"][placeholder="Tìm chuyến xe..."]:visible').fill(testMarker);
    await page.getByRole('cell', { name: testMarker }).first().click();
    const detailDialog = page.getByRole('dialog', { name: /Chuyến xe/i }).first();
    await expect(detailDialog).toBeVisible();
    await detailDialog.getByRole('button', { name: /^Sửa$/i }).click();
    await expect(page.getByRole('dialog', { name: /Sửa Chuyến xe/i })).toBeVisible();
    await fillFirstTextarea(page, `${testMarker} updated`);
    await page.getByRole('dialog', { name: /Sửa Chuyến xe/i }).getByRole('button', { name: /^Lưu$/i }).click();
    await expect(page.getByText(/Đã cập nhật Chuyến xe/i)).toBeVisible();

    await page.getByRole('dialog', { name: /Chuyến xe/i }).first().getByRole('button', { name: /^Xóa$/i }).click();
    const confirmDialog = page.locator('[role="dialog"], [role="alertdialog"]').filter({ hasText: /Xóa Chuyến xe/i }).first();
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole('button', { name: /^Xóa$/i }).click();
    await expect(page.getByText(/Đã xóa 1 dòng/i)).toBeVisible();

    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach-ct');
    await expect(page).toHaveURL(/tab=danh-sach-ct/);
    await expect(page.getByRole('columnheader', { name: /Địa điểm/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Trạng thái/i })).toBeVisible();
    await expectNoPageOverflow(page);

    await gotoAuthed(page, '/quan-ly-van-tai/thong-ke-chuyen-di');
    await expectNoPageOverflow(page);
    await page.getByRole('button', { name: /Xuất báo cáo/i }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Excel/i }).click();
    await downloadPromise;
  });

  test('mobile routes and card/detail actions', async ({ page }) => {
    await cleanupSupabaseRows(testMarker);
    await page.setViewportSize({ width: 390, height: 844 });

    for (const [path, heading] of routes) {
      await gotoAuthed(page, path);
      await expect(
        page.locator('h1, h2, h3, [aria-current="page"], [role="tab"], button, a').filter({ hasText: heading }).first()
      ).toBeVisible();
      await expectNoPageOverflow(page);
      await page.screenshot({
        path: `output/playwright/mobile-${path.replaceAll('/', '-').replaceAll('?', '-').replaceAll('=', '-') || 'home'}.png`,
        fullPage: true,
      });
    }
  });
});
