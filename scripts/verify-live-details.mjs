import { chromium } from '@playwright/test';
import path from 'path';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]: ${msg.text()}`);
  });

  page.on('request', (req) => {
    // console.log(`[REQ]: ${req.method()} ${req.url()}`);
  });

  page.on('response', async (res) => {
    if (res.status() >= 400) {
      console.log(`[RES ERROR]: ${res.status()} ${res.url()}`);
      try {
        const text = await res.text();
        console.log(`[RES BODY]: ${text}`);
      } catch (e) {}
    }
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
    console.log('Login successful! Current URL:', page.url());

    console.log('Navigating to transport statistics tab...');
    await page.goto('https://tah-app.vercel.app/quan-ly-van-tai/chuyen-xe?tab=thong-ke');
    await page.waitForTimeout(5000); // wait 5 seconds

    console.log('Extracting page text...');
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('--- Page text preview (first 1000 chars) ---');
    console.log(bodyText.slice(0, 1000));
    console.log('---------------------------------------------');

    const screenshotPath = 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\e3d80e82-f58f-48a8-a0d8-3559061de6bd\\live_screenshot.png';
    console.log(`Taking screenshot to: ${screenshotPath}`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    await browser.close();
  }
}

run();
