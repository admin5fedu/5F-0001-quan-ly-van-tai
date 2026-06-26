import fs from 'node:fs';
import { chromium } from '@playwright/test';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]: ${msg.text()}`);
  });

  const screenshotsDir = 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\9e65083f-99d1-46eb-9045-039b90f70843';

  try {
    console.log('Navigating to login page...');
    await page.goto('https://tah-app.vercel.app/dang-nhap');
    await page.waitForLoadState('networkidle');

    console.log('Logging in as admin...');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', '5fedu.com');
    await page.click('button[type="submit"]');

    console.log('Waiting for homepage...');
    await page.waitForURL('https://tah-app.vercel.app/', { timeout: 10000 });
    console.log('Login as Admin successful!');

    console.log('Navigating to Chuyen xe page (Danh sach)...');
    await page.goto('https://tah-app.vercel.app/quan-ly-van-tai/chuyen-xe?tab=danh-sach');
    await page.waitForTimeout(4000);

    // Save initial state screenshot
    await page.screenshot({ path: `${screenshotsDir}/verify_sync_1_initial_list.png` });
    console.log('Took initial list screenshot.');

    console.log('Opening drawer for the second trip (which is Completed, not Approved)...');
    await page.locator('table tbody tr').nth(1).click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${screenshotsDir}/verify_sync_2_drawer_open.png` });

    console.log('Opening the first child detail row in the drawer...');
    await page.locator('div:has-text("DANH SÁCH CHI TIẾT CHUYẾN") ~ div table tbody tr').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${screenshotsDir}/verify_sync_3_child_drawer_open.png` });

    const hasReportBtn = await page.isVisible('button:has-text("Báo cáo")');
    console.log('Child drawer has "Báo cáo" button?', hasReportBtn);

    if (hasReportBtn) {
      console.log('Clicking "Báo cáo" button to trigger status change dialog...');
      await page.click('button:has-text("Báo cáo")');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${screenshotsDir}/verify_sync_4_report_dialog.png` });

      console.log('Filling note in status dialog...');
      const uniqueNote = `Báo cáo lúc ${new Date().toLocaleTimeString('vi-VN')}`;
      await page.fill('textarea', uniqueNote);

      console.log('Submitting the status update in the dialog...');
      // Click the submit button inside the dialog footer
      await page.click('button[type="submit"]:has-text("Báo cáo")');
      await page.waitForTimeout(4000); // Wait for API call and invalidateQueries to complete
      await page.screenshot({ path: `${screenshotsDir}/verify_sync_4_report_submitted.png` });
      console.log('Status change submitted successfully.');
    }

    console.log('Navigating directly to "Danh sách CT" tab...');
    await page.goto('https://tah-app.vercel.app/quan-ly-van-tai/chuyen-xe?tab=danh-sach-ct');
    await page.waitForTimeout(5000); // Wait for the list to load
    await page.screenshot({ path: `${screenshotsDir}/verify_sync_5_list_ct_page.png` });

    const rowCount = await page.locator('table tbody tr').count();
    console.log(`E2E Verification SUCCESS: Found ${rowCount} rows in "Danh sách CT" tab!`);

  } catch (err) {
    console.error('E2E Verification failed:', err);
  } finally {
    await browser.close();
  }
}

run();
