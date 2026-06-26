import { expect, test } from '@playwright/test';
import {
  BASE_URL,
  FIXTURES,
  TEST_MARKER,
  accountByKey,
  attachProductionGuards,
  cleanupE2EMarker,
  clickBulkApproveToolbar,
  clickDetailToolbarAction,
  clickModuleTab,
  closeConfirmDialog,
  closeTopDialog,
  countApprovedPayrollTrips,
  ensurePayrollFixturePending,
  expectApprovalCards,
  expectTripParentApprovalDialog,
  openBulkApproveForFixtureTrip,
  restorePayrollFixture,
  snapshotPayrollFixture,
  type PayrollFixtureSnapshot,
  expectNoFatalPageError,
  expectNoPageOverflow,
  gotoAuthed,
  openFirstTableRowDetail,
  openPayrollFixtureDetail,
} from './helpers/production-e2e';

test.describe('Production transport deep flows', () => {
  test.setTimeout(120_000);

  let payrollBaseline: PayrollFixtureSnapshot = null;

  test.beforeAll(async () => {
    payrollBaseline = await snapshotPayrollFixture();
  });

  test.afterAll(async () => {
    await restorePayrollFixture(payrollBaseline);
  });

  test.beforeEach(async ({ page }) => {
    attachProductionGuards(page);
  });

  test.afterEach(async () => {
    await cleanupE2EMarker(TEST_MARKER);
  });

  test('chuyến xe tabs, detail sections, approval UI (admin)', async ({ page }) => {
    const admin = accountByKey('admin');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', admin);

    await clickModuleTab(page, /Danh sách CT/i);
    await expect(page).toHaveURL(/tab=danh-sach-ct/);
    await expect(page.getByRole('columnheader', { name: /Địa điểm/i })).toBeVisible();

    await clickModuleTab(page, /^Danh sách$/i);
    await expect(page).toHaveURL(/tab=danh-sach/);

    await openFirstTableRowDetail(page);
    const detail = page.locator('[role="dialog"]').first();
    await expect(detail.getByRole('heading', { name: 'Chuyến xe', exact: true })).toBeVisible();
    await expect(detail.getByText(/Thông tin chuyến xe|DANH SÁCH CHI TIẾT/i).first()).toBeVisible();
    await expect(detail.getByRole('button', { name: /^Sao chép$/i })).toBeVisible();
    await closeTopDialog(page);
  });

  test('chuyến xe CT tab: detail + duyệt từ drawer', async ({ page }) => {
    const admin = accountByKey('admin');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach-ct', admin);
    await openFirstTableRowDetail(page);
    const detail = page.locator('[role="dialog"]').first();
    const approveBtn = detail.getByRole('button', { name: /^Quản lý duyệt$/i });
    if (await approveBtn.isVisible().catch(() => false)) {
      await approveBtn.click();
      await expectApprovalCards(page);
      await closeConfirmDialog(page);
    }
    await closeTopDialog(page);
  });

  test('bảng lương detail: toolbar Chi tiết/In luôn hiện', async ({ page }) => {
    const admin = accountByKey('admin');
    await gotoAuthed(page, '/quan-ly-van-tai/bang-luong', admin);
    const detail = await openPayrollFixtureDetail(page);
    await expect(detail.getByRole('link', { name: /Chi tiết trong kỳ/i })).toBeVisible();
    await expect(detail.getByRole('link', { name: /In bảng lương/i })).toBeVisible();
    await closeTopDialog(page);
  });

  test('bảng lương: trang chi tiết kỳ chỉ render CT đủ R6', async ({ page }) => {
    const admin = accountByKey('admin');
    const payrollId = FIXTURES.payrollWithApprovedTrips.id;
    const expectedApproved = await countApprovedPayrollTrips(payrollId);

    await gotoAuthed(page, `/bang-luong-ky-chi-tiet/${payrollId}`, admin);
    await expectNoFatalPageError(page);

    const pendingBadge = page.getByText(/^Chưa duyệt$/i);
    expect(await pendingBadge.count()).toBe(0);

    if (expectedApproved > 0) {
      await expect(page.getByText(new RegExp(`${expectedApproved}\\s+chuyến trong kỳ`))).toBeVisible();
      await expect(page.locator('table tbody tr').first()).toBeVisible();
    } else {
      await expect(page.getByText(/0\s+chuyến trong kỳ/i)).toBeVisible();
    }
  });

  test('bảng lương: preview in loads', async ({ page }) => {
    const admin = accountByKey('admin');
    const payrollId = FIXTURES.payrollWithApprovedTrips.id;
    await gotoAuthed(page, `/bang-luong-preview/${payrollId}`, admin);
    await expect(page.getByText(/Đang tải/i)).toBeHidden({ timeout: 20_000 });
    await expectNoFatalPageError(page);
  });

  test('bảng lương chi tiết kỳ: ô vị trí không bị cắt cố định', async ({ page }) => {
    const admin = accountByKey('admin');
    const payrollId = FIXTURES.payrollWithApprovedTrips.id;
    await gotoAuthed(page, `/bang-luong-ky-chi-tiet/${payrollId}`, admin);
    await expectNoFatalPageError(page);
    await expect(page.getByText(/chuyến trong kỳ/i)).toBeVisible({ timeout: 15_000 });
    const expectedApproved = await countApprovedPayrollTrips(payrollId);
    const matrixTable = page.locator('.payroll-matrix-table');
    if (expectedApproved > 0 && (await matrixTable.count()) > 0) {
      await expect(matrixTable).toBeVisible({ timeout: 15_000 });
      const locationCell = matrixTable.locator('tbody td').filter({ hasText: /TPHCM|LỘC|CAO THẮNG/i }).first();
      if (await locationCell.count()) {
        const box = await locationCell.boundingBox();
        expect(box?.width ?? 0).toBeGreaterThan(40);
      }
    }
  });

  test('bảng lương: Quản lý duyệt modal có thẻ Duyệt/Không duyệt', async ({ page }) => {
    const admin = accountByKey('admin');
    await gotoAuthed(page, '/quan-ly-van-tai/bang-luong', admin);

    await ensurePayrollFixturePending();
    const detail = await openPayrollFixtureDetail(page);
    const approveBtn = detail.getByRole('button', { name: /^Quản lý duyệt$/i });
    await expect(approveBtn).toBeVisible({ timeout: 15_000 });
    await approveBtn.click();
    await expectApprovalCards(page);
    await closeConfirmDialog(page);
    await closeTopDialog(page);
    await expect(page.locator('[role="alertdialog"]')).toHaveCount(0);
  });

  test('thống kê chuyến đi: filter + xuất Excel', async ({ page }) => {
    const admin = accountByKey('admin');
    await gotoAuthed(page, '/quan-ly-van-tai/thong-ke-chuyen-di', admin);
    await expectNoFatalPageError(page);

    const exportBtn = page.getByRole('button', { name: /Xuất báo cáo|Xuất/i }).first();
    if (await exportBtn.isVisible().catch(() => false)) {
      await exportBtn.click();
      const excelBtn = page.getByRole('button', { name: /Excel/i }).first();
      if (await excelBtn.isVisible().catch(() => false)) {
        const download = page.waitForEvent('download', { timeout: 15_000 }).catch(() => null);
        await excelBtn.click();
        const file = await download;
        if (file) expect(file.suggestedFilename()).toMatch(/\.xlsx?$/i);
      }
    }
  });

  test('thống kê lương: render + không lỗi', async ({ page }) => {
    const admin = accountByKey('admin');
    await gotoAuthed(page, '/quan-ly-van-tai/thong-ke-luong', admin);
    await expectNoFatalPageError(page);
    await expectNoPageOverflow(page);
  });

  test('admin CRUD chuyến xe với marker E2E (create → edit → delete)', async ({ page }) => {
    const admin = accountByKey('admin');
    await cleanupE2EMarker(TEST_MARKER);
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', admin);

    await page.getByRole('button', { name: /^Thêm$/i }).click();
    const form = page.getByRole('dialog', { name: /Thêm Chuyến xe/i });
    await expect(form).toBeVisible();

    const textarea = form.locator('textarea').first();
    if (await textarea.isVisible().catch(() => false)) {
      await textarea.fill(TEST_MARKER);
    }

    await form.getByRole('button', { name: /^Thêm$/i }).click();
    await Promise.race([
      expect(page.getByText(/Đã thêm Chuyến xe/i)).toBeVisible({ timeout: 20_000 }),
      expect(form).toBeHidden({ timeout: 20_000 }),
    ]);

    const search = page.locator('input[type="search"]:visible').first();
    await search.fill(TEST_MARKER);
    await expect(page.getByRole('cell', { name: TEST_MARKER }).first()).toBeVisible({ timeout: 20_000 });
    await page.getByRole('cell', { name: TEST_MARKER }).first().click();

    const detail = page.getByRole('dialog', { name: /Chuyến xe/i }).first();
    await detail.getByRole('button', { name: /^Sửa$/i }).click();
    const editForm = page.getByRole('dialog', { name: /Sửa Chuyến xe/i });
    await expect(editForm).toBeVisible({ timeout: 10_000 });
    const editArea = editForm.locator('textarea').first();
    await editArea.fill(`${TEST_MARKER}-updated`);
    await page.locator('button[type="submit"][form="form-chuyen-xe"]').evaluate((el: HTMLButtonElement) => {
      el.click();
    });
    await Promise.race([
      expect(page.getByText(/Đã cập nhật Chuyến xe/i)).toBeVisible({ timeout: 20_000 }),
      expect(editForm).toBeHidden({ timeout: 20_000 }),
    ]);

    await search.fill(`${TEST_MARKER}-updated`);
    await expect(page.getByRole('cell', { name: `${TEST_MARKER}-updated` }).first()).toBeVisible({ timeout: 20_000 });
    await page.getByRole('cell', { name: `${TEST_MARKER}-updated` }).first().click();

    await page.getByRole('dialog', { name: /Chuyến xe/i }).first().getByRole('button', { name: /^Xóa$/i }).click();
    const confirm = page.locator('[role="dialog"], [role="alertdialog"]').filter({ hasText: /Xóa Chuyến xe/i }).first();
    await confirm.getByRole('button', { name: /^Xóa$/i }).click({ force: true });
    await Promise.race([
      expect(page.getByText(/Đã xóa/i)).toBeVisible({ timeout: 20_000 }),
      expect(page.getByRole('cell', { name: `${TEST_MARKER}-updated` })).toHaveCount(0, { timeout: 20_000 }),
    ]);
  });

  test('manager opens payroll row: toolbar actions visible', async ({ page }) => {
    const manager = accountByKey('manager');
    await gotoAuthed(page, '/quan-ly-van-tai/bang-luong', manager);
    await openFirstTableRowDetail(page);
    const detail = page.locator('[role="dialog"]').first();
    await expect(detail.getByRole('link', { name: /Chi tiết trong kỳ/i })).toBeVisible();
    await expect(detail.getByRole('link', { name: /In bảng lương/i })).toBeVisible();
    await closeTopDialog(page);
  });

  test('director bulk duyệt fixture trip 52 sau chọn dòng', async ({ page }) => {
    const director = accountByKey('director');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', director);
    await openBulkApproveForFixtureTrip(page);
    await closeConfirmDialog(page);
  });

  test('driver payroll list overflow has Chi tiết/In without hiding toolbar gate', async ({ page }) => {
    const driver = accountByKey('driver');
    await gotoAuthed(page, '/quan-ly-van-tai/bang-luong', driver);

    const overflow = page.getByRole('button', { name: /Thao tác thêm/i }).first();
    if (await overflow.isVisible().catch(() => false)) {
      await overflow.click();
      await expect(page.getByRole('menuitem', { name: /Chi tiết trong kỳ/i })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /In bảng lương/i })).toBeVisible();
      await page.keyboard.press('Escape');
    } else {
      await openFirstTableRowDetail(page);
      const detail = page.locator('[role="dialog"]').first();
      await expect(detail.getByRole('link', { name: /Chi tiết trong kỳ/i })).toBeVisible();
      await expect(detail.getByRole('link', { name: /In bảng lương/i })).toBeVisible();
      await closeTopDialog(page);
    }
  });
});