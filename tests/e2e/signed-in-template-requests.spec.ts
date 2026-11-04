import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { test, expect, type Locator, type Page, type APIRequestContext } from '@playwright/test';

/*
 * Step 2.9a, signed in against the local backend: the supplier asks MINMEG for a passport template;
 * MINMEG asks a question; the supplier answers in the thread.
 */
const envFile = path.join(__dirname, '../../.env.e2e.local');
const env: Record<string, string> = fs.existsSync(envFile)
  ? Object.fromEntries(fs.readFileSync(envFile, 'utf8').split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }))
  : {};
const adminEnvFile = path.join(__dirname, '../../../minmeg-admin/.env.e2e.local');
if (!env.E2E_TEST_SUPER_ADMIN && fs.existsSync(adminEnvFile)) {
  const line = fs.readFileSync(adminEnvFile, 'utf8').split('\n').find((l) => l.startsWith('E2E_TEST_SUPER_ADMIN='));
  if (line) env.E2E_TEST_SUPER_ADMIN = line.slice(line.indexOf('=') + 1).trim();
}
test.describe.configure({ mode: 'serial', timeout: 180_000 });
test.skip(!env.E2E_PASSWORD || !env.E2E_SUPPLIER || !env.E2E_TEST_SUPER_ADMIN, 'no .env.e2e.local');

const API = 'http://localhost:8081/api';
const NAME = `E2E tin for EU buyers ${Date.now().toString(36)}`;
let api: APIRequestContext;
let page: Page;

async function staff() {
  const res = await (await api.post(`${API}/v1/auth/aremu_check_admin_login`, { headers: { 'x-e2e-run': env.E2E_RUN_SECRET }, data: { type: 'email', identifier: env.E2E_TEST_SUPER_ADMIN, password: env.E2E_PASSWORD } })).json();
  return { Authorization: `Bearer ${res.ac ?? res.data?.ac}`, 'x-e2e-run': env.E2E_RUN_SECRET };
}

/** Our dropdown closes on any scroll: open it and choose, again if the page was still moving (never Escape: it closes the dialog) */
async function choose(trigger: Locator, label: string) {
  for (let i = 0; i < 6; i++) {
    await trigger.page().waitForTimeout(500);
    if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click();
    const option = trigger.page().locator('[data-select-list="true"]').last().getByRole('option', { name: label, exact: true });
    if (await option.isVisible().catch(() => false)) {
      await option.dispatchEvent('mousedown');
      await trigger.page().waitForTimeout(300);
      if ((await trigger.textContent())?.includes(label)) return;
    }
  }
  throw new Error(`could not choose ${label}`);
}

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(240_000);
  api = await playwright.request.newContext();
  const context = await browser.newContext({ baseURL: `http://localhost:${process.env.E2E_PORT ?? 3102}`, viewport: { width: 1280, height: 900 } });
  await quietLogins(context, env.E2E_RUN_SECRET);
  page = await context.newPage();
  await page.goto('/auth/sign-in');
  await page.getByPlaceholder('Enter your email').fill(env.E2E_SUPPLIER);
  await page.getByPlaceholder('Enter your password').fill(env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
});

test.afterAll(async () => {
  await api.dispose();
});

test('the supplier asks MINMEG for a template', async () => {
  await page.goto('/dashboard/passports/requests');
  await page.getByRole('button', { name: 'New request' }).click({ timeout: 60_000 });
  const form = page.getByRole('dialog').filter({ hasText: 'Ask MINMEG for a template' });
  await form.locator('#req-name').fill(NAME);
  await choose(page.getByRole('combobox', { name: 'Kind of passport' }), 'Batch passport');
  await form.locator('#req-description').fill('E2E: our EU buyer asks for OECD data per batch of tin concentrate');
  await form.locator('#req-markets').fill('EU');
  await form.locator('#req-standards').fill('OECD due diligence');
  await form.getByRole('button', { name: 'Send request' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Send this request to MINMEG?' }).getByRole('button', { name: 'Send', exact: true }).click();
  const row = page.getByRole('table').getByRole('row').filter({ hasText: NAME });
  await expect(row).toBeVisible({ timeout: 30_000 });
  await expect(row.getByText('Submitted')).toBeVisible();
  await page.screenshot({ path: 'tests/e2e/.results/template-request-sent.png' });
});

test('MINMEG asks a question; the supplier answers in the thread', async () => {
  const headers = await staff();
  const mine = (await (await api.get(`${API}/v1/passport-template-requests?limit=50`, { headers })).json()).data as { id: string; name: string }[];
  const request = mine.find((r) => r.name === NAME)!;
  const asked = await api.post(`${API}/v1/passport-template-requests/${request.id}/request-information`, { headers, data: { message: 'E2E: which mine types do you cover?' } });
  expect(asked.ok(), await asked.text()).toBeTruthy();

  await page.reload();
  const row = page.getByRole('table').getByRole('row').filter({ hasText: NAME });
  await expect(row.getByText('MINMEG asked a question')).toBeVisible({ timeout: 30_000 });
  await row.click();
  const sheet = page.getByRole('dialog').filter({ hasText: NAME });
  await expect(sheet.getByText('E2E: which mine types do you cover?')).toBeVisible({ timeout: 30_000 });
  await sheet.getByRole('button', { name: 'Answer MINMEG' }).click();
  const answer = page.getByRole('dialog').filter({ hasText: 'Answer MINMEG?' });
  await answer.getByLabel('Your answer').fill('E2E: artisanal and small-scale tin mines');
  await answer.getByRole('button', { name: 'Send' }).click();
  await expect(sheet.getByText('E2E: artisanal and small-scale tin mines')).toBeVisible({ timeout: 30_000 });
  await expect(sheet.getByRole('button', { name: 'Answer MINMEG' })).toHaveCount(0);
});
