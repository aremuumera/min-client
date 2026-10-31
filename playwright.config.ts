import { defineConfig, devices } from '@playwright/test';

/*
 * End-to-end tests at phone, tablet (both orientations) and desktop sizes
 * (docs/new/frontend/testing/frontend-testing.md §2). Runs against a local dev server.
 */
const PORT = Number(process.env.E2E_PORT ?? 3102);

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/e2e/.results',
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  webServer: { command: `npx next dev -p ${PORT}`, url: `http://localhost:${PORT}`, reuseExistingServer: true, timeout: 180_000 },
  projects: [
    { name: 'phone', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 }, hasTouch: true } },
    { name: 'tablet-landscape', use: { viewport: { width: 1024, height: 768 }, hasTouch: true } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
  ],
});
