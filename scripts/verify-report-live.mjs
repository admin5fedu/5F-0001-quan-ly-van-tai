import { chromium } from '@playwright/test';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]: ${msg.text()}`);
  });

  try {
    console.log('Navigating to login page...');
    await page.goto('https://tah-app.vercel.app/dang-nhap');
    await page.waitForLoadState('networkidle');

    console.log('Entering credentials...');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', '123456');

    console.log('Submitting login...');
    await page.click('button[type="submit"]');

    console.log('Waiting for URL to change to homepage...');
    await page.waitForURL('https://tah-app.vercel.app/', { timeout: 10000 });
    console.log('Login successful!');

    console.log('Navigating to Trip Details (Danh sách CT) tab...');
    await page.goto('https://tah-app.vercel.app/quan-ly-van-tai/chuyen-xe?tab=danh-sach-ct');
    await page.waitForTimeout(5000); 

    // Take screenshot of list-ct
    const screenshotListPath = 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\9e65083f-99d1-46eb-9045-039b90f70843\\list_ct_page.png';
    await page.screenshot({ path: screenshotListPath });
    console.log('Took list CT page screenshot:', screenshotListPath);

    // Look for rows that have status 'Đã thực hiện'
    console.log('Looking for child rows...');
    await page.waitForSelector('table tbody tr', { timeout: 5000 });
    
    const rowCount = await page.locator('table tbody tr').count();
    console.log(`Found ${rowCount} rows in CT table.`);
    
    let clickedRowIndex = -1;
    for (let i = 0; i < rowCount; i++) {
      const text = await page.locator(`table tbody tr >> nth=${i}`).innerText();
      if (text.includes('Đã thực hiện')) {
        clickedRowIndex = i;
        console.log(`Found a completed child row at index ${i}.`);
        break;
      }
    }
    
    if (clickedRowIndex === -1) {
      console.log('No completed child row found. Clicking first row anyway.');
      clickedRowIndex = 0;
    }

    console.log(`Clicking child row at index ${clickedRowIndex}...`);
    await page.locator(`table tbody tr >> nth=${clickedRowIndex}`).click();
    await page.waitForTimeout(4000); // Wait for drawer to open

    const screenshotDrawerPath = 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\9e65083f-99d1-46eb-9045-039b90f70843\\drawer_ct_open.png';
    await page.screenshot({ path: screenshotDrawerPath });
    console.log('Took CT drawer open screenshot:', screenshotDrawerPath);

    // Check if Báo cáo button is visible in child drawer
    console.log('Checking for Báo cáo button in child drawer...');
    const reportBtnSelector = 'button:has-text("Báo cáo")';
    const isReportVisible = await page.isVisible(reportBtnSelector);
    console.log('Is "Báo cáo" button visible in child drawer?', isReportVisible);

    // Verify that the Edit (Sửa) button is visible and active
    console.log('Checking if Sửa button is enabled in drawer footer...');
    const editBtnSelector = 'button:has-text("Sửa")';
    const isEditVisible = await page.isVisible(editBtnSelector);
    console.log('Is "Sửa" button visible?', isEditVisible);
    
    if (isEditVisible) {
      const isEditDisabled = await page.getAttribute(editBtnSelector, 'disabled');
      console.log('Is "Sửa" button disabled?', isEditDisabled !== null);
    }

  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    await browser.close();
  }
}

run();
