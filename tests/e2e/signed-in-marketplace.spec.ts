import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { test, expect, type Page } from '@playwright/test';

/* What a buyer sees on the marketplace, from a listing a supplier saved */
const envFile = path.join(__dirname, '../../.env.e2e.local');
const env: Record<string, string> = fs.existsSync(envFile)
  ? Object.fromEntries(fs.readFileSync(envFile, 'utf8').split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }))
  : {};
test.describe.configure({ mode: 'serial', timeout: 120_000 });
test.skip(!env.E2E_PASSWORD || !env.E2E_BUYER || !env.E2E_SUPPLIER, 'no .env.e2e.local');

const API = 'http://localhost:8081/api';
const stamp = Date.now().toString(36).toUpperCase();
const liveName = `E2E Market ${stamp}`;
const draftName = `E2E Market Draft ${stamp}`;
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==', 'base64');
let page: Page;
let liveId = '';
let draftId = '';

test.beforeAll(async ({ browser, playwright }) => {
  const api = await playwright.request.newContext();
  const login = await (await api.post(`${API}/v1/auth/umera/login`, { headers: { 'x-e2e-run': env.E2E_RUN_SECRET }, data: { type: 'email', identifier: env.E2E_SUPPLIER, password: env.E2E_PASSWORD } })).json();
  const user = login.user ?? login.data?.user;
  const supplierId = user?.id ?? user?.external_id;
  const headers = { Authorization: `Bearer ${login.ac ?? login.data?.ac}`, 'x-e2e-run': env.E2E_RUN_SECRET };
  const materials = await (await api.get(`${API}/v1/materials?search=Gold%20Ore&active=true&limit=1`, { headers })).json();
  const units = await (await api.get(`${API}/v1/measurement-units?active=true&limit=100`, { headers })).json();
  const tonne = units.data.find((u: { code: string }) => u.code === 'MT').id;
  const listing = async (productName: string, publish: boolean) => {
    const res = await api.post(`${API}/v1/listings`, {
      headers: { ...headers, 'Idempotency-Key': crypto.randomUUID() },
      data: { listingKind: 'MINERAL', materialId: materials.data[0].id, unitId: tonne, productName, productHeaderDescription: 'E2E marketplace check', realPrice: '1000', prevPrice: '1200', minimumOrderQuantity: '2', deliveryPeriod: '14 days', selectedPayments: ['T/T'], selectedShipping: ['FOB'], shippingTermsDescribed: 'Loaded at Apapa', fulfillmentType: 'delivery', tradeScope: 'local', packaging: 'Bulk', newBatch: { initialQuantity: '10.5', quantityUnitId: tonne, sourceType: 'MINED' }, publish },
    });
    expect(res.status(), await res.text()).toBe(201);
    return (await res.json()).data.id as string;
  };
  liveId = await listing(liveName, true);
  draftId = await listing(draftName, false);
  const add = (kind: string, field: string, name: string) => api.put(`${API}/suppliers/${supplierId}/products/${liveId}/media/${kind}`, { headers, multipart: { [field]: { name, mimeType: 'image/png', buffer: PNG } } });
  expect((await add('images', 'productImages', 'picture.png')).ok()).toBe(true);
  expect((await add('attachments', 'productAttachments', 'certificate.png')).ok()).toBe(true);
  await api.dispose();

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await quietLogins(context, env.E2E_RUN_SECRET);
  page = await context.newPage();
  await page.goto('/auth/sign-in');
  await page.getByPlaceholder('Enter your email').fill(env.E2E_BUYER);
  await page.getByPlaceholder('Enter your password').fill(env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
});

test('the list has live listings only, with M.O.Q and available apart, and no supplier pricing', async () => {
  const bodies: string[] = [];
  page.on('response', async (r) => {
    if (r.url().includes('/products/all') && r.ok()) bodies.push(await r.text().catch(() => ''));
  });
  await page.goto('/dashboard/products/all-mineral-cp');
  await expect(page.getByText(liveName).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(draftName)).toHaveCount(0);
  const card = page.locator('div').filter({ has: page.getByText(liveName, { exact: true }) }).filter({ hasText: 'M.O.Q:' }).last();
  await expect(card.getByText('M.O.Q:')).toBeVisible();
  await expect(card.getByText('2 t', { exact: true })).toBeVisible();
  await expect(card.getByText('10.5 t', { exact: true })).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tests/e2e/.results/market-list.png' });
  expect(bodies.length).toBeGreaterThan(0);
  for (const body of bodies) {
    expect(body).not.toContain('"real_price"');
    expect(body).not.toContain('"fee_breakdown"');
  }
});

test('a draft does not open for a buyer', async () => {
  const answer = page.waitForResponse((r) => r.url().includes(`/products/${draftId}/detail`), { timeout: 30_000 });
  await page.goto(`/dashboard/products/details/${draftId}/e2e`);
  expect((await answer).status()).toBe(404);
  await page.waitForTimeout(1000);
  await expect(page.getByText(draftName)).toHaveCount(0);
});

test('the product page: attachments only in their tab, the exact quantity, and the fields that were missing', async () => {
  const answer = page.waitForResponse((r) => r.url().includes(`/products/${liveId}/detail`), { timeout: 30_000 });
  await page.goto(`/dashboard/products/details/${liveId}/e2e`);
  const product = (await (await answer).json()).data;
  expect(product).not.toHaveProperty('real_price');
  expect(product.attachments).toHaveLength(1);
  const attachmentFile = (product.attachments[0].url as string).split('/').pop()!;
  await expect(page.getByRole('heading', { name: liveName })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('10.5 t').first()).toBeVisible();
  await page.waitForTimeout(1000);
  expect(await page.locator('img').evaluateAll((imgs, file) => imgs.filter((i) => (i as HTMLImageElement).src.includes(file as string) && (i as HTMLElement).checkVisibility()).length, attachmentFile)).toBe(0); // the hidden Attachments tab holds its own copy
  const details = page.getByRole('table').last();
  for (const text of ['Gold Ore', 'Delivery', 'FOB', 'Loaded at Apapa', 'T/T']) await expect(details.getByText(text, { exact: true })).toBeVisible();
  await page.screenshot({ path: 'tests/e2e/.results/market-detail.png', fullPage: true });
  await page.getByRole('button', { name: 'Attachments' }).first().click();
  await expect(page.getByText('Available Files')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(attachmentFile).first()).toBeVisible();
  await page.getByRole('button', { name: 'Location' }).first().click();
  await expect(page.getByText('Sold locally', { exact: true })).toBeVisible();
  await expect(page.getByText('Worldwide Freight')).toHaveCount(0);
});
