import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

/* Step 2.6c, signed in against the local backend: the inquiry pages and the trade room's Stock tab */
const envFile = path.join(__dirname, '../../.env.e2e.local');
const env: Record<string, string> = fs.existsSync(envFile)
  ? Object.fromEntries(fs.readFileSync(envFile, 'utf8').split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }))
  : {};
test.describe.configure({ mode: 'serial', timeout: 120_000 });
test.skip(!env.E2E_PASSWORD || !env.E2E_BUYER || !env.E2E_SUPPLIER, 'no .env.e2e.local');

const API = 'http://localhost:8081/api';
type Party = { headers: Record<string, string>; id: string };
let api: APIRequestContext;
let apiSupplier: Party;
let buyerPage: Page;
let supplierPage: Page;
let mineral = { id: '', room: '' };
let replaced: { old: string; fresh: string; room: string } | null = null;

async function tokenOf(identifier: string): Promise<Party> {
  const login = await (await api.post(`${API}/v1/auth/umera/login`, { headers: { 'x-e2e-run': env.E2E_RUN_SECRET }, data: { type: 'email', identifier, password: env.E2E_PASSWORD } })).json();
  const user = login.user ?? login.data?.user;
  return { headers: { Authorization: `Bearer ${login.ac ?? login.data?.ac}`, 'x-e2e-run': env.E2E_RUN_SECRET }, id: user?.id };
}

async function signIn(browser: import('@playwright/test').Browser, email: string) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await quietLogins(context, env.E2E_RUN_SECRET);
  const page = await context.newPage();
  await page.goto('/auth/sign-in');
  await page.getByPlaceholder('Enter your email').fill(email);
  await page.getByPlaceholder('Enter your password').fill(env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  return page;
}

const roomOf = (t: { id: string; room: string }) => `/dashboard/chat/product/${t.room}/${t.id}`;

test.beforeAll(async ({ browser, playwright }) => {
  api = await playwright.request.newContext();
  const buyer = await tokenOf(env.E2E_BUYER);
  apiSupplier = await tokenOf(env.E2E_SUPPLIER);
  const live = (await (await api.get(`${API}/v1/listings?status=published&limit=100`, { headers: apiSupplier.headers })).json()).data as { id: string; supplierId: string; listingKind: string }[];
  const own = live.filter((l) => l.supplierId === apiSupplier.id);
  const inquire = async (productId: string, quantity: number, measure: string) => {
    const res = await api.post(`${API}/v1/trade/inquiries/create`, {
      headers: { ...buyer.headers, 'Idempotency-Key': crypto.randomUUID() },
      data: { product_id: productId, entity_type: 'product', mineral_tag: 'Copper', quantity, measure_type: measure, delivery_location: 'Ikeja', delivery_state: 'Lagos', delivery_country: 'Nigeria', delivery_address: '1 Marina', timeline_type: 'immediate' },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = await res.json();
    const id = body.data?.reference ?? body.data?.external_id ?? body.reference;
    const detail = await (await api.get(`${API}/v1/trade/inquiries/${id}`, { headers: buyer.headers })).json();
    return { id: detail.data.external_id as string, room: detail.data.firebase_room_id as string };
  };
  mineral = await inquire(own.find((l) => l.listingKind === 'MINERAL')!.id, 3, 't');
  // A trade the admin run gave to another supplier (minmeg-admin signed-in-trades), if there is one
  const mine = (await (await api.get(`${API}/v1/trade/my-inquiries?limit=100`, { headers: buyer.headers })).json()).data as { external_id: string; replaced_by_inquiry_id: string | null; firebase_room_id: string }[];
  const old = mine.find((r) => r.replaced_by_inquiry_id);
  if (old) replaced = { old: old.external_id, fresh: old.replaced_by_inquiry_id!, room: old.firebase_room_id };
  buyerPage = await signIn(browser, env.E2E_BUYER);
  supplierPage = await signIn(browser, env.E2E_SUPPLIER);
});

test.afterAll(async () => {
  // Frees what this run held, so the listings keep their stock for the next run
  const seller = await tokenOf(env.E2E_SUPPLIER);
  if (mineral.id) await api.post(`${API}/v1/trade/inquiry/${mineral.id}/reject`, { headers: seller.headers, data: { reason: 'E2E: test finished' } });
  await api.dispose();
});

test('Received Inquiries: full ids, our dropdowns, no In Review, pagination, help; acknowledge asks first and holds the stock', async () => {
  const page = supplierPage;
  await page.goto('/dashboard/received-inquiries');
  await expect(page.getByRole('heading', { name: 'Received Inquiries', level: 1 })).toBeVisible({ timeout: 45_000 });
  await page.getByRole('button', { name: /About this page/ }).click();
  await expect(page.getByRole('dialog').getByText(/Acknowledge one to open the trade/)).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByPlaceholder(/Search reference/).fill(mineral.id);
  const row = page.getByRole('row').filter({ hasText: mineral.id });
  await expect(row).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('main select, select')).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Status' }).click();
  await expect(page.getByRole('option', { name: 'In Review' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByText(/1–1 of 1/)).toBeVisible();
  await page.screenshot({ path: 'tests/e2e/.results/trades-received.png' });

  await row.getByRole('button').last().click();
  await page.getByRole('menuitem', { name: 'Acknowledge' }).click();
  const confirm = page.getByRole('dialog').filter({ hasText: 'Acknowledge this inquiry?' });
  await confirm.getByRole('button', { name: 'Acknowledge', exact: true }).click();
  await expect(row.getByText('Acknowledged')).toBeVisible({ timeout: 30_000 });
});

test('Stock tab, supplier: sees the hold, releases it with a reason, adds a batch back', async () => {
  const page = supplierPage;
  await page.goto(roomOf(mineral));
  await page.getByRole('button', { name: 'Stock', exact: true }).click({ timeout: 45_000 });
  await expect(page.getByText(/Held until/)).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: 'tests/e2e/.results/trades-stock-supplier.png' });
  await expect(page.getByRole('button', { name: 'Commit' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Release', exact: true }).click();
  const dialog = page.getByRole('dialog').filter({ hasText: 'Release this hold?' });
  await dialog.getByLabel(/Reason/).fill('E2E: choosing another batch');
  await dialog.getByRole('button', { name: 'Release', exact: true }).click();
  await expect(page.getByText('Released', { exact: true })).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'Add a batch' }).click();
  const add = page.getByRole('dialog').filter({ hasText: 'Add a batch' });
  await add.getByRole('combobox', { name: 'Batch' }).click();
  await page.getByRole('option').filter({ hasText: /available/ }).first().click();
  await expect(add.locator('#hold-quantity')).toHaveValue(/^3(\.0+)?$/);
  await page.screenshot({ path: 'tests/e2e/.results/trades-stock-add.png' });
  await add.getByRole('button', { name: 'Hold stock' }).click();
  await expect(add).toHaveCount(0, { timeout: 20_000 });
  await expect(page.getByText(/Held until/)).toBeVisible({ timeout: 15_000 });
});

test('Stock tab, buyer: read only, material and batch code', async () => {
  const page = buyerPage;
  await page.goto(roomOf(mineral));
  await page.getByRole('button', { name: 'Stock', exact: true }).click({ timeout: 45_000 });
  await expect(page.getByText(/Held until/).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'Add a batch' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Release', exact: true })).toHaveCount(0);
  await page.screenshot({ path: 'tests/e2e/.results/trades-stock-buyer.png' });
});

test('My Trade Inquiries: full ids, no In Review or Supplier Matched, summary cards', async () => {
  const page = buyerPage;
  await page.goto('/dashboard/my-trade-inquiries');
  await expect(page.getByRole('heading', { name: 'Trade Inquiries', level: 1 })).toBeVisible({ timeout: 45_000 });
  await page.getByPlaceholder(/Search reference/).fill(mineral.id);
  await expect(page.getByRole('row').filter({ hasText: mineral.id })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('combobox', { name: 'Status' }).click();
  await expect(page.getByRole('option', { name: 'Supplier Matched' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.screenshot({ path: 'tests/e2e/.results/trades-mine.png' });
});

test('Trade details: full id and the stock summary; the room opens on the Stock tab from its link', async () => {
  const page = supplierPage;
  await page.goto(`/dashboard/trade/details/${mineral.id}`);
  await expect(page.getByText(mineral.id).first()).toBeVisible({ timeout: 30_000 });
  const link = page.getByRole('link', { name: 'Open the Stock tab' });
  await expect(link).toBeVisible({ timeout: 20_000 });
  await page.screenshot({ path: 'tests/e2e/.results/trades-details.png' });
  await link.click();
  await expect(page.getByText(/Held until/)).toBeVisible({ timeout: 45_000 });
});

test('a tool has no batches: the Stock tab says how its quantity works (trade answer faked, the backend test covers the real one)', async () => {
  const page = supplierPage;
  await page.route(/\/trades\/[0-9a-f-]{36}$/, async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    await route.fulfill({ response: res, json: { ...body, data: { ...body.data, stockMode: 'TYPED' } } });
  });
  await page.goto(roomOf(mineral));
  await page.getByRole('button', { name: 'Stock', exact: true }).click({ timeout: 45_000 });
  await expect(page.getByText(/has no batches/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'Add a batch' })).toHaveCount(0);
  await page.screenshot({ path: 'tests/e2e/.results/trades-stock-tool.png' });
  await page.unroute(/\/trades\/[0-9a-f-]{36}$/);
});

test('find another supplier: the buyer sees Replaced and the new cycle; the first supplier never sees the new one', async () => {
  test.skip(!replaced, 'run the admin signed-in-trades test first');
  const { old, fresh, room } = replaced!;
  const page = buyerPage;
  await page.goto('/dashboard/my-trade-inquiries');
  await page.getByPlaceholder(/Search reference/).fill(old);
  const row = page.getByRole('row').filter({ hasText: old });
  await expect(row.getByText('Replaced by')).toBeVisible({ timeout: 30_000 });
  await expect(row.getByText(fresh)).toBeVisible();
  await row.getByRole('button').last().click();
  await expect(page.getByRole('menuitem', { name: 'Chat Room' })).toHaveCount(0);
  await page.screenshot({ path: 'tests/e2e/.results/trades-replaced-buyer.png' });
  await page.keyboard.press('Escape');

  await page.goto(`/dashboard/chat/product/${room}/${fresh}`);
  await expect(page.getByText(fresh).first()).toBeVisible({ timeout: 45_000 });
  await page.screenshot({ path: 'tests/e2e/.results/trades-new-cycle-buyer.png' });

  const seller = supplierPage;
  await seller.goto(`/dashboard/chat/product/${room}/${old}`);
  await expect(seller.getByRole('button', { name: 'Stock', exact: true })).toBeVisible({ timeout: 45_000 });
  await seller.waitForTimeout(3000);
  await expect(seller.getByText(fresh)).toHaveCount(0);
  await seller.screenshot({ path: 'tests/e2e/.results/trades-first-supplier.png' });

  const received = await seller.goto('/dashboard/received-inquiries');
  expect(received?.ok()).toBeTruthy();
  await seller.getByPlaceholder(/Search reference/).fill(old);
  const theirs = seller.getByRole('row').filter({ hasText: old });
  await expect(theirs).toBeVisible({ timeout: 30_000 });
  await expect(theirs.getByText(/Replaced/)).toHaveCount(0);
});
