import { chromium } from '@playwright/test';
import { getSession, makeContext, sleep, shot, APP, CHROME, db } from './qa-lib.mjs';

async function clickCombobox(page, scope, placeholderRe) {
  // The Combobox trigger shows the placeholder/value text
  const trigger = scope.locator('button, [role="combobox"], div').filter({ hasText: placeholderRe }).first();
  await trigger.click();
  await sleep(800);
}

async function run() {
  const session = await getSession();
  console.log('session ok');
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox'] });
  const ctx = await makeContext(browser, session);
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);

  await page.goto(`${APP}/quan-ly-van-tai/chuyen-xe`, { waitUntil: 'networkidle' });
  await sleep(4000);
  await page.locator('tbody tr').first().locator('td').nth(1).click();
  await sleep(2500);

  // open Thêm dòng con
  await page.locator('button:has-text("Thêm dòng con")').first().click();
  await sleep(2500);
  const drawer = page.locator('[role="dialog"]').filter({ hasText: 'Thêm chi tiết chuyến' }).first();
  await shot(page, 't6t13-1-drawer-open.png');

  // Select Nhóm
  await drawer.getByText('Chọn nhóm...', { exact: false }).first().click();
  await sleep(900);
  // options portal -> click "Khô" (exact to avoid "Khô - ICD")
  await page.getByRole('option', { name: 'Khô', exact: true }).first().click().catch(async () => {
    await page.locator('[role="option"]', { hasText: 'Khô' }).first().click();
  });
  await sleep(1000);
  await shot(page, 't6t13-2-nhom-selected.png');

  // Select Địa điểm (now enabled)
  await drawer.getByText('Chọn địa điểm...', { exact: false }).first().click();
  await sleep(900);
  await page.getByRole('option', { name: 'Văn Thánh', exact: true }).first().click().catch(async () => {
    await page.locator('[role="option"]', { hasText: 'Văn Thánh' }).first().click();
  });
  await sleep(1200);
  await shot(page, 't6t13-3-diadiem-selected-autofill.png');

  // read tien_luong value
  const tienLuong = await drawer.locator('input[type="text"]').nth(0).inputValue().catch(() => '?');
  console.log('Tiền lương field after location select:', tienLuong);

  // Save
  await drawer.locator('button:has-text("Lưu dòng con")').click();
  await sleep(3500);
  await shot(page, 't6t13-4-after-save.png');

  await ctx.close();
  await browser.close();

  // DB verify
  const { data } = await db.from('vt_chuyen_xe_ct').select('*').eq('id_chuyen_xe', 37).order('id');
  console.log('CT rows of trip 37 now:', data.length);
  const added = data.filter((r) => ![32, 33].includes(r.id));
  console.log('NEW CT rows:', JSON.stringify(added));
  console.log('DONE');
}
run().catch((e) => { console.error('FATAL', e.message, e.stack); });
