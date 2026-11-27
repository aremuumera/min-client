import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { pick } from './pick';
import { test, expect, type Page, type Locator } from '@playwright/test';

/*
 * The wallet before payments go live (every figure 0, nothing to add or withdraw), and the marketplace
 * filters (2026-11-27): a price range compared in one currency, countries sent as ISO codes, and the RFQ
 * status choices merchants may use. Needs the local backend on 8081.
 */
const envFile = path.join(__dirname, '../../.env.e2e.local');
const env: Record<string, string> = fs.existsSync(envFile)
  ? Object.fromEntries(fs.readFileSync(envFile, 'utf8').split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }))
  : {};
test.describe.configure({ mode: 'serial', timeout: 120_000 });
test.skip(!env.E2E_PASSWORD || !env.E2E_BUYER || !env.E2E_SUPPLIER, 'no .env.e2e.local');

// E2E_API: run against another local backend (e.g. a second copy with the workers off on 8082); the browser's calls are sent there too
const APP_API = 'http://localhost:8081/api';
const API = process.env.E2E_API ?? APP_API;
const stamp = Date.now().toString(36).toUpperCase();
const dollarName = `E2E Filter USD ${stamp}`;
const nairaName = `E2E Filter NGN ${stamp}`;
let page: Page;

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(180_000); // the dev server compiles its first pages
  const api = await playwright.request.newContext();
  const login = await (await api.post(`${API}/v1/auth/umera/login`, { headers: { 'x-e2e-run': env.E2E_RUN_SECRET }, data: { type: 'email', identifier: env.E2E_SUPPLIER, password: env.E2E_PASSWORD } })).json();
  const headers = { Authorization: `Bearer ${login.ac ?? login.data?.ac}`, 'x-e2e-run': env.E2E_RUN_SECRET };
  const materials = await (await api.get(`${API}/v1/materials?search=Gold%20Ore&active=true&limit=1`, { headers })).json();
  const units = await (await api.get(`${API}/v1/measurement-units?active=true&limit=100`, { headers })).json();
  const tonne = units.data.find((u: { code: string }) => u.code === 'MT').id;
  const listing = async (productName: string, realPrice: string, unitCurrency: string) => {
    const res = await api.post(`${API}/v1/listings`, {
      headers: { ...headers, 'Idempotency-Key': crypto.randomUUID() },
      data: { listingKind: 'MINERAL', materialId: materials.data[0].id, unitId: tonne, productName, productHeaderDescription: 'E2E filter check', realPrice, unitCurrency, minimumOrderQuantity: '1', deliveryPeriod: '14 days', selectedPayments: ['T/T'], selectedShipping: ['FOB'], shippingTermsDescribed: 'Loaded at Apapa', fulfillmentType: 'delivery', tradeScope: 'local', packaging: 'Bulk', newBatch: { initialQuantity: '5', quantityUnitId: tonne, sourceType: 'MINED' }, publish: true },
    });
    expect(res.status(), await res.text()).toBe(201);
  };
  await listing(dollarName, '850', 'USD');
  await listing(nairaName, '850', 'NGN');
  await api.dispose();

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await quietLogins(context, env.E2E_RUN_SECRET);
  if (API !== APP_API) {
    await context.route((url) => url.href.startsWith(APP_API), (route) =>
      route.continue({ url: route.request().url().replace(APP_API, API), headers: { ...route.request().headers(), 'x-e2e-run': env.E2E_RUN_SECRET } }),
    );
  }
  page = await context.newPage();
  await page.goto('/auth/sign-in');
  await page.waitForLoadState('networkidle'); // the form works once the page's scripts have loaded
  await page.getByPlaceholder('Enter your email').fill(env.E2E_BUYER);
  await page.getByPlaceholder('Enter your password').fill(env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 120_000 });
});

/** Opens the filter panel ("Filters"); its controls are the last visible copy (the phone-size copy stays off screen) */
async function openFilters() {
  const onScreen = await page.locator('input[aria-label="Search countries"]').evaluateAll((els) => els.some((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.x >= 0; }));
  if (!onScreen) await page.getByRole('button', { name: 'Filters', exact: true }).first().click();
  await page.waitForTimeout(500);
}
const ctl = (l: Locator) => l.filter({ visible: true }).last();

test('the wallet before payments go live: every figure 0, nothing to add or withdraw', async () => {
  await page.goto('/dashboard/wallet');
  await expect(page.getByText("Wallet payments aren't live yet")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Not live yet', { exact: true })).toBeVisible();
  await expect(page.getByText('₦0.00').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add money' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Withdraw' })).toBeDisabled();
  await page.getByRole('tab', { name: 'PIN & security' }).click();
  await expect(page.getByText('No PIN yet')).toBeVisible();
  await page.getByRole('tab', { name: 'Activity' }).click();
  await page.screenshot({ path: 'tests/e2e/.results/wallet-not-live.png' });
});

test('price: compared in the chosen currency; countries go as ISO codes', async () => {
  const sent: string[] = [];
  page.on('request', (r) => { if (r.url().includes('/products/all')) sent.push(decodeURIComponent(r.url())); });
  await page.goto('/dashboard/products/all-mineral-cp');
  // newest first: both new listings are on the first page
  await expect(page.getByText(dollarName).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(nairaName).first()).toBeVisible();

  await openFilters();
  await pick(ctl(page.getByLabel('Price currency')), 'USD');
  await ctl(page.getByLabel('Lowest price')).fill('800');
  await ctl(page.getByLabel('Highest price')).fill('5000');
  await ctl(page.getByRole('button', { name: 'Apply price' })).click();
  await expect(page.getByText(nairaName)).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByText(dollarName).first()).toBeVisible();
  expect(sent.some((u) => u.includes('currency=USD') && u.includes('minPrice=800'))).toBe(true);

  await openFilters();
  await ctl(page.getByLabel('Search countries')).fill('congo');
  await ctl(page.locator('label', { hasText: 'Congo - Kinshasa' }).locator('input')).check();
  await expect.poll(() => sent.some((u) => u.includes('country=CD'))).toBe(true);
  await page.screenshot({ path: 'tests/e2e/.results/market-filters.png' });
  await openFilters();
  await ctl(page.getByRole('button', { name: 'Clear filters' })).click();
});

test('RFQs: open for offers, closing within 7 days, or ended', async () => {
  const answers: { url: string; status: number }[] = [];
  page.on('response', (r) => { if (r.url().includes('/rfqs/all')) answers.push({ url: r.url(), status: r.status() }); });
  await page.goto('/dashboard/products/rfq-products');
  await openFilters();
  for (const label of ['Open for offers', 'Closing within 7 days', 'Ended']) await expect(ctl(page.getByText(label, { exact: true }))).toBeVisible();
  await ctl(page.locator('label', { hasText: 'Ended' }).locator('input')).check();
  await expect.poll(() => answers.find((a) => a.url.includes('status=ended'))?.status).toBe(200);
  await page.screenshot({ path: 'tests/e2e/.results/rfq-filters.png' });
});
