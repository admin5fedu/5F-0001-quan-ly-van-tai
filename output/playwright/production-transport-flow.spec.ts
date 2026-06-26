import { expect, test } from '@playwright/test';
import {
  TEST_MARKER,
  accountByKey,
  attachProductionGuards,
  cleanupE2EMarker,
  expectNoFatalPageError,
  expectNoPageOverflow,
  gotoAuthed,
} from './helpers/production-e2e';

const routes = [
  ['/quan-ly-van-tai/chuyen-xe?tab=danh-sach', /Chuyến xe/i],
  ['/quan-ly-van-tai/chuyen-xe?tab=danh-sach-ct', /Danh sách CT|Chuyến xe/i],
  ['/quan-ly-van-tai/bang-luong', /Bảng lương/i],
  ['/quan-ly-van-tai/thong-ke-chuyen-di', /Thống kê chuyến đi/i],
  ['/quan-ly-van-tai/thong-ke-luong', /Thống kê lương/i],
  ['/quan-ly-van-tai/dia-diem', /Địa điểm/i],
  ['/quan-ly-van-tai/danh-sach-xe', /Danh sách xe|Xe/i],
] as const;

test.describe('Production transport flow smoke', () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    attachProductionGuards(page);
    await cleanupE2EMarker(TEST_MARKER);
  });

  test.afterEach(async () => {
    await cleanupE2EMarker(TEST_MARKER);
  });

  test('desktop routes + chuyến xe CRUD marker', async ({ page }) => {
    const admin = accountByKey('admin');
    await page.setViewportSize({ width: 1280, height: 720 });

    for (const [path] of routes) {
      await gotoAuthed(page, path, admin);
      await expectNoFatalPageError(page);
      await expectNoPageOverflow(page);
    }

    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', admin);
    await page.getByRole('button', { name: /^Thêm$/i }).click();
    const form = page.getByRole('dialog', { name: /Thêm Chuyến xe/i });
    await expect(form).toBeVisible();
    const textarea = form.locator('textarea').first();
    await textarea.fill(TEST_MARKER);
    await form.getByRole('button', { name: /^Thêm$/i }).click();
    await expect(page.getByText(/Đã thêm Chuyến xe/i)).toBeVisible({ timeout: 25_000 });

    const search = page.locator('input[type="search"]:visible').first();
    await search.fill(TEST_MARKER);
    await page.getByRole('cell', { name: TEST_MARKER }).first().click();
    await page.getByRole('dialog', { name: /Chuyến xe/i }).first().getByRole('button', { name: /^Xóa$/i }).click();
    const confirm = page.locator('[role="dialog"], [role="alertdialog"]').filter({ hasText: /Xóa Chuyến xe/i }).first();
    await confirm.getByRole('button', { name: /^Xóa$/i }).click({ force: true });
    await expect(page.getByText(/Đã xóa/i)).toBeVisible({ timeout: 25_000 });
  });

  test('mobile routes render without overflow', async ({ page }) => {
    const admin = accountByKey('admin');
    await page.setViewportSize({ width: 390, height: 844 });
    for (const [path] of routes) {
      await gotoAuthed(page, path, admin);
      await expectNoFatalPageError(page);
      await expectNoPageOverflow(page);
    }
  });
});