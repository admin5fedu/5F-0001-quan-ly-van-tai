import { chromium } from '@playwright/test';
import path from 'node:path';

const userDataDir = path.resolve('.playwright-auth/google');
const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  viewport: { width: 1366, height: 768 },
});

const page = context.pages()[0] ?? await context.newPage();
await page.goto('https://accounts.google.com/', { waitUntil: 'domcontentloaded' });

console.log(`Google auth browser opened with profile: ${userDataDir}`);
console.log('Close this terminal process only after Sheets access has been verified.');

await new Promise(() => {});
