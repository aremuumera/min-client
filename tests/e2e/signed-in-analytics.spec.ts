import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { pick } from './pick';
import { test, expect, type Browser, type Page, type APIRequestContext } from '@playwright/test';

/*
 * Step 2.14a, signed in against the local backend. Read-only: nothing is created, no notice and
 * no email. Each role sees its own tabs; the numbers match the API for the same period; the
 * period, grouping and reading-type filters work; the inspector sees "My inspections".
 */
const envFile = path.join(__dirname, '../../.env.e2e.local');
const env: Record<string, string> = fs.existsSync(envFile)
  ? Object.fromEntries(fs.readFileSync(envFile, 'utf8').split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }))
  : {};
test.describe.configure({ mode: 'serial', timeout: 150_000 });
test.skip(!env.E2E_PASSWORD || !env.E2E_SUPPLIER || !env.E2E_BUYER || !env.E2E_INSPECTOR, 'no .env.e2e.local');

const API = 'http://localhost:8081/api';
let api: APIRequestContext;

// the browser's own session: a second login for the same account would end the browser's one
async function headers(page: Page) {
  const ac = await page.evaluate(() => localStorage.getItem('chimpstate'));
  return { Authorization: `Bearer ${ac}`, 'x-e2e-run': env.E2E_RUN_SECRET };
}
async function token(identifier: string) {
  const res = await (await api.post(`${API}/v1/auth/umera/login`, { headers: { 'x-e2e-run': env.E2E_RUN_SECRET }, data: { type: 'email', identifier, password: env.E2E_PASSWORD } })).json();
  return { Authorization: `Bearer ${res.ac ?? res.data?.ac}`, 'x-e2e-run': env.E2E_RUN_SECRET };
}
async function signIn(browser: Browser, email: string): Promise<Page> {
  const context = await browser.newContext({ baseURL: `http://localhost:${process.env.E2E_PORT ?? 3102}`, viewport: { width: 1280, height: 900 } });
  await quietLogins(context, env.E2E_RUN_SECRET);
  const page = await context.newPage();
  await page.goto('/auth/sign-in');
  await page.getByPlaceholder('Enter your email').fill(email);
  await page.getByPlaceholder('Enter your password').fill(env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
  return page;
}
const tile = (page: Page, label: string) => page.locator(`[data-tile="${label}"]`);
const count = (c: Record<string, number>) => Object.values(c).reduce((a, b) => a + b, 0);

test.beforeAll(async ({ playwright }) => {
  api = await playwright.request.newContext();
});
test.afterAll(async () => {
  await api.dispose();
});

test('supplier: all its tabs; the overview matches the API; each tab answers without errors', async ({ browser }) => {
  const page = await signIn(browser, env.E2E_SUPPLIER);
  const h = await headers(page);
  await page.goto('/dashboard/analytics');
  await expect(page.getByRole('heading', { name: 'Analytics', level: 1 })).toBeVisible({ timeout: 60_000 });
  const tabs = page.getByRole('tablist', { name: 'Analytics' });
  for (const name of ['Overview', 'Trade', 'Shipments', 'Stock', 'Quality', 'Passports and certificates', 'ESG and carbon', 'Alerts']) await expect(tabs.getByRole('tab', { name, exact: true })).toBeVisible();

  // numbers that don't depend on the period: listings on sale, published passports
  const trade = (await (await api.get(`${API}/v1/analytics/trade`, { headers: h })).json()).data;
  const certs = (await (await api.get(`${API}/v1/analytics/certificates`, { headers: h })).json()).data;
  await expect(tile(page, 'Listings on sale')).toContainText(String((trade.listings.byStatus.published ?? 0).toLocaleString()), { timeout: 30_000 });
  await expect(tile(page, 'Published passports')).toContainText(String((certs.passports.byStatus.PUBLISHED ?? 0).toLocaleString()));
  await expect(tile(page, 'Inquiries received')).toContainText(count(trade.inquiries.byStatus).toLocaleString());
  await expect(page.getByTestId('analytics-window')).toContainText('Showing');
  await page.screenshot({ path: 'tests/e2e/.results/analytics-supplier-overview.png', fullPage: true });

  for (const [name, id] of [['Trade', 'analytics-trade'], ['Shipments', 'analytics-shipments'], ['Stock', 'analytics-stock'], ['Quality', 'analytics-performance'], ['Passports and certificates', 'analytics-passports'], ['ESG and carbon', 'analytics-esg'], ['Alerts', 'analytics-alerts']]) {
    await tabs.getByRole('tab', { name, exact: true }).click();
    const section = page.getByTestId(id);
    await expect(section).toBeVisible({ timeout: 30_000 });
    await expect(section.locator('[data-tile]').first()).toBeVisible({ timeout: 30_000 });
    await expect(section.getByText('Something went wrong')).toHaveCount(0);
    if (id === 'analytics-esg') {
      await expect(section).toContainText('MINMEG does not rate');
      await page.screenshot({ path: 'tests/e2e/.results/analytics-supplier-esg.png', fullPage: true });
    }
  }
  await page.context().close();
});

test('supplier: the period, grouping, custom dates and reading type filter the numbers', async ({ browser }) => {
  const page = await signIn(browser, env.E2E_SUPPLIER);
  await page.goto('/dashboard/analytics');
  const filter = page.getByTestId('analytics-window');
  await expect(filter).toContainText('Showing', { timeout: 60_000 });
  await filter.getByLabel('Period').click();
  await page.getByRole('option', { name: 'Last 12 months' }).click();
  await filter.getByLabel('Group by').click();
  await page.getByRole('option', { name: 'By month' }).click();
  await page.getByRole('tablist', { name: 'Analytics' }).getByRole('tab', { name: 'Trade', exact: true }).click();
  const trade = page.getByTestId('analytics-trade');
  await trade.getByText('Show as a table').first().click();
  await expect(trade.locator('table').first()).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: 'tests/e2e/.results/analytics-supplier-12-months.png', fullPage: true });

  // a custom range that ends before it starts is refused, plainly
  await filter.getByLabel('Period').click();
  await page.getByRole('option', { name: 'Choose dates' }).click();
  await filter.getByLabel('From').fill('2026-10-20');
  await filter.getByLabel('To').fill('2026-10-01');
  await expect(page.getByText('The start date is after the end date.')).toBeVisible();
  await filter.getByLabel('To').fill('2026-10-31');
  await expect(filter).toContainText('Showing', { timeout: 30_000 });
  await expect(filter).toContainText('Oct 20, 2026 to Oct 31, 2026', { timeout: 30_000 });

  // one reading type: its values per period, or a plain "none"
  await page.getByRole('tablist', { name: 'Analytics' }).getByRole('tab', { name: 'Quality', exact: true }).click();
  const readings = page.getByTestId('analytics-readings');
  await expect(readings).toBeVisible({ timeout: 30_000 });
  await pick(readings.getByLabel('Reading type'), { index: 1 });
  await expect(readings.locator('table[aria-label$="per period"]').or(readings.getByText(/^No .* in this period\.$/))).toBeVisible({ timeout: 30_000 });
  await page.context().close();
});

test('buyer: buying tabs only; the team member sees its company’s numbers', async ({ browser }) => {
  const page = await signIn(browser, env.E2E_BUYER);
  await page.goto('/dashboard/analytics');
  const tabs = page.getByRole('tablist', { name: 'Analytics' });
  await expect(tabs.getByRole('tab', { name: 'Trade', exact: true })).toBeVisible({ timeout: 60_000 });
  for (const name of ['Stock', 'Quality', 'Passports and certificates']) await expect(tabs.getByRole('tab', { name, exact: true })).toHaveCount(0);
  const h = await headers(page);
  const trade = (await (await api.get(`${API}/v1/analytics/trade`, { headers: h })).json()).data;
  await expect(tile(page, 'Inquiries sent')).toContainText(count(trade.inquiries.byStatus).toLocaleString(), { timeout: 30_000 });
  await expect(tile(page, 'RFQs posted')).toBeVisible();
  await page.screenshot({ path: 'tests/e2e/.results/analytics-buyer.png', fullPage: true });
  await page.context().close();

  test.skip(!env.E2E_TEAM_MEMBER, 'no team member account');
  // the member signs in only once it has accepted its invitation; otherwise the login is refused
  const canSignIn = (await api.post(`${API}/v1/auth/umera/login`, { headers: { 'x-e2e-run': env.E2E_RUN_SECRET }, data: { type: 'email', identifier: env.E2E_TEAM_MEMBER, password: env.E2E_PASSWORD } })).ok();
  test.skip(!canSignIn, 'the team member has not accepted its invitation yet');
  const member = await signIn(browser, env.E2E_TEAM_MEMBER);
  await member.goto('/dashboard/analytics');
  const owner = (await (await api.get(`${API}/v1/analytics/trade`, { headers: await token(env.E2E_SUPPLIER) })).json()).data;
  await expect(tile(member, 'Listings on sale')).toContainText(String((owner.listings.byStatus.published ?? 0).toLocaleString()), { timeout: 60_000 });
  await member.context().close();
});

test('inspector: My inspections under the existing numbers, with its own period', async ({ browser }) => {
  const page = await signIn(browser, env.E2E_INSPECTOR);
  await page.goto('/dashboard/inspections/analytics');
  const mine = page.getByTestId('analytics-my-inspections');
  await expect(mine).toBeVisible({ timeout: 60_000 });
  const h = await headers(page);
  const d = (await (await api.get(`${API}/v1/analytics/inspections`, { headers: h })).json()).data;
  await expect(mine.locator('[data-tile="Inspections"]')).toContainText(count(d.assignments.byStatus).toLocaleString(), { timeout: 30_000 });
  await expect(page.getByText('Advanced historical audit logs arriving in next cycle.')).toHaveCount(0);
  await page.screenshot({ path: 'tests/e2e/.results/analytics-inspector.png', fullPage: true });
  await page.context().close();
});
