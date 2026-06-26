import { expect, test } from '@playwright/test';
import {
  FIXTURES,
  SYSTEM_ROUTES,
  TRANSPORT_ROUTES,
  accountByKey,
  assertTripParentMatchesChildren,
  repairFixtureTripRollups,
  attachProductionGuards,
  expectAccessDenied,
  expectNoFatalPageError,
  fetchEmployeeByLogin,
  fetchPositionGrants,
  getSupabaseAdmin,
  gotoAuthed,
  gotoRoute,
} from './helpers/production-e2e';

/**
 * Ma trận phân quyền production — D2 harness (owner quy chuẩn 2026-06-14).
 * Mỗi role: allowed + denied trên module chính.
 */
test.describe('Production permissions matrix', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    attachProductionGuards(page);
  });

  test('DB: rollup cha khớp trạng thái CT trên fixture trips', async () => {
    expect(getSupabaseAdmin(), 'SUPABASE_SECRET_KEY required in .env.local for L4').not.toBeNull();
    await repairFixtureTripRollups();
    const tripIds = [...FIXTURES.approvedTripIds, FIXTURES.pendingDriverTrip.id];
    for (const tripId of tripIds) {
      await assertTripParentMatchesChildren(tripId);
    }
  });

  test('DB: tài khoản test khớp cap_bac và grant chuyen-xe', async () => {
    const manager = await fetchEmployeeByLogin('tahdieuphoi');
    const driver = await fetchEmployeeByLogin('0933650398');
    const director = await fetchEmployeeByLogin('thuyan');
    expect(manager).not.toBeNull();
    expect(driver).not.toBeNull();
    expect(director).not.toBeNull();
    expect(director!.cap_bac).toBe(1);
    if (manager!.id_chuc_vu) {
      const grants = await fetchPositionGrants(manager!.id_chuc_vu, 'chuyen-xe');
      expect(grants).toContain('kiem_tra');
    }
  });

  test('admin: toàn bộ transport + system', async ({ page }) => {
    const admin = accountByKey('admin');
    await gotoAuthed(page, '/', admin);
    for (const path of [...TRANSPORT_ROUTES, ...SYSTEM_ROUTES]) {
      await gotoRoute(page, path);
      await expectNoFatalPageError(page);
      await expect(page.getByText(/Truy cập bị từ chối/i)).toHaveCount(0);
    }
  });

  test('director cap_bac=1: transport ghi + hệ thống nhân viên', async ({ page }) => {
    const director = accountByKey('director');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', director);
    await expect(page.getByRole('button', { name: /^Thêm$/i }).first()).toBeVisible();
    await gotoRoute(page, '/he-thong/nhan-vien');
    await expect(page.getByText(/Truy cập bị từ chối/i)).toHaveCount(0);
    await gotoRoute(page, '/he-thong/phan-quyen');
    await expect(page.getByText(/Truy cập bị từ chối/i)).toHaveCount(0);
  });

  test('manager kiem_tra: transport ok, phân quyền denied, hint kiểm tra', async ({ page }) => {
    const manager = accountByKey('manager');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', manager);
    await expectNoFatalPageError(page);
    await expect(page.getByText(/Quyền kiểm tra:.*xem toàn bộ/i)).toBeVisible({ timeout: 15_000 });
    await gotoRoute(page, '/quan-ly-van-tai/bang-luong');
    await expectNoFatalPageError(page);
    await gotoRoute(page, '/he-thong/phan-quyen');
    await expectAccessDenied(page);
  });

  test('driver: chuyến + lương view, không bulk duyệt, phân quyền denied', async ({ page }) => {
    const driver = accountByKey('driver');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', driver);
    await expectNoFatalPageError(page);
    await expect(page.getByRole('button', { name: /^Quản lý duyệt$/i })).toHaveCount(0);
    await gotoRoute(page, '/quan-ly-van-tai/bang-luong');
    await expectNoFatalPageError(page);
    await gotoRoute(page, '/he-thong/phan-quyen');
    await expectAccessDenied(page);
  });

  test('driver: không vào thêm nhân viên hệ thống', async ({ page }) => {
    const driver = accountByKey('driver');
    await gotoAuthed(page, '/he-thong/nhan-vien', driver);
    await expect(page.getByText(/Truy cập bị từ chối/i)).toBeVisible({ timeout: 10_000 });
  });

  test('manager: không sửa phân quyền matrix', async ({ page }) => {
    const manager = accountByKey('manager');
    await gotoAuthed(page, '/he-thong/phan-quyen', manager);
    await expectAccessDenied(page);
  });
});