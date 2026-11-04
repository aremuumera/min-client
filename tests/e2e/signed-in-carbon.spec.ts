import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { quietLogins } from './quiet-login';
import { test, expect, type Locator, type Page, type APIRequestContext, type Browser } from '@playwright/test';

/*
 * Step 2.10a, signed in against the local backend: the supplier starts a carbon assessment on a fresh
 * tin batch (2 t held for the trade), adds its diesel with its own factor (DEFRA), calculates (2,144 kgCO2e,
 * 1,072 kgCO2e/t) and sends it with the verifier's report. The trade's buyer reads it on the ESG &
 * carbon page, labelled independently verified. Once MINMEG confirms it, the supplier's passport takes
 * the figure per tonne from it (a carbon value is never typed).
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
let batch = { id: '', code: '' };
let reportName = '';
let assessmentId = '';
let templateId = '';

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

  // A fresh tin batch (10 t) on a new listing, and a trade on it
  const materials = (await (await api.get(`${API}/v1/materials?limit=100`, { headers: admin })).json()).data as { id: string; name: string; passportEligible: boolean }[];
  const tin = materials.find((m) => m.passportEligible && m.name.startsWith('Tin'))!;
  const units = (await (await api.get(`${API}/v1/measurement-units?limit=100`, { headers: admin })).json()).data as { id: string; code: string }[];
  const mt = units.find((u) => u.code === 'MT')!.id;
  const listing = await api.post(`${API}/v1/listings`, {
    headers: { ...supplier.headers, ...key() },
    data: { productName: `E2E tin carbon ${RUN}`, productHeaderDescription: 'E2E cassiterite concentrate', realPrice: '900', unitCurrency: 'USD', materialId: tin.id, unitId: mt, newBatch: { initialQuantity: '10', quantityUnitId: mt, sourceType: 'MINED' }, publish: true },
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
  const allocation = ((await (await api.get(`${API}/v1/trades/${record.id}/allocations`, { headers: supplier.headers })).json()).data as { status: string; batch: { id: string; batchCode: string } }[]).find((a) => a.status === 'ACTIVE')!;
  batch = { id: allocation.batch.id, code: allocation.batch.batchCode };

  reportName = `E2E verification ${RUN}.txt`;
  await uploadReport(supplier, reportName);

  // A published batch passport template with a carbon field (kgCO2e per tonne)
  const types = (await (await api.get(`${API}/v1/passport-types?limit=50`, { headers: admin })).json()).data as { id: string; code: string }[];
  const policies = (await (await api.get(`${API}/v1/visibility-policies?limit=50`, { headers: admin })).json()).data as { id: string; code: string }[];
  const publicPolicy = policies.find((p) => p.code === 'PUBLIC')!.id;
  const tpl = await api.post(`${API}/v1/passport-templates`, { headers: { ...admin, ...key() }, data: { passportTypeId: types.find((t) => t.code === 'BATCH_PASSPORT')!.id, code: `E2E_CO2_${RUN}`, name: `E2E carbon passport ${RUN}` } });
  expect(tpl.status(), await tpl.text()).toBe(201);
  templateId = (await tpl.json()).data.id;
  for (const field of [
    { key: 'batchCode', label: 'Batch code', dataType: 'STRING', required: true, identifierBinding: 'BATCH_CODE', visibilityPolicyId: publicPolicy, order: 1 },
    { key: 'carbon.intensity', label: 'Carbon per tonne', dataType: 'NUMBER', unitId: units.find((u) => u.code === 'KG_CO2E_PER_T')!.id, visibilityPolicyId: publicPolicy, order: 2 },
  ]) {
    const added = await api.post(`${API}/v1/passport-templates/${templateId}/fields`, { headers: { ...admin, ...key() }, data: field });
    expect(added.status(), await added.text()).toBe(201);
  }
  expect((await api.post(`${API}/v1/passport-templates/${templateId}/validate`, { headers: admin })).ok()).toBeTruthy();
  expect((await api.post(`${API}/v1/passport-templates/${templateId}/publish`, { headers: admin, data: { makeDefault: false } })).ok()).toBeTruthy();

  supplierPage = await signIn(browser, env.E2E_SUPPLIER);
});

test.afterAll(async () => {
  test.setTimeout(120_000);
  await api.dispose();
});

test('the supplier declares the batch’s carbon with its own factor, calculates and sends it with the verifier’s report', async () => {
  const page = supplierPage;
  await page.goto('/dashboard/batches');
  await page.getByPlaceholder('Search batch code').fill(batch.code);
  await page.getByText(batch.code, { exact: true }).first().click({ timeout: 60_000 });
  const sheet = page.getByRole('dialog').filter({ has: page.getByRole('tab', { name: 'Family' }) });
  await sheet.getByRole('tab', { name: 'ESG & carbon' }).click();
  const panel = sheet.getByTestId(`carbon-for-${batch.id}`);
  await expect(panel.getByText('No carbon assessment yet.')).toBeVisible({ timeout: 30_000 });

  await panel.getByRole('button', { name: 'Start a carbon assessment' }).click();
  const start = page.getByRole('dialog').filter({ hasText: 'Start a carbon assessment' }).last();
  await start.locator('#co2-method').fill('GHG_PROTOCOL_PRODUCT');
  await start.locator('#co2-version').fill('2011');
  await start.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('dialog').filter({ hasText: 'Start this carbon assessment?' }).getByRole('button', { name: 'Start', exact: true }).click();
  const detail = panel.locator('[data-testid^="carbon-"]').filter({ has: page.getByText(/^CO2-/) }).first();
  await expect(detail.getByText('Declared', { exact: true })).toBeVisible({ timeout: 30_000 });
  assessmentId = ((await detail.getAttribute('data-testid')) ?? '').replace('carbon-', '');

  await detail.getByRole('button', { name: 'Add activity' }).click();
  const form = page.getByRole('dialog').filter({ hasText: 'Add an activity' }).last();
  await form.locator('#ci-name').fill('Diesel for haul trucks');
  await form.locator('#ci-value').fill('800');
  await choose(form.locator('#ci-unit'), /\(L\)$/);
  await form.locator('#ci-factor').fill('2.68');
  await choose(form.locator('#ci-factor-unit'), /\(kgCO2e\)$/);
  await form.locator('#ci-source').fill('DEFRA 2025');
  await choose(form.locator('#ci-scope'), /^Scope 1/);
  await form.getByRole('button', { name: 'Add activity' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Add Diesel for haul trucks?' }).getByRole('button', { name: 'Add', exact: true }).click();
  const input = detail.getByTestId('co2-input-Diesel for haul trucks');
  await expect(input.getByText('2,144 kgCO2e')).toBeVisible({ timeout: 30_000 });
  await expect(input.getByText(/from DEFRA 2025/)).toBeVisible();

  await detail.getByRole('button', { name: 'Calculate' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Calculate the result?' }).getByRole('button', { name: 'Calculate', exact: true }).click();
  const result = detail.getByRole('definition').filter({ hasText: '2,144 kgCO2e' });
  await expect(result).toBeVisible({ timeout: 30_000 });
  await expect(detail.getByText('1,072 kgCO2e/t')).toBeVisible();
  await expect(detail.getByRole('button', { name: 'Add activity' })).toHaveCount(0);

  await detail.getByRole('button', { name: 'Send to MINMEG' }).click();
  const send = page.getByRole('dialog').filter({ hasText: 'Send to MINMEG' }).last();
  await send.locator('#cs-name').fill('E2E Verifiers Ltd');
  await send.locator('#cs-standard').fill('ISO 14067:2018');
  await choose(send.locator('#cs-file'), reportName);
  await send.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByRole('dialog').filter({ hasText: /^Send CO2-.* to MINMEG\?/ }).getByRole('button', { name: 'Send', exact: true }).click();
  await expect(detail.getByText('Waiting for MINMEG', { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(detail.locator('[data-trust="INDEPENDENTLY_VERIFIED"]')).toBeVisible();
  await page.screenshot({ path: 'tests/e2e/.results/carbon-supplier.png' });
});

test('the trade’s buyer reads it on the ESG & carbon page, as the supplier’s figures, independently verified', async ({ browser }) => {
  const page = await signIn(browser, env.E2E_BUYER);
  await page.goto('/dashboard/esg');
  await page.getByRole('tab', { name: 'On my trades' }).click();
  await choose(page.getByRole('combobox', { name: 'Trade' }), new RegExp(trade.code));
  const section = page.getByTestId('trade-carbon');
  const row = section.getByRole('button', { name: /GHG_PROTOCOL_PRODUCT 2011/ });
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.click();
  const detail = section.getByTestId(`carbon-${assessmentId}`);
  await expect(detail.getByText('Declared by the supplier.', { exact: false })).toBeVisible({ timeout: 30_000 });
  await expect(detail.locator('[data-trust="INDEPENDENTLY_VERIFIED"]')).toBeVisible();
  await expect(detail.getByText(/from DEFRA 2025/)).toBeVisible();
  await expect(detail.getByRole('button', { name: 'Add activity' })).toHaveCount(0);
  await expect(detail.getByRole('button', { name: 'Withdraw' })).toHaveCount(0);
  await page.screenshot({ path: 'tests/e2e/.results/carbon-buyer.png' });
});

test('once MINMEG confirms it, the passport takes the figure per tonne from it', async () => {
  const confirmed = await api.post(`${API}/v1/carbon-assessments/${assessmentId}/verify`, { headers: await staff(), data: { decision: 'CONFIRM', notes: 'E2E: report matches the total' } });
  expect(confirmed.ok(), await confirmed.text()).toBeTruthy();
  const made = await api.post(`${API}/v1/certificates`, { headers: { ...supplier.headers, ...key() }, data: { certificateKind: 'PASSPORT', certificateType: 'BATCH_PASSPORT', subjectId: batch.id, templateId } });
  expect(made.status(), await made.text()).toBe(201);

  const page = supplierPage;
  await page.reload();
  await page.getByText(batch.code, { exact: true }).first().click({ timeout: 60_000 });
  const sheet = page.getByRole('dialog').filter({ has: page.getByRole('tab', { name: 'Family' }) });
  await sheet.getByRole('tab', { name: 'ESG & carbon' }).click();
  await expect(sheet.locator('[data-trust="CONFIRMED_BY_MINMEG"]').first()).toBeVisible({ timeout: 30_000 });

  await sheet.getByRole('tab', { name: 'Passport' }).click();
  const field = sheet.getByTestId('passport-editor').getByTestId('pfield-carbon.intensity');
  await field.getByRole('button', { name: 'Fill in' }).click({ timeout: 30_000 });
  const form = page.getByRole('dialog').filter({ hasText: 'Carbon per tonne' }).last();
  await choose(form.locator('#value-source'), 'From a carbon assessment MINMEG confirmed');
  await choose(form.locator('#value-carbon'), /^CO2-/);
  await form.getByRole('button', { name: 'Save value' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Save Carbon per tonne?' }).getByRole('button', { name: 'Save', exact: true }).click();
  await expect(field.getByText('1072', { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(field.getByText('Verified', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'tests/e2e/.results/carbon-passport.png' });
});
