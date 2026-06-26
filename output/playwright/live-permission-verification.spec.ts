import { expect, test, type Page } from '@playwright/test';
import { BASE_URL, login, logout } from './helpers/production-e2e';

/** Production fixture: chức vụ Tài xế + tài khoản 0933650398 (NV 115, không có quyền nhan-vien mặc định). */
const TARGET_ROLE_LABEL = 'Tài xế';
const TARGET_USERNAME = '0933650398';
const TARGET_PASSWORD = '123456';

/** view=0, create=1, update=2 trong MATRIX_ACTIONS */
const NHAN_VIEN_ACTION_INDEXES = [0, 1, 2] as const;

async function openPermissionMatrix(page: Page) {
  await page.goto(`${BASE_URL}/he-thong/phan-quyen`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await selectNhanVienModule(page);
}

async function selectNhanVienModule(page: Page) {
  const moduleBtn = page
    .locator('button')
    .filter({ hasText: /Danh sách Nhân viên|nhan-vien/i })
    .first();
  if (await moduleBtn.isVisible().catch(() => false)) {
    await moduleBtn.click();
    await page.waitForTimeout(500);
  }
}

function roleRow(page: Page) {
  return page.locator('tbody tr').filter({ hasText: TARGET_ROLE_LABEL }).last();
}

async function setRoleNhanVienAccess(page: Page, enabled: boolean) {
  const row = roleRow(page);
  const cols = row.locator('td button');
  const colCount = await cols.count();
  expect(colCount).toBeGreaterThanOrEqual(5);

  for (const index of NHAN_VIEN_ACTION_INDEXES) {
    const classVal = (await cols.nth(index).getAttribute('class')) ?? '';
    const isChecked = classVal.includes('bg-primary');
    if (enabled !== isChecked) {
      await cols.nth(index).click();
    }
  }

  const saveBtn = page.getByRole('button', { name: /Lưu|Save|Lưu thay đổi/i }).first();
  await saveBtn.click();
  await page.waitForTimeout(3000);
}

test.describe('Live permission enforcement and propagation', () => {
  test.setTimeout(180000);

  test('E2E Flow: Admin grants and revokes permissions, verifying employee restrictions', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });

    await login(page, 'admin');
    await openPermissionMatrix(page);

    await setRoleNhanVienAccess(page, false);
    await page.screenshot({ path: 'output/playwright/permission-matrix-admin.png' });

    await logout(page);

    await login(page, TARGET_USERNAME, TARGET_PASSWORD);
    await page.goto(`${BASE_URL}/he-thong/nhan-vien`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: 'Truy cập bị từ chối' })).toBeVisible();
    await page.screenshot({ path: 'output/playwright/permission-restricted-driver.png' });

    await logout(page);

    await login(page, 'admin');
    await openPermissionMatrix(page);
    await setRoleNhanVienAccess(page, true);

    await logout(page);

    await login(page, TARGET_USERNAME, TARGET_PASSWORD);
    await page.goto(`${BASE_URL}/he-thong/nhan-vien`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('button', { name: /^Thêm$/i }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('table')).toBeVisible();
    await page.screenshot({ path: 'output/playwright/permission-granted-driver.png' });

    await logout(page);

    await login(page, 'admin');
    await openPermissionMatrix(page);
    await setRoleNhanVienAccess(page, false);
  });
});