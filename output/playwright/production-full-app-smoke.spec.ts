import { expect, test, type Page } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'https://tah-app.vercel.app';

const protectedRoutes = [
  '/',
  '/he-thong',
  '/he-thong/phong-ban',
  '/he-thong/chuc-vu',
  '/he-thong/nhan-vien',
  '/he-thong/thong-tin-cong-ty',
  '/he-thong/phan-quyen',
  '/quan-ly-van-tai',
  '/quan-ly-van-tai/chuyen-xe?tab=danh-sach',
  '/quan-ly-van-tai/chuyen-xe?tab=danh-sach-ct',
  '/quan-ly-van-tai/bang-luong',
  '/quan-ly-van-tai/thong-ke-chuyen-di',
  '/quan-ly-van-tai/thong-ke-luong',
  '/quan-ly-van-tai/tai-xe',
  '/quan-ly-van-tai/dia-diem',
  '/quan-ly-van-tai/danh-sach-xe',
  '/thong-tin-ban-quyen',
  '/ho-so',
  '/thong-bao',
] as const;

function slug(path: string) {
  return path.replaceAll('/', '-').replaceAll('?', '-').replaceAll('=', '-').replaceAll('&', '-').replace(/^-$/, 'home');
}

async function loginIfNeeded(page: Page) {
  const username = page.locator('input[name="username"]');
  if (!(await username.isVisible().catch(() => false))) return;
  await username.fill('admin');
  await page.locator('input[name="password"]').fill('5fedu.com');
  await page.locator('form button[type="submit"]').click();
  await expect(username).toBeHidden({ timeout: 15_000 });
}

async function gotoAuthed(page: Page, path: string) {
  await page.goto(`${baseURL}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
  await loginIfNeeded(page);
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
}

async function expectNoPageOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width + 2);
}

async function clickIfVisible(page: Page, name: RegExp) {
  const button = page.getByRole('button', { name }).first();
  if (!(await button.isVisible().catch(() => false))) return false;
  await button.click();
  await page.waitForLoadState('networkidle').catch(() => undefined);
  return true;
}

async function closeDialogIfVisible(page: Page) {
  const dialog = page.locator('[role="dialog"]').first();
  if (await dialog.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 5_000 }).catch(async () => {
      const closeButton = dialog.getByRole('button', { name: /đóng|close/i }).first();
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click({ force: true, timeout: 5_000 });
      }
    });
    await expect(dialog).toBeHidden({ timeout: 5_000 });
    return;
  }

  const cancel = page.getByRole('button', { name: /^Hủy$/i }).first();
  if (await cancel.isVisible().catch(() => false)) {
    await cancel.click({ force: true, timeout: 5_000 }).catch(async () => {
      await page.keyboard.press('Escape');
    });
    await page.waitForTimeout(300);
    return;
  }
  const close = page.getByRole('button', { name: /đóng|close/i }).first();
  if (await close.isVisible().catch(() => false)) {
    await close.click({ force: true, timeout: 5_000 }).catch(async () => {
      await page.keyboard.press('Escape');
    });
    await page.waitForTimeout(300);
  }
}

test.describe('Production full app smoke', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (text.includes('Failed to load resource')) return;
      if (/Failed to load Roboto fonts/i.test(text)) return;
      throw new Error(`Console error: ${text}`);
    });
    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();
      const allowedMissingAsset = status === 404 && /favicon|manifest|\.map($|\?)/i.test(url);
      if (status >= 400 && !allowedMissingAsset) throw new Error(`HTTP ${status}: ${url}`);
    });
    page.on('pageerror', (error) => {
      throw error;
    });
  });

  test('desktop routes, navigation and non-destructive actions', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });

    await page.goto(`${baseURL}/dang-ky`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/dang-nhap/);

    for (const path of protectedRoutes) {
      await gotoAuthed(page, path);
      await expect(page.locator('body')).not.toContainText(/Cannot GET|Application error|Something went wrong/i);
      await expectNoPageOverflow(page);
      await page.screenshot({ path: `output/playwright/prod-desktop-${slug(path)}.png`, fullPage: true });

      const search = page.locator('input[type="search"]:visible').first();
      if (await search.isVisible().catch(() => false)) {
        await search.fill('admin');
        await search.fill('');
      }

      const openedAdd = await clickIfVisible(page, /^Thêm$/i);
      if (openedAdd) await closeDialogIfVisible(page);

      const openedDetail = await clickIfVisible(page, /^(Chi tiết|Xem chi tiết)$/i);
      if (openedDetail) await closeDialogIfVisible(page);

      const openedExport = await clickIfVisible(page, /^Xuất$/i);
      if (openedExport) await page.waitForTimeout(500);
    }
  });

  test('mobile protected routes render without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of protectedRoutes) {
      await gotoAuthed(page, path);
      await expect(page.locator('body')).not.toContainText(/Cannot GET|Application error|Something went wrong/i);
      await expectNoPageOverflow(page);
      await page.screenshot({ path: `output/playwright/prod-mobile-${slug(path)}.png`, fullPage: true });
    }
  });
});
