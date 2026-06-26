import { expect, test } from '@playwright/test';
import {
  accountByKey,
  attachProductionGuards,
  closeConfirmDialog,
  closeTopDialog,
  expectTripParentApprovalDialog,
  gotoAuthed,
  openBulkApproveForFixtureTrip,
  selectFixtureTripCheckbox,
  restorePendingDriverTrip,
  snapshotPendingDriverTrip,
  type TripExecutionSnapshot,
} from './helpers/production-e2e';

test.describe('Production trip execution vs approval', () => {
  test.setTimeout(120_000);

  let baseline: TripExecutionSnapshot | null = null;

  test.beforeAll(async () => {
    baseline = await snapshotPendingDriverTrip();
  });

  test.afterAll(async () => {
    await restorePendingDriverTrip(baseline);
  });

  test.beforeEach(async ({ page }) => {
    attachProductionGuards(page);
  });

  test('driver: báo cáo CT — toolbar chọn CT rồi popup TH + chi phí', async ({ page }) => {
    const driver = accountByKey('driver');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', driver);

    const search = page.locator('input[type="search"]:visible').first();
    if (await search.isVisible().catch(() => false)) {
      await search.fill('52');
    }

    const rowCheckbox = page.locator('tbody input[type="checkbox"]').first();
    await expect(rowCheckbox).toBeVisible({ timeout: 15_000 });
    await rowCheckbox.check();

    const reportTripBtn = page.getByRole('button', { name: /^Báo cáo CT$/i }).first();
    await expect(reportTripBtn).toBeVisible({ timeout: 10_000 });
    await reportTripBtn.click();

    const pickCtDialog = page.locator('[role="alertdialog"]').filter({ hasText: /Chọn chi tiết chuyến/i });
    if (await pickCtDialog.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await pickCtDialog.getByRole('button', { name: /^Tiếp tục$/i }).click();
    }

    const reportDialog = page.locator('[role="alertdialog"]').filter({ hasText: /TRẠNG THÁI THỰC HIỆN/i });
    await expect(reportDialog).toBeVisible({ timeout: 10_000 });
    await expect(reportDialog.getByText(/Chi phí phát sinh/i)).toBeVisible();
    await closeConfirmDialog(page);
  });

  test('driver: filter chip Thực hiện trên tab CT', async ({ page }) => {
    const driver = accountByKey('driver');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach-ct', driver);

    const executionFilter = page.getByRole('button', { name: /^Thực hiện$/i }).first();
    const executionColumn = page.getByRole('columnheader', { name: /Thực hiện/i });
    await expect(executionFilter.or(executionColumn).first()).toBeVisible({ timeout: 15_000 });
  });

  test('director: bulk duyệt chuyến cha — modal cascade (không duyệt lẻ CT)', async ({ page }) => {
    const director = accountByKey('director');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', director);
    await openBulkApproveForFixtureTrip(page);
    await closeConfirmDialog(page);
  });

  test('manager cap3: fixture trip 52 không có Quản lý duyệt (phạm vi cá nhân)', async ({ page }) => {
    const manager = accountByKey('manager');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', manager);
    await selectFixtureTripCheckbox(page);
    await expect(page.getByRole('button', { name: /^Quản lý duyệt$/i })).toHaveCount(0);
  });

  test('manager: detail chuyến mở modal duyệt cha', async ({ page }) => {
    const manager = accountByKey('manager');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', manager);

    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 15_000 });
    await firstRow.click();

    const detail = page.locator('[role="dialog"]').first();
    const approveBtn = detail.getByRole('button', { name: /^Quản lý duyệt$/i });
    if (await approveBtn.isVisible().catch(() => false)) {
      await approveBtn.click();
      await expectTripParentApprovalDialog(page);
      await closeConfirmDialog(page);
    }
    await closeTopDialog(page);
  });
});