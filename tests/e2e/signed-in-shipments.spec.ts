import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

/*
 * Step 2.7a, signed in against the local backend: a trade at Trade Accepted, a shipment planned by the
 * supplier from the trade room, what the buyer sees of it, dispatch waiting for the inspection, cancel.
 */
const envFile = path.join(__dirname, '../../.env.e2e.local');
const env: Record<string, string> = fs.existsSync(envFile)
  ? Object.fromEntries(fs.readFileSync(envFile, 'utf8').split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }))
  : {};
// Staff move the test trade to Trade Accepted; the staff test account lives in the admin app's settings file
const adminEnvFile = path.join(__dirname, '../../../minmeg-admin/.env.e2e.local');
if (!env.E2E_TEST_SUPER_ADMIN && fs.existsSync(adminEnvFile)) {
  const line = fs.readFileSync(adminEnvFile, 'utf8').split('\n').find((l) => l.startsWith('E2E_TEST_SUPER_ADMIN='));
  if (line) env.E2E_TEST_SUPER_ADMIN = line.slice(line.indexOf('=') + 1).trim();
}
test.describe.configure({ mode: 'serial', timeout: 150_000 });
test.skip(!env.E2E_PASSWORD || !env.E2E_BUYER || !env.E2E_SUPPLIER || !env.E2E_TEST_SUPER_ADMIN, 'no .env.e2e.local');

const API = 'http://localhost:8081/api';
type Party = { headers: Record<string, string>; id: string };
let api: APIRequestContext;
let buyerPage: Page;
let supplierPage: Page;
let trade = { id: '', room: '' };
let shipmentNumber = '';

async function login(pathName: string, identifier: string): Promise<Party> {
  const res = await (await api.post(`${API}/v1/auth/${pathName}`, { headers: { 'x-e2e-run': env.E2E_RUN_SECRET }, data: { type: 'email', identifier, password: env.E2E_PASSWORD } })).json();
  const user = res.user ?? res.data?.user;
  return { headers: { Authorization: `Bearer ${res.ac ?? res.data?.ac}`, 'x-e2e-run': env.E2E_RUN_SECRET }, id: user?.id };
}

async function signIn(browser: import('@playwright/test').Browser, email: string) {
  const context = await browser.newContext({ baseURL: `http://localhost:${process.env.E2E_PORT ?? 3102}`, viewport: { width: 1280, height: 800 } });
  await quietLogins(context, env.E2E_RUN_SECRET);
  const page = await context.newPage();
  await page.goto('/auth/sign-in');
  await page.getByPlaceholder('Enter your email').fill(email);
  await page.getByPlaceholder('Enter your password').fill(env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 45_000 });
  return page;
}

const staffHeaders = async () => (await login('aremu_check_admin_login', env.E2E_TEST_SUPER_ADMIN)).headers;

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(240_000);
  api = await playwright.request.newContext();
  const buyer = await login('umera/login', env.E2E_BUYER);
  const supplier = await login('umera/login', env.E2E_SUPPLIER);
  const live = (await (await api.get(`${API}/v1/listings?status=published&limit=100`, { headers: supplier.headers })).json()).data as { id: string; supplierId: string; listingKind: string }[];
  const mineral = live.find((l) => l.supplierId === supplier.id && l.listingKind === 'MINERAL');
  expect(mineral, 'the test supplier needs a live mineral listing').toBeTruthy();
  const made = await api.post(`${API}/v1/trade/inquiries/create`, {
    headers: { ...buyer.headers, 'Idempotency-Key': crypto.randomUUID() },
    data: { product_id: mineral!.id, entity_type: 'product', mineral_tag: 'Copper', quantity: 2, measure_type: 't', delivery_location: 'Ikeja', delivery_state: 'Lagos', delivery_country: 'Nigeria', delivery_address: '1 Marina', timeline_type: 'immediate' },
  });
  expect(made.status(), await made.text()).toBe(201);
  const ref = (await made.json()).data?.reference;
  const detail = (await (await api.get(`${API}/v1/trade/inquiries/${ref}`, { headers: buyer.headers })).json()).data;
  trade = { id: detail.external_id, room: detail.firebase_room_id };
  const ack = await api.post(`${API}/v1/trade/inquiry/${trade.id}/acknowledge`, { headers: supplier.headers });
  expect(ack.ok(), await ack.text()).toBeTruthy();
  const accepted = await api.put(`${API}/v1/admin/trade/inquiries/${trade.id}`, { headers: await staffHeaders(), data: { status: 'FINAL_TRADE_PACK_ACCEPTED', isAdminOverride: true, reason: 'E2E: test trade accepted' } });
  expect(accepted.ok(), await accepted.text()).toBeTruthy();
  supplierPage = await signIn(browser, env.E2E_SUPPLIER);
  buyerPage = await signIn(browser, env.E2E_BUYER);
});

test.afterAll(async () => {
  test.setTimeout(120_000);
  // Ends the test trade, which cancels its planned shipments and gives the committed stock back
  if (trade.id) await api.put(`${API}/v1/admin/trade/inquiries/${trade.id}`, { headers: await staffHeaders(), data: { status: 'REJECTED', isAdminOverride: true, reason: 'E2E: test finished' } });
  await api.dispose();
});

test('the supplier plans a shipment from the trade room: confirm, committed stock, vehicle details', async () => {
  const page = supplierPage;
  await page.goto(`/dashboard/chat/product/${trade.room}/${trade.id}?tab=shipments`);
  await page.getByRole('button', { name: 'Plan a shipment' }).click({ timeout: 60_000 });
  const sheet = page.getByRole('dialog').filter({ hasText: 'Plan a shipment' });
  await sheet.locator('input[id^="line-"]').first().fill('2');
  await sheet.locator('#shipment-carrier').fill('E2E Haulage Ltd');
  await sheet.locator('#vehicle-driverName').fill('E2E Driver');
  await sheet.locator('#vehicle-plateNumber').fill('LAG-123-XY');
  await page.screenshot({ path: 'tests/e2e/.results/shipments-plan.png' });
  await sheet.getByRole('button', { name: 'Plan shipment' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Plan this shipment?' }).getByRole('button', { name: 'Plan shipment' }).click();

  const detail = page.getByRole('dialog').filter({ hasText: /SHP-/ });
  await expect(detail.getByText('E2E Haulage Ltd')).toBeVisible({ timeout: 30_000 });
  await expect(detail.getByText(/E2E Driver/)).toBeVisible();
  shipmentNumber = (await detail.getByRole('heading').first().textContent())?.trim() ?? '';
  expect(shipmentNumber).toMatch(/^SHP-/);
  await page.screenshot({ path: 'tests/e2e/.results/shipments-detail-seller.png' });

  // Dispatch waits for the inspection; the supplier can't override
  await detail.getByRole('button', { name: 'Dispatch', exact: true }).click();
  const dispatch = page.getByRole('dialog').filter({ hasText: `Dispatch ${shipmentNumber}?` });
  await expect(dispatch.getByText(/Only MINMEG staff can dispatch/)).toBeVisible({ timeout: 30_000 });
  await expect(dispatch.getByRole('button', { name: 'Dispatch', exact: true })).toBeDisabled();
  await page.screenshot({ path: 'tests/e2e/.results/shipments-readiness.png' });
  await dispatch.getByRole('button', { name: 'Back' }).click();
});

test('the buyer sees status, quantity, material and destination, and no carrier, driver or origin', async () => {
  const page = buyerPage;
  await page.goto('/dashboard/shipments');
  await expect(page.getByRole('heading', { name: 'Shipments', level: 1 })).toBeVisible({ timeout: 45_000 });
  await page.getByPlaceholder('Shipment number').fill(shipmentNumber);
  const row = page.getByRole('row').filter({ hasText: shipmentNumber });
  await expect(row).toBeVisible({ timeout: 30_000 });
  await expect(row.getByText('You receive')).toBeVisible();
  await row.click();
  const detail = page.getByRole('dialog').filter({ hasText: shipmentNumber });
  await expect(detail.getByText(/Shipped 2/).first()).toBeVisible({ timeout: 30_000 });
  await expect(detail.getByText('E2E Haulage Ltd')).toHaveCount(0);
  await expect(detail.getByText(/E2E Driver|LAG-123-XY/)).toHaveCount(0);
  await expect(detail.getByRole('button', { name: 'Dispatch', exact: true })).toHaveCount(0);
  await expect(detail.getByRole('button', { name: 'Cancel shipment' })).toHaveCount(0);
  await page.screenshot({ path: 'tests/e2e/.results/shipments-detail-buyer.png' });
});

test('the supplier cancels with a reason from the Shipments page', async () => {
  const page = supplierPage;
  await page.goto('/dashboard/shipments');
  await page.getByPlaceholder('Shipment number').fill(shipmentNumber);
  await page.getByRole('row').filter({ hasText: shipmentNumber }).click({ timeout: 45_000 });
  const detail = page.getByRole('dialog').filter({ hasText: shipmentNumber });
  await detail.getByRole('button', { name: 'Cancel shipment' }).click({ timeout: 30_000 });
  const modal = page.getByRole('dialog').filter({ hasText: `Cancel ${shipmentNumber}?` });
  await expect(modal.getByRole('button', { name: 'Cancel shipment' })).toBeDisabled();
  await modal.locator('#shipment-action-text').fill('E2E: truck not available');
  await modal.getByRole('button', { name: 'Cancel shipment' }).click();
  await expect(detail.getByText('E2E: truck not available')).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: 'tests/e2e/.results/shipments-cancelled.png' });
});
