import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  TEST_MARKER,
  accountByKey,
  attachProductionGuards,
  cleanupE2EMarker,
  closeTopDialog,
  gotoAuthed,
} from './helpers/production-e2e';

async function openAddDrawer(page: Page, buttonLabel = /^Thêm$/i): Promise<Locator> {
  await page.getByRole('button', { name: buttonLabel }).first().click();
  const drawer = page.getByRole('dialog').last();
  await expect(drawer).toBeVisible({ timeout: 20_000 });
  return drawer;
}

async function openTransportAddForm(page: Page, title: RegExp): Promise<Locator> {
  await page.getByRole('button', { name: /^Thêm$/i }).first().click();
  const form = page.getByRole('dialog', { name: title });
  await expect(form).toBeVisible({ timeout: 20_000 });
  return form;
}

async function fillByLabel(drawer: Locator, label: RegExp | string, value: string): Promise<void> {
  await drawer.getByLabel(label).fill(value);
}

async function fillTransportField(form: Locator, label: RegExp, value: string): Promise<void> {
  const textbox = form.getByRole('textbox', { name: label });
  if (await textbox.count()) {
    await textbox.first().fill(value);
    return;
  }
  const field = form.locator('div.space-y-1\\.5').filter({ has: form.locator('label span', { hasText: label }) }).locator('input, textarea').first();
  await field.fill(value);
}

async function pickComboboxByIndex(page: Page, drawer: Locator, index: number): Promise<void> {
  const combo = drawer.getByRole('combobox').nth(index);
  await combo.click();
  const option = page.getByRole('option').first();
  await expect(option).toBeVisible({ timeout: 10_000 });
  await option.click();
}

async function submitDrawer(drawer: Locator, label = /^Thêm$/i): Promise<void> {
  await drawer.getByRole('button', { name: label }).click();
}

async function expectMarkerInGrid(page: Page, marker: string): Promise<void> {
  const search = page.locator('input[type="search"]:visible').first();
  await search.fill(marker);
  await expect(page.getByRole('cell', { name: new RegExp(marker, 'i') }).first()).toBeVisible({ timeout: 30_000 });
}

test.describe('Production master CRUD marker', () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    attachProductionGuards(page);
    await cleanupE2EMarker(TEST_MARKER);
  });

  test.afterEach(async () => {
    await cleanupE2EMarker(TEST_MARKER);
  });

  test('phong-ban: create → delete', async ({ page }) => {
    const admin = accountByKey('admin');
    const code = `PB${Date.now().toString().slice(-6)}`;
    const name = `E2E ${TEST_MARKER}`;
    await gotoAuthed(page, '/he-thong/phong-ban', admin);
    const drawer = await openAddDrawer(page);
    await fillByLabel(drawer, /Tên phòng ban/i, name);
    await fillByLabel(drawer, /Mã số/i, code);
    await fillByLabel(drawer, /Mô tả/i, TEST_MARKER);
    await submitDrawer(drawer);
    await expect(page.getByText(/Tạo phòng ban thành công/i)).toBeVisible({ timeout: 30_000 });

    await expectMarkerInGrid(page, TEST_MARKER);
    await page.getByRole('cell', { name: TEST_MARKER }).first().click();
    await page.getByRole('dialog').first().getByRole('button', { name: /^Xóa$/i }).click();
    const confirm = page.locator('[role="alertdialog"], [role="dialog"]').filter({ hasText: /Xóa phòng ban/i }).first();
    await confirm.getByRole('button', { name: /^Xóa$/i }).click({ force: true });
    await expect(page.getByText(/Xóa phòng ban thành công/i)).toBeVisible({ timeout: 30_000 });
  });

  test('chuc-vu: create → delete', async ({ page }) => {
    const admin = accountByKey('admin');
    const code = `CVT${Date.now().toString().slice(-7)}`;
    const name = `E2E ${TEST_MARKER}`;
    await gotoAuthed(page, '/he-thong/chuc-vu', admin);
    const drawer = await openAddDrawer(page);
    await fillByLabel(drawer, /Mã chức vụ/i, code);
    await fillByLabel(drawer, /Tên chức vụ/i, name);
    const deptCombo = drawer.getByRole('combobox').first();
    await deptCombo.click();
    await page.getByRole('option', { name: /Phòng vận hành/i }).first().click();
    await expect(deptCombo).toContainText(/Phòng vận hành/i);
    await fillByLabel(drawer, /Cấp bậc/i, '4');
    await fillByLabel(drawer, /Mô tả/i, TEST_MARKER);
    await page.locator('button[type="submit"][form="pos-form"]').click();
    await expect(page.getByText(/Tạo chức vụ thành công/i)).toBeVisible({ timeout: 30_000 });
    await expectMarkerInGrid(page, TEST_MARKER);

    await page.getByRole('cell', { name: name }).first().click();
    await page.getByRole('dialog').first().getByRole('button', { name: /^Xóa$/i }).click();
    const confirm = page.locator('[role="alertdialog"], [role="dialog"]').filter({ hasText: /Xóa chức vụ/i }).first();
    await confirm.getByRole('button', { name: /^Xóa$/i }).click({ force: true });
    await expect(page.getByText(/Đã xóa thành công/i)).toBeVisible({ timeout: 30_000 });
  });

  test('dia-diem: create → delete', async ({ page }) => {
    const admin = accountByKey('admin');
    const name = `DD ${TEST_MARKER}`;
    await gotoAuthed(page, '/quan-ly-van-tai/dia-diem', admin);
    const form = await openTransportAddForm(page, /Thêm Địa điểm/i);
    await fillTransportField(form, /^Tên/, name);
    const textarea = form.locator('textarea:visible').first();
    if (await textarea.isVisible().catch(() => false)) await textarea.fill(TEST_MARKER);
    await page.locator('button[type="submit"][form="form-dia-diem"]').click();
    await expectMarkerInGrid(page, name);

    await page.getByRole('cell', { name: name }).first().click();
    await page.getByRole('dialog').first().getByRole('button', { name: /^Xóa$/i }).click();
    const confirm = page.locator('[role="alertdialog"], [role="dialog"]').filter({ hasText: /Xóa Địa điểm/i }).first();
    await confirm.getByRole('button', { name: /^Xóa$/i }).click({ force: true });
    await expect(page.getByText(/Đã xóa/i)).toBeVisible({ timeout: 30_000 });
  });

  test('danh-sach-xe: create → delete', async ({ page }) => {
    const admin = accountByKey('admin');
    const plate = `E2E${Date.now().toString().slice(-5)}`;
    await gotoAuthed(page, '/quan-ly-van-tai/danh-sach-xe', admin);
    const form = await openTransportAddForm(page, /Thêm Danh sách xe/i);
    await fillTransportField(form, /^Hãng/, 'E2E');
    await fillTransportField(form, /^Model/, 'Test');
    await fillTransportField(form, /Biển số/, plate);
    const note = form.locator('textarea:visible').first();
    if (await note.isVisible().catch(() => false)) await note.fill(TEST_MARKER);
    await page.locator('button[type="submit"][form="form-danh-sach-xe"]').click();
    await expectMarkerInGrid(page, plate);

    await page.getByRole('cell', { name: plate }).first().click();
    await page.getByRole('dialog').first().getByRole('button', { name: /^Xóa$/i }).click();
    const confirm = page.locator('[role="alertdialog"], [role="dialog"]').filter({ hasText: /Xóa/i }).first();
    await confirm.getByRole('button', { name: /^Xóa$/i }).click({ force: true });
    await expect(page.getByText(/Đã xóa/i)).toBeVisible({ timeout: 30_000 });
  });

  test('nhan-vien: create → delete', async ({ page }) => {
    const admin = accountByKey('admin');
    const login = `e2e${Date.now().toString().slice(-8)}`;
    await gotoAuthed(page, '/he-thong/nhan-vien', admin);
    const drawer = await openAddDrawer(page);
    await fillByLabel(drawer, /Họ và tên/i, `NV ${TEST_MARKER}`);
    await pickComboboxByIndex(page, drawer, 1);
    await pickComboboxByIndex(page, drawer, 2);
    await fillByLabel(drawer, /Tên đăng nhập/i, login);
    await fillByLabel(drawer, /Mật khẩu/i, '123456');
    await page.locator('button[type="submit"][form="emp-form"]').click();
    await expectMarkerInGrid(page, TEST_MARKER);

    await page.getByRole('cell', { name: TEST_MARKER }).first().click();
    await page.getByRole('dialog').first().getByRole('button', { name: /^Xóa$/i }).click();
    const confirm = page.locator('[role="alertdialog"], [role="dialog"]').filter({ hasText: /Xóa nhân viên/i }).first();
    await confirm.getByRole('button', { name: /^Xóa$/i }).click({ force: true });
    await expect(page.getByText(/Đã xóa/i)).toBeVisible({ timeout: 40_000 });
  });

  test('tai-xe: sửa thong_tin_khac rồi khôi phục', async ({ page }) => {
    const admin = accountByKey('admin');
    await gotoAuthed(page, '/quan-ly-van-tai/tai-xe', admin);
    const search = page.locator('input[type="search"]:visible').first();
    await search.fill('Nguyễn Hồng Tuấn');
    const row = page.locator('tbody tr').first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    await row.click();
    const detail = page.getByRole('dialog').first();
    await detail.getByRole('button', { name: /^Sửa$/i }).last().click();
    const editForm = page.getByRole('dialog').last();
    const info = editForm.locator('textarea:visible').first();
    const original = await info.inputValue();
    await info.fill(`${original}\n${TEST_MARKER}`);
    await editForm.getByRole('button', { name: /^Lưu$/i }).click();
    await expect(page.getByText(/Đã cập nhật/i)).toBeVisible({ timeout: 30_000 });
    await closeTopDialog(page);
    await search.fill('Nguyễn Hồng Tuấn');
    await row.click();
    await detail.getByRole('button', { name: /^Sửa$/i }).last().click();
    await info.fill(original);
    await editForm.getByRole('button', { name: /^Lưu$/i }).click();
    await expect(page.getByText(/Đã cập nhật/i)).toBeVisible({ timeout: 30_000 });
  });
});