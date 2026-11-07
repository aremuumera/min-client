import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { test, expect, type Locator, type Page, type APIRequestContext, type Browser } from '@playwright/test';

/*
 * Step 2.9b, signed in against the local backend: the supplier issues a passport on a fresh tin batch
 * (the batch code filled by MINMEG), fills a field, checks and publishes it; the buyer reads it in the
 * trade room with one owner-only field hidden; MINMEG suspends it and the buyer's view empties.
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
const TEMPLATE_NAME = `E2E tin passport ${RUN}`;
type Party = { headers: Record<string, string>; id: string };
let api: APIRequestContext;
let supplierPage: Page;
let trade = { id: '', room: '' };
let batch = { id: '', code: '' };
let passportId = '';

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

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(300_000);
  api = await playwright.request.newContext();
  const buyer = await login('umera/login', env.E2E_BUYER);
  const supplier = await login('umera/login', env.E2E_SUPPLIER);
  const admin = await staff();

  // A published batch passport template: batch code (filled by MINMEG), mine country (public), an owner-only note
  const types = (await (await api.get(`${API}/v1/passport-types?limit=50`, { headers: admin })).json()).data as { id: string; code: string }[];
  const policies = (await (await api.get(`${API}/v1/visibility-policies?limit=50`, { headers: admin })).json()).data as { id: string; code: string }[];
  const policy = (code: string) => policies.find((p) => p.code === code)!.id;
  const tpl = await api.post(`${API}/v1/passport-templates`, { headers: { ...admin, ...key() }, data: { passportTypeId: types.find((t) => t.code === 'BATCH_PASSPORT')!.id, code: `E2E_PP_${RUN}`, name: TEMPLATE_NAME } });
  expect(tpl.status(), await tpl.text()).toBe(201);
  const templateId = (await tpl.json()).data.id;
  for (const field of [
    { key: 'batchCode', label: 'Batch code', dataType: 'STRING', required: true, identifierBinding: 'BATCH_CODE', visibilityPolicyId: policy('PUBLIC'), order: 1 },
    { key: 'origin.country', label: 'Country of the mine', dataType: 'STRING', required: true, visibilityPolicyId: policy('PUBLIC'), validationRules: { pattern: '^[A-Z]{2}$' }, order: 2 },
    { key: 'internal.note', label: 'Internal note', dataType: 'STRING', visibilityPolicyId: policy('OWNER'), order: 3 },
  ]) {
    const added = await api.post(`${API}/v1/passport-templates/${templateId}/fields`, { headers: { ...admin, ...key() }, data: field });
    expect(added.status(), await added.text()).toBe(201);
  }
  expect((await api.post(`${API}/v1/passport-templates/${templateId}/validate`, { headers: admin })).ok()).toBeTruthy();
  const published = await api.post(`${API}/v1/passport-templates/${templateId}/publish`, { headers: admin, data: { makeDefault: false } });
  expect(published.ok(), await published.text()).toBeTruthy();

  // A fresh tin batch on a new listing, and a trade on it (a batch has one passport, so each run needs its own)
  const materials = (await (await api.get(`${API}/v1/materials?limit=100`, { headers: admin })).json()).data as { id: string; name: string; passportEligible: boolean }[];
  const tin = materials.find((m) => m.passportEligible && m.name.startsWith('Tin'))!;
  const units = (await (await api.get(`${API}/v1/measurement-units?limit=100`, { headers: admin })).json()).data as { id: string; code: string }[];
  const mt = units.find((u) => u.code === 'MT')!.id;
  const listing = await api.post(`${API}/v1/listings`, {
    headers: { ...supplier.headers, ...key() },
    data: { productName: `E2E tin ${RUN}`, productHeaderDescription: 'E2E cassiterite concentrate', realPrice: '900', unitCurrency: 'USD', materialId: tin.id, unitId: mt, newBatch: { initialQuantity: '10', quantityUnitId: mt, sourceType: 'MINED' }, publish: true },
  });
  expect(listing.status(), await listing.text()).toBe(201);
  const made = await api.post(`${API}/v1/trade/inquiries/create`, {
    headers: { ...buyer.headers, ...key() },
    data: { product_id: (await listing.json()).data.id, entity_type: 'product', mineral_tag: 'Tin', quantity: 2, measure_type: 't', delivery_location: 'Ikeja', delivery_state: 'Lagos', delivery_country: 'Nigeria', delivery_address: '1 Marina', timeline_type: 'immediate' },
  });
  expect(made.status(), await made.text()).toBe(201);
  const detail = (await (await api.get(`${API}/v1/trade/inquiries/${(await made.json()).data.reference}`, { headers: buyer.headers })).json()).data;
  trade = { id: detail.external_id, room: detail.firebase_room_id };
  expect((await api.post(`${API}/v1/trade/inquiry/${trade.id}/acknowledge`, { headers: supplier.headers })).ok()).toBeTruthy();
  const accepted = await api.put(`${API}/v1/admin/trade/inquiries/${trade.id}`, { headers: admin, data: { status: 'FINAL_TRADE_PACK_ACCEPTED', isAdminOverride: true, reason: 'E2E: test trade accepted' } });
  expect(accepted.ok(), await accepted.text()).toBeTruthy();
  const record = (await (await api.get(`${API}/v1/trades?productInquiryId=${trade.id}`, { headers: supplier.headers })).json()).data[0];
  const allocation = ((await (await api.get(`${API}/v1/trades/${record.id}/allocations`, { headers: supplier.headers })).json()).data as { status: string; batch: { id: string; batchCode: string } }[]).find((a) => a.status === 'ACTIVE')!;
  batch = { id: allocation.batch.id, code: allocation.batch.batchCode };

  supplierPage = await signIn(browser, env.E2E_SUPPLIER);
});

test.afterAll(async () => {
  test.setTimeout(120_000);
  if (trade.id) await api.put(`${API}/v1/admin/trade/inquiries/${trade.id}`, { headers: await staff(), data: { status: 'REJECTED', isAdminOverride: true, reason: 'E2E: test finished' } });
  await api.dispose();
});

test('the supplier issues the batch passport, fills it, checks it and publishes it', async () => {
  const page = supplierPage;
  await page.goto('/dashboard/batches');
  await page.getByPlaceholder('Search batch code').fill(batch.code);
  await page.getByText(batch.code, { exact: true }).first().click({ timeout: 60_000 });
  const sheet = page.getByRole('dialog').filter({ has: page.getByRole('tab', { name: 'Family' }) });
  await sheet.getByRole('tab', { name: 'Passport' }).click();
  await expect(sheet.getByText('This batch has no passport yet.')).toBeVisible({ timeout: 30_000 });
  await choose(page.getByRole('combobox', { name: 'Template' }), new RegExp(TEMPLATE_NAME));
  await sheet.getByRole('button', { name: 'Issue passport' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Issue a passport for this batch?' }).getByRole('button', { name: 'Issue', exact: true }).click();

  const editor = sheet.getByTestId('passport-editor');
  const code = editor.getByTestId('pfield-batchCode');
  await expect(code.getByText(batch.code)).toBeVisible({ timeout: 30_000 });
  await expect(code.getByText('Filled by MINMEG')).toBeVisible();

  // The check lists the missing required country
  await editor.getByRole('button', { name: 'Check' }).click();
  await expect(editor.getByText('The check found problems to fix')).toBeVisible({ timeout: 30_000 });

  const country = editor.getByTestId('pfield-origin.country');
  await country.getByRole('button', { name: 'Fill in' }).click();
  const form = page.getByRole('dialog').filter({ hasText: 'Country of the mine' }).last();
  await form.locator('#value-input').fill('Nigeria');
  await form.getByRole('button', { name: 'Save value' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Save Country of the mine?' }).getByRole('button', { name: 'Save', exact: true }).click();
  // the template allows only a two-letter code
  await expect(form.getByRole('alert')).toBeVisible({ timeout: 30_000 });
  await form.locator('#value-input').fill('NG');
  await form.getByRole('button', { name: 'Save value' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Save Country of the mine?' }).getByRole('button', { name: 'Save', exact: true }).click();
  await expect(country.getByText('NG', { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(country.getByText('Declared by the company')).toBeVisible();

  const note = editor.getByTestId('pfield-internal.note');
  await note.getByRole('button', { name: 'Fill in' }).click();
  const noteForm = page.getByRole('dialog').filter({ hasText: 'Internal note' }).last();
  await noteForm.locator('#value-input').fill('E2E: owner-only margin note');
  await noteForm.getByRole('button', { name: 'Save value' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Save Internal note?' }).getByRole('button', { name: 'Save', exact: true }).click();
  await expect(note.getByText('E2E: owner-only margin note')).toBeVisible({ timeout: 30_000 });

  await editor.getByRole('button', { name: 'Check' }).click();
  await expect(editor.getByText('Checked: ready to publish')).toBeVisible({ timeout: 30_000 });
  await editor.getByRole('button', { name: 'Publish' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Publish version 1?' }).getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(sheet.getByTestId('passport-published')).toBeVisible({ timeout: 30_000 });
  await expect(sheet.getByText('Published', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'tests/e2e/.results/passport-supplier-published.png' });
  passportId = ((await (await api.get(`${API}/v1/certificates?certificateKind=PASSPORT&subjectType=BATCH&subjectId=${batch.id}`, { headers: await staff() })).json()).data as { id: string }[])[0].id;
});

test('the buyer reads the published passport in the trade room: the owner-only field is hidden; a suspension empties it', async ({ browser }) => {
  const page = await signIn(browser, env.E2E_BUYER);
  await page.goto(`/dashboard/chat/product/${trade.room}/${trade.id}?tab=passports`);
  const tab = page.getByTestId('trade-passports');
  const published = tab.getByTestId('passport-published');
  await expect(published).toBeVisible({ timeout: 60_000 });
  await expect(published.getByTestId('pfield-origin.country').getByText('NG', { exact: true })).toBeVisible();
  await expect(published.getByTestId('pfield-origin.country').getByText('Declared by the company')).toBeVisible();
  await expect(published.getByTestId('pfield-internal.note')).toHaveCount(0);
  await expect(published.getByText('1 field not shared with you.')).toBeVisible();
  await expect(tab.getByRole('button', { name: 'New version' })).toHaveCount(0);
  await page.screenshot({ path: 'tests/e2e/.results/passport-buyer.png' });

  const suspended = await api.post(`${API}/v1/certificates/${passportId}/suspend`, { headers: await staff(), data: { reason: 'E2E: checking the mine country' } });
  expect(suspended.ok(), await suspended.text()).toBeTruthy();
  await page.reload();
  await expect(tab.getByText('MINMEG has suspended this passport, so its content is not shown.')).toBeVisible({ timeout: 60_000 });
  await expect(tab.getByTestId('passport-published')).toHaveCount(0);
  const reinstated = await api.post(`${API}/v1/certificates/${passportId}/reinstate`, { headers: await staff(), data: { reason: 'E2E: country confirmed' } });
  expect(reinstated.ok(), await reinstated.text()).toBeTruthy();
});
