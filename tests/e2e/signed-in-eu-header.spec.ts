import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { test, expect, type Page } from '@playwright/test';

/*
 * Decisions #138, #139: the "EU header and product code" panel on a passport, against the local
 * backend. Read-only: it opens the form and cancels it. Uses the supplier's passport DPP-2026-1AC614.
 *   E2E_PORT=3000 npx playwright test signed-in-eu-header --project=desktop
 */
const envFile = path.join(__dirname, '../../.env.e2e.local');
const env: Record<string, string> = fs.existsSync(envFile)
  ? Object.fromEntries(
      fs
        .readFileSync(envFile, 'utf8')
        .split('\n')
        .filter((l) => l.includes('='))
        .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
    )
  : {};

test.skip(!env.E2E_PASSWORD || !env.E2E_SUPPLIER, 'no .env.e2e.local');
test.beforeAll(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop only'));
test.describe.configure({ mode: 'serial', timeout: 90_000 });

let page: Page;
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await quietLogins(context, env.E2E_RUN_SECRET);
  page = await context.newPage();
  await page.goto('/auth/sign-in');
  await page.getByPlaceholder('Enter your email').fill(env.E2E_SUPPLIER);
  await page.getByPlaceholder('Enter your password').fill(env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
});

test('the owner sees the EU header on a passport; the form warns that everything in it is public', async () => {
  await page.goto('/dashboard/passports');
  await page.getByPlaceholder(/Search/i).first().fill('DPP-2026-1AC614').catch(() => undefined);
  await page.getByText('DPP-2026-1AC614').first().click({ timeout: 30_000 });
  const panel = page.getByTestId('eu-header');
  await expect(panel).toBeVisible({ timeout: 30_000 });
  await panel.scrollIntoViewIfNeeded();
  await expect(panel).toContainText('This passport describes one batch');
  await panel.getByTestId('eu-header-edit').click();
  await expect(panel).toContainText('Everything you enter here is public');
  await expect(panel.locator('#eu-gtin')).toBeVisible();
  await panel.screenshot({ path: 'tests/e2e/.results/eu-header.png' });
  await panel.getByRole('button', { name: 'Cancel' }).click();
  await expect(panel.getByTestId('eu-header-save')).toHaveCount(0);
});
