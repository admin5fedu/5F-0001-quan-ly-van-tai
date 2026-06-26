import { defineConfig } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'https://tah-app.vercel.app';

export default defineConfig({
  testDir: 'output/playwright',
  timeout: 120_000,
  retries: 0,
  workers: 1,
  use: {
    baseURL,
    channel: 'chrome',
    headless: true,
    viewport: { width: 1366, height: 768 },
    trace: 'off',
  },
  projects: [
    {
      name: 'auth-setup',
      testMatch: /production-auth\.setup\.ts/,
    },
    {
      name: 'production-smoke',
      testMatch: /production-full-app-smoke\.spec\.ts/,
    },
    {
      name: 'production-e2e',
      testMatch: /production-(multi-role|transport-deep|business-coverage|permissions-matrix|trip-execution|admin-trip-lock-bypass|master-crud|chain-th-payroll|stats-th-duyet|transport-flow)\.spec\.ts/,
      dependencies: ['auth-setup'],
    },
    {
      name: 'live-permission',
      testMatch: /live-permission-verification\.spec\.ts/,
      dependencies: ['auth-setup'],
    },
  ],
});