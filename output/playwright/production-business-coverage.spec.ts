import { expect, test } from '@playwright/test';
import {
  BASE_URL,
  FIXTURES,
  accountByKey,
  attachProductionGuards,
  closeTopDialog,
  expectNoFatalPageError,
  expectNoPageOverflow,
  gotoAuthed,
  gotoRoute,
  openFirstTableRowDetail,
} from './helpers/production-e2e';

const MASTER_DATA_ROUTES = [
  { path: '/quan-ly-van-tai/tai-xe', history: /Lịch sử chuyến xe/i },
  { path: '/quan-ly-van-tai/dia-diem', history: /Lịch sử chuyến liên quan/i },
  { path: '/quan-ly-van-tai/danh-sach-xe', history: /Lịch sử chuyến xe/i },
] as const;

test.describe('Production business coverage', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    attachProductionGuards(page);
  });

  test('admin: master data detail có lịch sử liên quan', async ({ page }) => {
    const admin = accountByKey('admin');
    for (const route of MASTER_DATA_ROUTES) {
      await gotoAuthed(page, route.path, admin);
      await openFirstTableRowDetail(page);
      const detail = page.locator('[role="dialog"]').first();
      await expect(detail.getByText(route.history)).toBeVisible({ timeout: 10_000 });
      await closeTopDialog(page);
    }
  });

  test('director: bảng lương + hệ thống nhân viên (không phân quyền)', async ({ page }) => {
    const director = accountByKey('director');
    await gotoAuthed(page, '/quan-ly-van-tai/bang-luong', director);
    await expectNoFatalPageError(page);
    await openFirstTableRowDetail(page);
    await expect(page.locator('[role="dialog"]').first().getByRole('link', { name: /Chi tiết trong kỳ/i })).toBeVisible();
    await closeTopDialog(page);

    await gotoRoute(page, '/he-thong/nhan-vien');
    await expectNoFatalPageError(page);
    await expect(page.getByText(/Truy cập bị từ chối/i)).toHaveCount(0);

    await gotoRoute(page, '/he-thong/phan-quyen');
    await expect(page.getByText(/Truy cập bị từ chối/i)).toHaveCount(0);
  });

  test('manager: danh sách CT + thống kê, không vào phân quyền', async ({ page }) => {
    const manager = accountByKey('manager');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach-ct', manager);
    await expect(page.getByRole('columnheader', { name: /Địa điểm/i })).toBeVisible();

    await gotoRoute(page, '/quan-ly-van-tai/thong-ke-chuyen-di');
    await expectNoFatalPageError(page);

    await gotoRoute(page, '/he-thong/phan-quyen');
    await expect(page.getByText(/Truy cập bị từ chối/i)).toBeVisible();
  });

  test('driver: chỉ thấy dữ liệu cá nhân trên chuyến xe', async ({ page }) => {
    const driver = accountByKey('driver');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', driver);
    await expectNoFatalPageError(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    await gotoRoute(page, '/quan-ly-van-tai/bang-luong');
    await expectNoFatalPageError(page);
    await expect(page.getByText(/Truy cập bị từ chối/i)).toHaveCount(0);
  });

  test('driver: payroll kỳ fixture mở chi tiết kỳ', async ({ page }) => {
    const driver = accountByKey('driver');
    const payrollId = FIXTURES.payrollWithApprovedTrips.id;
    await gotoAuthed(page, `/bang-luong-ky-chi-tiet/${payrollId}`, driver);
    await expectNoFatalPageError(page);
    await expect(page.getByRole('heading', { name: 'Chi tiết trong kỳ' })).toBeVisible();
  });

  test('admin: hồ sơ + thông báo không lỗi', async ({ page }) => {
    const admin = accountByKey('admin');
    await gotoAuthed(page, '/ho-so', admin);
    await expectNoFatalPageError(page);
    await expectNoPageOverflow(page);

    for (const path of ['/thong-bao', '/thong-tin-ban-quyen'] as const) {
      await gotoRoute(page, path);
      await expectNoFatalPageError(page);
      await expectNoPageOverflow(page);
    }
  });

  test('mobile: transport core routes không overflow', async ({ page }) => {
    const admin = accountByKey('admin');
    await page.setViewportSize({ width: 390, height: 844 });

    const mobileRoutes = [
      '/quan-ly-van-tai/chuyen-xe?tab=danh-sach',
      '/quan-ly-van-tai/bang-luong',
      '/quan-ly-van-tai/thong-ke-chuyen-di',
    ] as const;

    for (const path of mobileRoutes) {
      await gotoAuthed(page, path, admin);
      await expectNoFatalPageError(page);
      await expectNoPageOverflow(page);
    }
  });
});