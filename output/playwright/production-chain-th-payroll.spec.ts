import { expect, test } from '@playwright/test';
import {
  FIXTURES,
  accountByKey,
  attachProductionGuards,
  confirmApprovalDialog,
  countApprovedPayrollTrips,
  gotoAuthed,
  openBulkApproveForFixtureTrip,
  openDriverCtReportForFixtureTrip,
  restorePayrollFixture,
  restorePendingDriverTrip,
  snapshotPayrollFixture,
  snapshotPendingDriverTrip,
  submitDriverCtReport,
  type PayrollFixtureSnapshot,
  type TripExecutionSnapshot,
} from './helpers/production-e2e';

test.describe('Production chain TH → duyệt → payroll R6', () => {
  test.setTimeout(180_000);

  let tripBaseline: TripExecutionSnapshot | null = null;
  let payrollBaseline: PayrollFixtureSnapshot = null;

  test.beforeAll(async () => {
    tripBaseline = await snapshotPendingDriverTrip();
    payrollBaseline = await snapshotPayrollFixture();
  });

  test.afterAll(async () => {
    await restorePendingDriverTrip(tripBaseline);
    await restorePayrollFixture(payrollBaseline);
  });

  test.beforeEach(async ({ page }) => {
    attachProductionGuards(page);
  });

  test('driver báo cáo TH → director duyệt cha → payroll 607 có CT R6', async ({ page }) => {
    const payrollId = FIXTURES.payrollWithApprovedTrips.id;
    const beforeCount = await countApprovedPayrollTrips(payrollId);
    expect(beforeCount).toBeGreaterThanOrEqual(0);

    const driver = accountByKey('driver');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', driver);
    await openDriverCtReportForFixtureTrip(page);
    await submitDriverCtReport(page);

    const director = accountByKey('director');
    await gotoAuthed(page, '/quan-ly-van-tai/chuyen-xe?tab=danh-sach', director);
    await openBulkApproveForFixtureTrip(page);
    await confirmApprovalDialog(page, 'Duyệt');

    await expect
      .poll(async () => countApprovedPayrollTrips(payrollId), { timeout: 30_000 })
      .toBeGreaterThan(beforeCount);

    await gotoAuthed(page, `/bang-luong-ky-chi-tiet/${payrollId}`, accountByKey('admin'));
    await expect(page.locator('.payroll-matrix-table, table').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/chuyến trong kỳ/i)).toBeVisible({ timeout: 20_000 });
  });
});