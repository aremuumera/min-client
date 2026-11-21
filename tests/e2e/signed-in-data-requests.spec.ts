import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { test, expect, type Page } from '@playwright/test';

/*
 * Decision #137: the owner's Data requests pages, against the local backend. Read-only: it opens the
 * approval and cancels it, so nothing is shared and no email is sent. Needs the request DR-E2ETEST2
 * (waiting for the owner) on one of the supplier's published passports, inserted directly in the local
 * database (passing one on through the admin app would email the owner).
 *   E2E_PORT=3000 npx playwright test signed-in-data-requests --project=desktop
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

test('menu, the list, one request with who asks and MINMEG\'s note, and approving asks first', async () => {
  await expect(page.getByText('Data requests', { exact: true }).first()).toBeVisible({ timeout: 30_000 });
  await page.goto('/dashboard/data-requests');
  await expect(page.getByRole('heading', { name: 'Data requests', level: 1 })).toBeVisible({ timeout: 30_000 });
  const row = page.getByText('DR-E2ETEST2').first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.click();
  await page.waitForURL(/\/dashboard\/data-requests\/[0-9a-f-]{36}/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Lagos Customs Authority (E2E) asks for more of');
  await expect(page.getByText('E2E: the authority is real; the purpose is clear.').first()).toBeVisible();
  await expect(page.getByTestId('data-request-history')).toContainText('MINMEG passed it to you');
  const decide = page.getByTestId('data-request-decide');
  await expect(decide.getByText('Partner data', { exact: true })).toBeVisible();
  await expect(decide.getByText('Partner and private data', { exact: true })).toBeVisible();
  // every field of the passport with its value and level; choosing the other option changes what is shared
  const preview = decide.getByTestId('data-request-preview');
  await expect(preview).toContainText('What they will get');
  await expect(preview.locator('li').first()).toBeVisible();
  await page.screenshot({ path: 'tests/e2e/.results/data-request-owner.png', fullPage: true });
  await decide.getByTestId('data-request-approve').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Share partner data with Lagos Customs Authority (E2E)?');
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId('data-request-approve')).toBeVisible(); // still waiting: nothing was shared
});
