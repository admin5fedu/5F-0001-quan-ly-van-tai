import { chromium } from '@playwright/test';
import { getSession, makeContext, sleep, db, APP, CHROME, storageKey } from './qa-lib.mjs';

const OUT_DIR = './test-results';

// Custom shot helper using local folder
async function saveShot(page, filename) {
  const path = `${OUT_DIR}/${filename}`;
  await page.screenshot({ path });
  console.log(`  📸 Saved screenshot: ${path}`);
}

async function run() {
  console.log('--- STARTING COMPREHENSIVE TRANSPORT BUSINESS LOGIC VALIDATION ---');
  
  // 1. Get Session for Linh (Driver) and Admin
  console.log('Generating session tokens...');
  const sessionLinh = await getSession('linh@gmail.com');
  const sessionAdmin = await getSession('admin@gmail.com');
  console.log('Sessions initialized successfully.');

  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox'] });

  try {
    // ==========================================
    // CASE 1: DRIVER LOGGED IN EXPERIENCE
    // ==========================================
    console.log('\n--- Case 1: Driver Experience (User: linh) ---');
    const authStorageLinh = JSON.stringify({
      state: {
        user: {
          id: 'a9e25070-7ee8-4620-994c-c9d878bb6bc6',
          email: 'linh@gmail.com',
          full_name: 'Linh',
          role: 'user',
          id_phong_ban: '9',
          id_chuc_vu: ['7'],
          ten_dang_nhap: 'linh',
          la_tai_xe: true
        },
        isAuthenticated: true
      },
      version: 2,
    });

    const ctxLinh = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctxLinh.addInitScript(([k, v, ak, av]) => {
      localStorage.setItem(k, v);
      localStorage.setItem('auth-remember', 'true');
      localStorage.setItem(ak, av);
    }, [storageKey, JSON.stringify(sessionLinh), 'auth-storage', authStorageLinh]);

    const pageLinh = await ctxLinh.newPage();
    pageLinh.setDefaultTimeout(15000);

    console.log('Navigating to Chuyến xe as Driver...');
    await pageLinh.goto(`${APP}/quan-ly-van-tai/chuyen-xe`, { waitUntil: 'networkidle' });
    await sleep(3500);

    // Verify toolbar button renamed to "Báo cáo chuyến"
    const addBtnLinh = pageLinh.locator('button:has-text("Báo cáo chuyến")').first();
    const isAddBtnLinhVisible = await addBtnLinh.isVisible();
    console.log('Is "Báo cáo chuyến" button visible for driver?', isAddBtnLinhVisible);
    if (!isAddBtnLinhVisible) {
      throw new Error('Driver does not see "Báo cáo chuyến" button!');
    }
    await saveShot(pageLinh, 'case1-driver-toolbar.png');

    // Click "Báo cáo chuyến" and verify prefill
    console.log('Clicking "Báo cáo chuyến"...');
    await addBtnLinh.click();
    await sleep(2500);
    await saveShot(pageLinh, 'case1-driver-drawer.png');

    // Verify driver is selected and prefilled
    const driverWrapper = pageLinh.locator('div.relative').filter({ has: pageLinh.locator('label').filter({ hasText: /^Tài xế/ }) });
    const driverInput = driverWrapper.locator('button[role="combobox"]').first();
    const driverText = await driverInput.innerText().catch(() => '');
    console.log('Prefilled driver name:', driverText);
    if (!driverText.includes('Linh')) {
      throw new Error('Driver name is not prefilled to "Linh"!');
    }

    // Verify driver combobox is disabled/read-only for Driver
    const isDriverInputDisabled = await driverInput.isDisabled();
    console.log('Is driver combobox disabled for driver?', isDriverInputDisabled);
    if (!isDriverInputDisabled) {
      throw new Error('Driver field should be disabled for driver self-reporting!');
    }

    // Verify vehicle is prefilled (default vehicle 24)
    const { data: xe24 } = await db.from('vt_xe').select('bien_so').eq('id', 24).single();
    const defaultPlate = xe24?.bien_so || '50H-085.86';
    console.log('Expected default vehicle plate:', defaultPlate);

    const vehicleWrapper = pageLinh.locator('div.relative').filter({ has: pageLinh.locator('label').filter({ hasText: /^Xe$/ }) });
    const vehicleInput = vehicleWrapper.locator('button[role="combobox"]').first();
    const vehicleText = await vehicleInput.innerText().catch(() => '');
    console.log('Prefilled vehicle plate text:', vehicleText);
    if (!vehicleText.includes(defaultPlate)) {
      throw new Error(`Vehicle plate is not prefilled to default plate "${defaultPlate}"!`);
    }

    // Close drawer
    await pageLinh.locator('button[aria-label="Close"], button:has-text("Hủy"), button:has-text("Đóng")').first().click().catch(() => {});
    await ctxLinh.close();

    // ==========================================
    // CASE 2: ADMIN LOGGED IN EXPERIENCE
    // ==========================================
    console.log('\n--- Case 2: Admin Experience (User: admin) ---');
    const authStorageAdmin = JSON.stringify({
      state: {
        user: {
          id: 'cd850a9d-3bbf-41be-b957-32708d8952b0',
          email: 'admin@gmail.com',
          full_name: 'Admin',
          role: 'admin',
          id_phong_ban: '1',
          id_chuc_vu: ['1'],
          ten_dang_nhap: 'admin'
        },
        isAuthenticated: true
      },
      version: 2,
    });

    const ctxAdmin = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctxAdmin.addInitScript(([k, v, ak, av]) => {
      localStorage.setItem(k, v);
      localStorage.setItem('auth-remember', 'true');
      localStorage.setItem(ak, av);
    }, [storageKey, JSON.stringify(sessionAdmin), 'auth-storage', authStorageAdmin]);

    const pageAdmin = await ctxAdmin.newPage();
    pageAdmin.setDefaultTimeout(15000);

    console.log('Navigating to Chuyến xe as Admin...');
    await pageAdmin.goto(`${APP}/quan-ly-van-tai/chuyen-xe`, { waitUntil: 'networkidle' });
    await sleep(3500);

    // Verify toolbar button says "Thêm mới" for Admin
    const addBtnAdmin = pageAdmin.locator('button:has-text("Thêm mới")').first();
    const isAddBtnAdminVisible = await addBtnAdmin.isVisible();
    console.log('Is "Thêm mới" button visible for admin?', isAddBtnAdminVisible);
    if (!isAddBtnAdminVisible) {
      throw new Error('Admin does not see "Thêm mới" button!');
    }
    await saveShot(pageAdmin, 'case2-admin-toolbar.png');

    // Click "Thêm mới" and verify fields NOT prefilled & editable
    console.log('Clicking "Thêm mới"...');
    await addBtnAdmin.click();
    await sleep(2500);
    await saveShot(pageAdmin, 'case2-admin-drawer.png');

    const adminDriverWrapper = pageAdmin.locator('div.relative').filter({ has: pageAdmin.locator('label').filter({ hasText: /^Tài xế/ }) });
    const adminDriverInput = adminDriverWrapper.locator('button[role="combobox"]').first();
    
    // Verify driver combobox is enabled (not disabled) for Admin
    const isAdminDriverInputDisabled = await adminDriverInput.isDisabled();
    console.log('Is driver combobox disabled for admin?', isAdminDriverInputDisabled);
    if (isAdminDriverInputDisabled) {
      throw new Error('Driver field should be enabled/editable for Admin!');
    }

    // Close drawer
    await pageAdmin.locator('button[aria-label="Close"], button:has-text("Hủy"), button:has-text("Đóng")').first().click().catch(() => {});
    await sleep(1500);

    // ==========================================
    // CASE 3: DUPLICATE PAYROLL UNIQUE VALIDATION
    // ==========================================
    console.log('\n--- Case 3: Duplicate Payroll Validation ---');
    console.log('Navigating to Bảng lương...');
    await pageAdmin.goto(`${APP}/quan-ly-van-tai/bang-luong`, { waitUntil: 'networkidle' });
    await sleep(3500);

    // Fetch an existing payroll record from the database to replicate it
    const { data: existingPayrolls } = await db.from('vt_bang_luong').select('id_tai_xe, thang, nam').limit(1);
    if (!existingPayrolls || existingPayrolls.length === 0) {
      console.log('No existing payroll records found in database to test duplication.');
    } else {
      const target = existingPayrolls[0];
      // Get the driver name from var_nhan_vien
      const { data: targetEmp } = await db.from('var_nhan_vien').select('ho_va_ten').eq('id', target.id_tai_xe).single();
      console.log(`Replicating payroll for driver: ${targetEmp?.ho_va_ten} (Month: ${target.thang}, Year: ${target.nam})`);

      // Click Add
      await pageAdmin.locator('button:has-text("Thêm mới")').first().click();
      await sleep(2000);

      // Select driver
      const driverSelWrapper = pageAdmin.locator('div.relative').filter({ has: pageAdmin.locator('label').filter({ hasText: /^Tài xế/ }) });
      await driverSelWrapper.locator('button[role="combobox"]').first().click();
      await sleep(1000);
      await pageAdmin.locator(`[role="option"]:has-text("${targetEmp?.ho_va_ten}")`).first().click();
      await sleep(1000);

      // Fill month and year
      const mWrapper = pageAdmin.locator('div.space-y-1\\.5').filter({ has: pageAdmin.locator('label').filter({ hasText: /^Tháng/ }) });
      const mInput = mWrapper.locator('input').first();
      await mInput.fill(String(target.thang));

      const yWrapper = pageAdmin.locator('div.space-y-1\\.5').filter({ has: pageAdmin.locator('label').filter({ hasText: /^Năm/ }) });
      const yInput = yWrapper.locator('input').first();
      await yInput.fill(String(target.nam));

      // Click save
      await saveShot(pageAdmin, 'case3-payroll-before-save.png');
      console.log('Submitting duplicate payroll...');
      await pageAdmin.locator('button:has-text("Lưu"), button[type="submit"]').first().click();
      await sleep(2500);
      await saveShot(pageAdmin, 'case3-payroll-after-save.png');

      // Check for validation dialog/alert message
      const pageText = await pageAdmin.evaluate(() => document.body.innerText);
      if (!pageText.includes('đã tồn tại')) {
        throw new Error('Duplicate payroll was not blocked by validation!');
      }
      console.log('PASS: Duplicate payroll successfully blocked.');
      
      // Close drawer
      await pageAdmin.locator('button[aria-label="Close"], button:has-text("Hủy"), button:has-text("Đóng")').first().click().catch(() => {});
      await sleep(1500);
    }

    // ==========================================
    // CASE 4: DUPLICATE VEHICLE UNIQUE VALIDATION
    // ==========================================
    console.log('\n--- Case 4: Duplicate Vehicle Validation ---');
    console.log('Navigating to Danh sách xe...');
    await pageAdmin.goto(`${APP}/quan-ly-van-tai/danh-sach-xe`, { waitUntil: 'networkidle' });
    await sleep(3500);

    // Fetch an existing vehicle plate from the database
    const { data: existingVehicles } = await db.from('vt_xe').select('bien_so').limit(1);
    if (!existingVehicles || existingVehicles.length === 0) {
      console.log('No existing vehicles found in database to test duplication.');
    } else {
      const duplicatePlate = existingVehicles[0].bien_so;
      console.log(`Replicating vehicle plate: ${duplicatePlate}`);

      // Click Add
      await pageAdmin.locator('button:has-text("Thêm mới")').first().click();
      await sleep(2000);

      // Fill duplicate plate and required fields
      const hangWrapper = pageAdmin.locator('div.space-y-1\\.5').filter({ has: pageAdmin.locator('label').filter({ hasText: /^Hãng/ }) });
      await hangWrapper.locator('input').first().fill('TEST-HANG');

      const modelWrapper = pageAdmin.locator('div.space-y-1\\.5').filter({ has: pageAdmin.locator('label').filter({ hasText: /^Model/ }) });
      await modelWrapper.locator('input').first().fill('TEST-MODEL');

      const plateWrapper = pageAdmin.locator('div.space-y-1\\.5').filter({ has: pageAdmin.locator('label').filter({ hasText: /^Biển số/ }) });
      const plateInput = plateWrapper.locator('input').first();
      await plateInput.fill(duplicatePlate);

      // Click save
      await saveShot(pageAdmin, 'case4-vehicle-before-save.png');
      console.log('Submitting duplicate vehicle...');
      await pageAdmin.locator('button:has-text("Lưu"), button[type="submit"]').first().click();
      await sleep(2500);
      await saveShot(pageAdmin, 'case4-vehicle-after-save.png');

      // Check validation message
      const pageText = await pageAdmin.evaluate(() => document.body.innerText);
      if (!pageText.includes('đã tồn tại') && !pageText.toLowerCase().includes('duplicate')) {
        throw new Error('Duplicate vehicle plate was not blocked by validation!');
      }
      console.log('PASS: Duplicate vehicle plate successfully blocked.');

      // Close drawer
      await pageAdmin.locator('button[aria-label="Close"], button:has-text("Hủy"), button:has-text("Đóng")').first().click().catch(() => {});
      await sleep(1500);
    }

    // ==========================================
    // CASE 5: CASCADE APPROVAL & PAYROLL DRAWER BUTTONS
    // ==========================================
    console.log('\n--- Case 5: Cascade Approval & Payroll Buttons ---');
    console.log('Navigating to Bảng lương...');
    await pageAdmin.goto(`${APP}/quan-ly-van-tai/bang-luong`, { waitUntil: 'networkidle' });
    await sleep(3500);

    // Click first payroll row
    console.log('Opening first payroll drawer...');
    await pageAdmin.locator('tbody tr').first().locator('td').nth(1).click();
    await sleep(3000);
    await saveShot(pageAdmin, 'case5-payroll-drawer.png');

    // Verify presence of buttons
    const btnDuyet = pageAdmin.getByText('Quản lý duyệt').first();
    const btnChiTiet = pageAdmin.getByText('Chi tiết trong kỳ').first();
    const btnIn = pageAdmin.getByText('In bảng lương').first();

    const hasDuyet = await btnDuyet.isVisible();
    const hasChiTiet = await btnChiTiet.isVisible();
    const hasIn = await btnIn.isVisible();

    console.log(`Presence check: Quản lý duyệt: ${hasDuyet}, Chi tiết trong kỳ: ${hasChiTiet}, In: ${hasIn}`);
    if (!hasDuyet || !hasChiTiet || !hasIn) {
      throw new Error('One or more payroll drawer action buttons are missing!');
    }
    console.log('PASS: All required payroll buttons are present.');

    await ctxAdmin.close();
    await browser.close();
    console.log('\n=== ALL PLAYWRIGHT BUSINESS LOGIC VERIFICATION CASES PASSED SUCCESSFULLY ===');

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error.message);
    await browser.close().catch(() => {});
    process.exit(1);
  }
}

run();
