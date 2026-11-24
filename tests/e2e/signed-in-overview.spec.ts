import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { test, expect, type Browser, type Page } from '@playwright/test';

/*
 * The overview (decisions #147 to #150), signed in against the local backend. Read-only: nothing is
 * created, no notice and no email. Each role sees its parts; "Waiting for you" matches GET /overview;
 * no part shows an error; the premium section is gone.
 */
const envFile = path.join(__dirname, '../../.env.e2e.local');
const env: Record<string, string> = fs.existsSync(envFile)
  ? Object.fromEntries(fs.readFileSync(envFile, 'utf8').split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }))
  : {};
test.describe.configure({ mode: 'serial', timeout: 150_000 });
test.skip(!env.E2E_PASSWORD || !env.E2E_SUPPLIER || !env.E2E_BUYER || !env.E2E_INSPECTOR, 'no .env.e2e.local');

const API = 'http://localhost:8081/api';

async function signIn(browser: Browser, email: string): Promise<Page> {
  const context = await browser.newContext({ baseURL: `http://localhost:${process.env.E2E_PORT ?? 3102}`, viewport: { width: 1280, height: 900 } });
  await quietLogins(context, env.E2E_RUN_SECRET);
  const page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') console.log(`[console] ${m.text().slice(0, 300)}`); });
  page.on('pageerror', (e) => console.log(`[pageerror] ${e.message.slice(0, 300)}`));
  await page.goto('/auth/sign-in');
  await page.getByPlaceholder('Enter your email').fill(email);
  await page.getByPlaceholder('Enter your password').fill(env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
  return page;
}
async function overview(page: Page) {
  const ac = await page.evaluate(() => localStorage.getItem('chimpstate'));
  const res = await page.request.get(`${API}/v1/overview`, { headers: { Authorization: `Bearer ${ac}`, 'x-e2e-run': env.E2E_RUN_SECRET } });
  expect(res.status()).toBe(200);
  return (await res.json()).data as { waitingForYou: { key: string; count: number }[]; recentTrades: unknown[] };
}

for (const [role, key] of [['supplier', 'E2E_SUPPLIER'], ['buyer', 'E2E_BUYER']] as const) {
  test(`${role}: every part of the overview, "waiting for you" as the API says, the premium strip (× hides it until reload)`, async ({ browser }) => {
    const page = await signIn(browser, env[key]);
    await page.goto('/dashboard');
    await expect(page.getByTestId('merchant-overview')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');
    for (const id of ['overview-quick-actions', 'overview-numbers', 'overview-waiting', 'overview-shipments']) await expect(page.getByTestId(id)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId(role === 'buyer' ? 'overview-received' : 'overview-stock')).toBeVisible();
    if (role === 'supplier') await expect(page.getByTestId('overview-passports')).toBeVisible();

    const data = await overview(page);
    const waiting = page.getByTestId('overview-waiting');
    const open = data.waitingForYou.filter((i) => i.count > 0);
    if (open.length) for (const i of open) await expect(waiting).toContainText(String(i.count));
    else await expect(waiting).toContainText('Nothing is waiting for you.');
    if (data.recentTrades.length) await expect(page.getByTestId('overview-recent')).toBeVisible();

    await expect(page.getByText('Become a premium User')).toHaveCount(0);
    // the premium strip: × hides it, a reload shows it again (owner, 2026-11-24)
    const strip = page.getByTestId('premium-strip');
    await expect(strip).toContainText('Premium is coming to MINMEG.');
    await strip.getByRole('button', { name: 'Hide for now' }).click();
    await expect(page.getByTestId('premium-strip')).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId('premium-strip')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('Something went wrong')).toHaveCount(0);
    await page.screenshot({ path: `tests/e2e/.results/overview-${role}.png`, fullPage: true });
  });
}

test('inspector: its own overview with jobs, this week and its services', async ({ browser }) => {
  const page = await signIn(browser, env.E2E_INSPECTOR);
  await page.goto('/dashboard');
  await expect(page.getByTestId('inspector-overview')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('inspector-numbers')).toBeVisible();
  await expect(page.getByText('Total Earnings')).toHaveCount(0);
  await page.screenshot({ path: 'tests/e2e/.results/overview-inspector.png', fullPage: true });
});
