import { expect, test } from '@playwright/test';
import {
  accountByKey,
  attachProductionGuards,
  bulkEditToolbarButton,
  clearAllRowSelections,
  gotoAuthed,
  closeTopDialog,
  selectTableRowCheckbox,
} from './helpers/production-e2e';

const LOCKED_TOAST = /Chỉ chỉnh sửa khi chuyến còn Chưa duyệt|Không thể báo cáo dòng này/i;

async function selectFirstApprovedTrip(page: import('@playwright/test').Page) {
  await clearAllRowSelections(page);
  await page.getByText(/Đang tải/i).first().waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => undefined);
  const search = page.locator('input[type="search"]:visible').first();
  for (const tripId of ['49', '50', '51']) {
    if (await search.isVisible().catch(() => false)) {
      await search.fill(tripId);
      await page.waitForTimeout(500);
    }
    const row = page.locator('tbody tr').filter({ hasText: tripId }).filter({ hasText: /Đã duyệt/i }).first();
    if (await row.isVisible({ timeout: 5000 }).catch(() => false)) {
      await selectTableRowCheckbox(row);
      await expect(bulkEditToolbarButton(page)).toBeVisible({ timeout: 15_000 });
      return row;
    }
  }
  const row = page.locator('tbody tr').filter({ hasText: /Đã duyệt/i }).first();
  await expect(row, 'Cần ít nhất 1 chuyến Đã duyệt trên production').toBeVisible({ timeout: 20_000 });
  await selectTableRowCheckbox(row);
  await expect(bulkEditToolbarButton(page)).toBeVisible({ timeout: 15_000 });
  return row;
}

test.describe('Production admin quan_tri bypass trip lock', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    attachProductionGuards(page);
  });

  test('admin: sửa chuyến Đã duyệt từ toolbar — mở form, không toast khóa', async ({ page }) => {
    const admin = accountByKey('admin');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', admin);
    await selectFirstApprovedTrip(page);

    await bulkEditToolbarButton(page).click();
    await expect(page.getByText(LOCKED_TOAST)).toHaveCount(0);
    await expect(page.locator('#chuyen-xe-ngay, input[type="date"]').first()).toBeVisible({ timeout: 10_000 });
    await closeTopDialog(page);
  });

  test('admin: xóa chuyến Đã duyệt — mở confirm (hủy, không xóa thật)', async ({ page }) => {
    const admin = accountByKey('admin');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', admin);
    await selectFirstApprovedTrip(page);

    await page.getByRole('button', { name: /^Xóa$/i }).first().click();
    await expect(page.getByText(LOCKED_TOAST)).toHaveCount(0);
    const confirm = page.locator('[role="alertdialog"]').filter({ hasText: /Bạn chắc chắn muốn xóa/i }).first();
    await expect(confirm).toBeVisible({ timeout: 10_000 });
    await confirm.getByRole('button', { name: 'Hủy bỏ', exact: true }).click();
  });

  test('admin: detail chuyến Đã duyệt — Sửa mở form cha', async ({ page }) => {
    const admin = accountByKey('admin');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', admin);

    const row = page.locator('tbody tr').filter({ hasText: 'Đã duyệt' }).first();
    await expect(row).toBeVisible({ timeout: 20_000 });
    await row.click();

    const detail = page.locator('[role="dialog"]').first();
    await expect(detail.getByRole('heading', { name: 'Chuyến xe', exact: true })).toBeVisible();
    await expect(detail.getByText(/Chỉ chỉnh sửa khi chuyến còn Chưa duyệt/i)).toHaveCount(0);

    await detail.getByRole('button', { name: /^Sửa$/i }).last().click();
    await expect(page.getByText(LOCKED_TOAST)).toHaveCount(0);
    await expect(page.locator('#chuyen-xe-ngay, input[type="date"]').first()).toBeVisible({ timeout: 10_000 });
    await closeTopDialog(page);
  });

  test('admin: detail — sửa dòng CT mở form con, không báo cáo tài xế', async ({ page }) => {
    const admin = accountByKey('admin');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', admin);

    const row = page.locator('tbody tr').filter({ hasText: 'Đã duyệt' }).first();
    await expect(row).toBeVisible({ timeout: 20_000 });
    await row.click();

    const detail = page.locator('[role="dialog"]').first();
    const ctEdit = detail.locator('table tbody tr').first().getByTitle('Sửa');
    await expect(ctEdit).toBeVisible({ timeout: 10_000 });
    await ctEdit.click();

    await expect(page.getByText(/Không thể báo cáo dòng này/i)).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: /Sửa Danh sách CT/i })).toBeVisible({ timeout: 10_000 });
    await closeTopDialog(page);
  });

  test('manager: chuyến Đã duyệt — không có Sửa 1 dòng / toast khi không có quyền', async ({ page }) => {
    const manager = accountByKey('manager');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', manager);

    const search = page.locator('input[type="search"]:visible').first();
    for (const tripId of ['49', '50', '51']) {
      if (await search.isVisible().catch(() => false)) await search.fill(tripId);
      const approved = page.locator('tbody tr').filter({ hasText: 'Đã duyệt' }).first();
      if (await approved.isVisible({ timeout: 5000 }).catch(() => false)) {
        await approved.locator('input[type="checkbox"]').first().check();
        break;
      }
    }
    await expect(bulkEditToolbarButton(page)).toHaveCount(0);
  });
});