import { expect, test } from '@playwright/test';
import {
  accountByKey,
  attachProductionGuards,
  expectNoFatalPageError,
  gotoAuthed,
} from './helpers/production-e2e';

test.describe('Production stats TH vs duyệt', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    attachProductionGuards(page);
  });

  test('thống kê chuyến đi: hiển thị tỷ lệ TH và tỷ lệ duyệt tách biệt', async ({ page }) => {
    const admin = accountByKey('admin');
    await gotoAuthed(page, '/quan-ly-van-tai/thong-ke-chuyen-di', admin);
    await expectNoFatalPageError(page);
    await expect(page.getByText(/Tỷ lệ TH:/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Tỷ lệ duyệt:/i)).toBeVisible();
  });
});