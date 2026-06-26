import fs from 'node:fs';
import path from 'node:path';
import { test as setup, expect } from '@playwright/test';
import { BASE_URL, ROLE_ACCOUNTS, login } from './helpers/production-e2e';

export const AUTH_DIR = path.join('output/playwright', '.auth');

setup('cache production auth per role', async ({ browser }) => {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  for (const account of ROLE_ACCOUNTS) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, account.username, account.password);
    await expect(page).not.toHaveURL(/\/dang-nhap/);
    await context.storageState({ path: path.join(AUTH_DIR, `${account.key}.json`) });
    await context.close();
  }
});