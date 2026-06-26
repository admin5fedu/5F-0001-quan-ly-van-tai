import { expect, test } from '@playwright/test';
import {
  BASE_URL,
  SYSTEM_ROUTES,
  TRANSPORT_ROUTES,
  accountByKey,
  attachProductionGuards,
  clickBulkApproveToolbar,
  closeConfirmDialog,
  closeTopDialog,
  expectAccessDenied,
  expectTripParentApprovalDialog,
  openBulkApproveForFixtureTrip,
  selectFixtureTripCheckbox,
  expectNoFatalPageError,
  expectNoPageOverflow,
  gotoAuthed,
  gotoRoute,
  openFirstTableRowDetail,
} from './helpers/production-e2e';

test.describe('Production multi-role access matrix', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    attachProductionGuards(page);
  });

  test('admin: full transport + system modules', async ({ page }) => {
    const admin = accountByKey('admin');
    await gotoAuthed(page, '/', admin);

    for (const path of [...TRANSPORT_ROUTES, ...SYSTEM_ROUTES]) {
      await gotoRoute(page, path);
      await expectNoFatalPageError(page);
      await expect(page.getByText(/Truy cập bị từ chối/i)).toHaveCount(0);
    }

    await gotoRoute(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach');
    await expect(page.getByRole('button', { name: /^Thêm$/i }).first()).toBeVisible();
    await openFirstTableRowDetail(page);
    await expect(
      page.locator('[role="dialog"]').first().getByRole('button', { name: /^Quản lý duyệt$/i }).first(),
    ).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('director cap_bac=1: transport write + bulk duyệt chuyến sau chọn dòng', async ({ page }) => {
    const director = accountByKey('director');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', director);
    await expectNoFatalPageError(page);
    await expect(page.getByRole('button', { name: /^Thêm$/i }).first()).toBeVisible();
    await openBulkApproveForFixtureTrip(page);
    await closeConfirmDialog(page);
  });

  test('manager cap3+kiem_tra: transport ok, phân quyền denied', async ({ page }) => {
    const manager = accountByKey('manager');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', manager);
    await expectNoFatalPageError(page);
    await expect(page.getByRole('button', { name: /^Thêm$/i }).first()).toBeVisible();

    await gotoRoute(page, '/quan-ly-van-tai/bang-luong');
    await expectNoFatalPageError(page);

    await gotoRoute(page, '/he-thong/phan-quyen');
    await expectAccessDenied(page);
  });

  test('driver cap4: chuyến xe + bảng lương view, no bulk duyệt toolbar', async ({ page }) => {
    const driver = accountByKey('driver');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', driver);
    await expectNoFatalPageError(page);

    const bulkApprove = page.getByRole('button', { name: /^Quản lý duyệt$/i });
    await expect(bulkApprove).toHaveCount(0);

    await gotoRoute(page, '/quan-ly-van-tai/bang-luong');
    await expectNoFatalPageError(page);
    await expect(page.getByText(/Truy cập bị từ chối/i)).toHaveCount(0);
  });

  test('driver: denied phân quyền hệ thống', async ({ page }) => {
    const driver = accountByKey('driver');
    await gotoAuthed(page, '/he-thong/phan-quyen', driver);
    await expectAccessDenied(page);
  });

  test('driver: toolbar Báo cáo CT → popup TH + chi phí (không drawer ghi chú cha)', async ({ page }) => {
    const driver = accountByKey('driver');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', driver);

    const search = page.locator('input[type="search"]:visible').first();
    if (await search.isVisible().catch(() => false)) {
      await search.fill('52');
    }

    const rowCheckbox = page.locator('tbody input[type="checkbox"]').first();
    await expect(rowCheckbox).toBeVisible({ timeout: 15_000 });
    await rowCheckbox.check();

    const reportBtn = page.getByRole('button', { name: /^Báo cáo CT$/i }).first();
    await expect(reportBtn).toBeVisible({ timeout: 10_000 });
    await reportBtn.click();

    const pickCtDialog = page.locator('[role="alertdialog"]').filter({ hasText: /Chọn chi tiết chuyến/i });
    if (await pickCtDialog.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await pickCtDialog.getByRole('button', { name: /^Tiếp tục$/i }).click();
    }

    const reportDialog = page.locator('[role="alertdialog"]').filter({ hasText: /TRẠNG THÁI THỰC HIỆN/i });
    await expect(reportDialog).toBeVisible({ timeout: 10_000 });
    await expect(reportDialog.getByText(/Chi phí phát sinh/i)).toBeVisible();
    await expect(page.getByText(/Tài xế chỉ báo cáo tiến độ và chi phí/i)).toHaveCount(0);
    await closeConfirmDialog(page);
  });

  test('manager cap3: chọn fixture trip 52 không hiện Quản lý duyệt', async ({ page }) => {
    const manager = accountByKey('manager');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', manager);
    await selectFixtureTripCheckbox(page);
    await expect(page.getByRole('button', { name: /^Quản lý duyệt$/i })).toHaveCount(0);
  });

  test('manager: detail drawer mở modal duyệt chuyến cha', async ({ page }) => {
    const manager = accountByKey('manager');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', manager);
    await openFirstTableRowDetail(page);
    const detail = page.locator('[role="dialog"]').first();
    const approveBtn = detail.getByRole('button', { name: /^Quản lý duyệt$/i });
    if (await approveBtn.isVisible().catch(() => false)) {
      await approveBtn.click();
      await expectTripParentApprovalDialog(page);
      await closeConfirmDialog(page);
    }
    await closeTopDialog(page);
  });

  test('login cycle across roles via fresh session', async ({ page }) => {
    for (const key of ['admin', 'manager', 'driver'] as const) {
      const account = accountByKey(key);
      await gotoAuthed(page, '/', account);
      await expectNoFatalPageError(page);
      await expectNoPageOverflow(page);
    }
  });
});