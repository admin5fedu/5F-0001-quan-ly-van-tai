import { chromium } from '@playwright/test';
import fs from 'fs';
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
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle' })
    ]);

    console.log('Navigating to payroll page...');
    await page.goto('https://tah-app.vercel.app/quan-ly-van-tai/bang-luong');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('Taking screenshot of the list...');
    await page.screenshot({ path: 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\77037372-05b4-43e4-9bf3-97612f39db03\\payroll_live_list.png', fullPage: true });

    console.log('Finding edit buttons...');
    // Locate the Edit button inside table rows
    const editButton = page.locator('tbody tr td button:has-text("Sửa"), tbody tr td button:has(svg.lucide-edit), tbody tr td button[title="Sửa"]');
    const count = await editButton.count();
    console.log(`Found ${count} edit buttons.`);

    if (count > 0) {
      console.log('Clicking the first edit button...');
      await editButton.first().click();
      await page.waitForTimeout(2000);

      console.log('Taking screenshot of the edit drawer...');
      await page.screenshot({ path: 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\77037372-05b4-43e4-9bf3-97612f39db03\\payroll_live_drawer.png', fullPage: true });

      // Target fields via their unique IDs
      const truTienInput = page.locator('#bang-luong-tru_tien_khac');
      const chiPhiKhacInput = page.locator('#bang-luong-tong_chi_phi_khac');
      const ghiChuTruInput = page.locator('#bang-luong-ghi_chu_khoan_tru');
      const ghiChuChiPhiInput = page.locator('#bang-luong-ghi_chu_chi_phi');

      if (await truTienInput.count() > 0) {
        await truTienInput.first().fill('50000');
        console.log('Filled #bang-luong-tru_tien_khac with 50000');
      } else {
        console.log('Could not find #bang-luong-tru_tien_khac');
      }

      if (await chiPhiKhacInput.count() > 0) {
        await chiPhiKhacInput.first().fill('100000');
        console.log('Filled #bang-luong-tong_chi_phi_khac with 100000');
      } else {
        console.log('Could not find #bang-luong-tong_chi_phi_khac');
      }

      if (await ghiChuTruInput.count() > 0) {
        await ghiChuTruInput.first().fill('Trừ phạt vi phạm giao thông');
        console.log('Filled #bang-luong-ghi_chu_khoan_tru');
      } else {
        console.log('Could not find #bang-luong-ghi_chu_khoan_tru');
      }

      if (await ghiChuChiPhiInput.count() > 0) {
        await ghiChuChiPhiInput.first().fill('Hỗ trợ ăn ca ngoài giờ');
        console.log('Filled #bang-luong-ghi_chu_chi_phi');
      } else {
        console.log('Could not find #bang-luong-ghi_chu_chi_phi');
      }

      await page.waitForTimeout(1000);
      console.log('Taking screenshot of filled drawer...');
      await page.screenshot({ path: 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\77037372-05b4-43e4-9bf3-97612f39db03\\payroll_live_drawer_filled.png', fullPage: true });

      // Click Save/Submit button
      const submitButton = page.locator('form button[type="submit"], button:has-text("Lưu")');
      if (await submitButton.count() > 0) {
        console.log('Clicking Save/Submit...');
        await submitButton.first().click();
        await page.waitForTimeout(3000);

        console.log('Taking screenshot of list after save...');
        await page.screenshot({ path: 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\77037372-05b4-43e4-9bf3-97612f39db03\\payroll_live_list_after.png', fullPage: true });
      } else {
        console.log('Submit button not found!');
      }
    } else {
      console.log('No edit button found!');
    }

  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    await browser.close();
  }
}

run();
