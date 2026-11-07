import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { quietLogins } from './quiet-login';
import { test, expect, type Locator, type Page, type APIRequestContext, type Browser } from '@playwright/test';

/*
 * Step 2.10b, signed in against the local backend: the supplier records its IRMA result for the company
 * as the scheme issued it (rating, a score, who issued it) with two indicators, one with its document,
 * and sends it with the verifier's report. A buyer with a live trade with the supplier reads it on the
 * ESG & carbon page, with the scheme and who issued it, and no MINMEG score.
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
test.skip(!env.E2E_PASSWORD || !env.E2E_BUYER || !env.E2E_SUPPLIER || !env.E2E_TEST_SUPER_ADMIN, 'no .env.e2e.local');

const API = 'http://localhost:8081/api';
const RUN = Date.now().toString(36).toUpperCase();
type Party = { headers: Record<string, string>; id: string };
let api: APIRequestContext;
let supplierPage: Page;
let supplier: Party;
let trade = { id: '', code: '' };
let reportName = '';
const FRAMEWORK = `E2E_IRMA_${RUN}`;

async function login(pathName: string, identifier: string): Promise<Party> {
  const res = await (await api.post(`${API}/v1/auth/${pathName}`, { headers: { 'x-e2e-run': env.E2E_RUN_SECRET }, data: { type: 'email', identifier, password: env.E2E_PASSWORD } })).json();
  const user = res.user ?? res.data?.user;
  return { headers: { Authorization: `Bearer ${res.ac ?? res.data?.ac}`, 'x-e2e-run': env.E2E_RUN_SECRET }, id: user?.id };
}
const staff = async () => (await login('aremu_check_admin_login', env.E2E_TEST_SUPER_ADMIN)).headers;
const key = () => ({ 'Idempotency-Key': crypto.randomUUID() });

async function signIn(browser: Browser, email: string) {
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

/** Our dropdown closes on any scroll: open it and choose, again if the page was still moving (never Escape: it closes the dialog) */
async function choose(trigger: Locator, label: string | RegExp) {
  const page = trigger.page();
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(500);
    if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click();
    const option = page.locator('[data-select-list="true"]').last().getByRole('option', { name: label });
    if (await option.first().isVisible().catch(() => false)) {
      await option.first().dispatchEvent('mousedown');
      await page.waitForTimeout(300);
      if ((await trigger.getAttribute('aria-expanded')) !== 'true') return;
    }
  }
  throw new Error(`could not choose ${String(label)}`);
}

/** A small text report uploaded into the supplier's documents */
async function uploadReport(owner: Party, name: string) {
  const bytes = Buffer.from(`Independent verification statement (E2E ${RUN}). ISO 14067:2018. Totals checked.\n`);
  const made = await api.post(`${API}/v1/storage/files/initiate-upload`, { headers: { ...owner.headers, ...key() }, data: { originalFilename: name, mimeType: 'text/plain', sizeBytes: bytes.length, fileClass: 'REPORT', folderId: null } });
  expect(made.status(), await made.text()).toBe(201);
  const fileId = (await made.json()).data.file.id;
  const done = await api.post(`${API}/v1/storage/files/${fileId}/complete-upload`, { headers: owner.headers, multipart: { file: { name, mimeType: 'text/plain', buffer: bytes }, checksum: createHash('sha256').update(bytes).digest('hex') } });
  expect(done.ok(), await done.text()).toBeTruthy();
  return fileId as string;
}

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(300_000);
  api = await playwright.request.newContext();
  const buyer = await login('umera/login', env.E2E_BUYER);
  supplier = await login('umera/login', env.E2E_SUPPLIER);
  const admin = await staff();

  // A live trade between the buyer and the supplier
  const materials = (await (await api.get(`${API}/v1/materials?limit=100`, { headers: admin })).json()).data as { id: string; name: string; passportEligible: boolean }[];
  const tin = materials.find((m) => m.passportEligible && m.name.startsWith('Tin'))!;
  const units = (await (await api.get(`${API}/v1/measurement-units?limit=100`, { headers: admin })).json()).data as { id: string; code: string }[];
  const mt = units.find((u) => u.code === 'MT')!.id;
  const listing = await api.post(`${API}/v1/listings`, {
    headers: { ...supplier.headers, ...key() },
    data: { productName: `E2E tin esg ${RUN}`, productHeaderDescription: 'E2E cassiterite concentrate', realPrice: '900', unitCurrency: 'USD', materialId: tin.id, unitId: mt, newBatch: { initialQuantity: '10', quantityUnitId: mt, sourceType: 'MINED' }, publish: true },
  });
  expect(listing.status(), await listing.text()).toBe(201);
  const made = await api.post(`${API}/v1/trade/inquiries/create`, {
    headers: { ...buyer.headers, ...key() },
    data: { product_id: (await listing.json()).data.id, entity_type: 'product', mineral_tag: 'Tin', quantity: 2, measure_type: 't', delivery_location: 'Ikeja', delivery_state: 'Lagos', delivery_country: 'Nigeria', delivery_address: '1 Marina', timeline_type: 'immediate' },
  });
  expect(made.status(), await made.text()).toBe(201);
  const detail = (await (await api.get(`${API}/v1/trade/inquiries/${(await made.json()).data.reference}`, { headers: buyer.headers })).json()).data;
  expect((await api.post(`${API}/v1/trade/inquiry/${detail.external_id}/acknowledge`, { headers: supplier.headers })).ok()).toBeTruthy();
  const accepted = await api.put(`${API}/v1/admin/trade/inquiries/${detail.external_id}`, { headers: admin, data: { status: 'FINAL_TRADE_PACK_ACCEPTED', isAdminOverride: true, reason: 'E2E: test trade accepted' } });
  expect(accepted.ok(), await accepted.text()).toBeTruthy();
  const record = (await (await api.get(`${API}/v1/trades?productInquiryId=${detail.external_id}`, { headers: supplier.headers })).json()).data[0];
  trade = { id: record.id, code: record.tradeCode };

  reportName = `E2E IRMA audit ${RUN}.txt`;
  await uploadReport(supplier, reportName);
  supplierPage = await signIn(browser, env.E2E_SUPPLIER);
});

test.afterAll(async () => {
  await api.dispose();
});

test('the supplier records its IRMA result as issued, with indicators, and sends it with the verifier’s report', async () => {
  const page = supplierPage;
  await page.goto('/dashboard/esg');
  await expect(page.getByRole('tab', { name: 'My ESG' })).toHaveAttribute('aria-selected', 'true', { timeout: 60_000 });
  await page.getByRole('button', { name: 'Record one for the company' }).click();
  const start = page.getByRole('dialog').filter({ hasText: 'Record an ESG result' }).last();
  await start.locator('#esg-framework').fill(FRAMEWORK);
  await start.locator('#esg-version').fill('1.0');
  await start.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('dialog').filter({ hasText: 'Start this ESG record?' }).getByRole('button', { name: 'Start', exact: true }).click();
  const detail = page.locator('[data-testid^="esg-"]').filter({ has: page.getByText(/^ESG-/) }).first();
  await expect(detail.getByText('The result is not recorded yet.')).toBeVisible({ timeout: 30_000 });

  // a social fact with its document
  await detail.getByRole('button', { name: 'Add indicator' }).click();
  let form = page.getByRole('dialog').filter({ hasText: 'Add an indicator' }).last();
  await choose(form.locator('#ei-pillar'), 'Social');
  await form.locator('#ei-code').fill('CDA_SIGNED');
  await form.locator('#ei-name').fill('Community development agreement signed');
  await choose(form.locator('#ei-type'), 'Yes or no');
  await choose(form.locator('#ei-value'), 'Yes');
  await form.getByText('This indicator needs a document', { exact: true }).click();
  await expect(form.getByText('This indicator needs its document.')).toBeVisible();
  await choose(form.locator('#ei-evidence'), reportName);
  await form.getByRole('button', { name: 'Add indicator' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Add Community development agreement signed?' }).getByRole('button', { name: 'Add', exact: true }).click();
  await expect(detail.getByTestId('esg-input-CDA_SIGNED').getByText('Yes', { exact: true })).toBeVisible({ timeout: 30_000 });

  // an environmental figure
  await detail.getByRole('button', { name: 'Add indicator' }).click();
  form = page.getByRole('dialog').filter({ hasText: 'Add an indicator' }).last();
  await form.locator('#ei-code').fill('WATER_RECYCLED_PCT');
  await form.locator('#ei-name').fill('Water recycled (%)');
  await form.locator('#ei-value').fill('62.5');
  await form.getByRole('button', { name: 'Add indicator' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Add Water recycled (%)?' }).getByRole('button', { name: 'Add', exact: true }).click();
  await expect(detail.getByTestId('esg-input-WATER_RECYCLED_PCT').getByText('62.5', { exact: true })).toBeVisible({ timeout: 30_000 });

  // the result exactly as IRMA issued it
  await detail.getByRole('button', { name: 'Record the result' }).click();
  const result = page.getByRole('dialog').filter({ hasText: 'Record the result' }).last();
  await result.locator('#er-issued').fill('IRMA (E2E audit firm)');
  await result.locator('#er-rating').fill('IRMA 50');
  await result.locator('#er-environmental').fill('72');
  await result.getByRole('button', { name: 'Record result' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Record this result?' }).getByRole('button', { name: 'Record', exact: true }).click();
  const box = detail.getByTestId('esg-result');
  await expect(box.getByText('IRMA 50')).toBeVisible({ timeout: 30_000 });
  await expect(box.getByText('Issued by IRMA (E2E audit firm)')).toBeVisible();
  await expect(box.getByText(/100 % of the indicators that need a document have one/)).toBeVisible();
  await expect(detail.locator('[data-trust="EVIDENCED"]')).toBeVisible();

  await detail.getByRole('button', { name: 'Send to MINMEG' }).click();
  const send = page.getByRole('dialog').filter({ hasText: 'Send to MINMEG' }).last();
  await send.locator('#cs-name').fill('E2E Assurance Ltd');
  await send.locator('#cs-standard').fill('IRMA assurance process');
  await choose(send.locator('#cs-file'), reportName);
  await send.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByRole('dialog').filter({ hasText: /^Send ESG-.* to MINMEG\?/ }).getByRole('button', { name: 'Send', exact: true }).click();
  await expect(detail.getByText('Waiting for MINMEG', { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(detail.locator('[data-trust="INDEPENDENTLY_VERIFIED"]')).toBeVisible();
  await page.screenshot({ path: 'tests/e2e/.results/esg-supplier.png' });
});

test('a buyer trading with the supplier reads it, with the scheme and who issued it, never a MINMEG score', async ({ browser }) => {
  const page = await signIn(browser, env.E2E_BUYER);
  await page.goto('/dashboard/esg');
  await page.getByRole('tab', { name: 'On my trades' }).click();
  await choose(page.getByRole('combobox', { name: 'Trade' }), new RegExp(trade.code));
  const section = page.getByTestId('trade-esg');
  const row = section.getByRole('button', { name: new RegExp(`${FRAMEWORK} 1.0`) });
  await expect(row).toBeVisible({ timeout: 30_000 });
  await expect(row.getByText(/IRMA 50 · issued by IRMA \(E2E audit firm\)/)).toBeVisible();
  await row.click();
  // the opened record sits right under its row
  const detail = row.locator('xpath=following-sibling::div[1]');
  await expect(detail.getByText('Declared by the supplier.', { exact: false })).toBeVisible({ timeout: 30_000 });
  await expect(detail.locator('[data-trust="INDEPENDENTLY_VERIFIED"]')).toBeVisible({ timeout: 30_000 });
  await expect(detail.getByText('MINMEG records the result as the scheme issued it. It does not score or rate the company.', { exact: false })).toBeVisible();
  await expect(detail.getByRole('button', { name: 'Add indicator' })).toHaveCount(0);
  await page.screenshot({ path: 'tests/e2e/.results/esg-buyer.png' });
});
