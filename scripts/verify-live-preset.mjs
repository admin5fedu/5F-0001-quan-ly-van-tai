import { chromium } from '@playwright/test';
import path from 'path';

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
    await page.fill('input[autocomplete="username"]', 'admin');
    await page.fill('input[autocomplete="current-password"]', '123456');

    console.log('Submitting login...');
    await page.click('button[type="submit"]');

    console.log('Waiting for URL to change to homepage...');
    await page.waitForURL('https://tah-app.vercel.app/', { timeout: 10000 });
    console.log('Login successful!');

    console.log('Navigating to transport statistics tab...');
    await page.goto('https://tah-app.vercel.app/quan-ly-van-tai/chuyen-xe?tab=thong-ke');
    await page.waitForTimeout(3000); 

    console.log('Clicking the date picker trigger...');
    await page.click('button:has-text("Tháng này")');
    await page.waitForTimeout(500);

    console.log('Selecting "Tháng trước" preset...');
    await page.click('button:has-text("Tháng trước")');
    await page.waitForTimeout(3000); 

    console.log('Extracting page text...');
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('--- Page text preview (first 1200 chars) ---');
    console.log(bodyText.slice(0, 1200));
    console.log('---------------------------------------------');

    const screenshotPath = 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\e3d80e82-f58f-48a8-a0d8-3559061de6bd\\live_screenshot_preset.png';
    console.log(`Taking screenshot to: ${screenshotPath}`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    await browser.close();
  }
}

run();
