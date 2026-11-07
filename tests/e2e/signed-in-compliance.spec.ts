import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { test, expect, type Locator, type Page, type APIRequestContext, type Browser } from '@playwright/test';

/*
 * Step 2.9c, signed in against the local backend: a published tin passport whose template answers an
 * active standard; the supplier checks it against that standard in the app; the result shows per
 * requirement and as self-checked; the buyer sees the same label in the trade room. The admin
 * compliance test confirms this check afterwards.
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
const STANDARD = `E2E origin rule ${RUN}`;
type Party = { headers: Record<string, string>; id: string };
let api: APIRequestContext;
let supplierPage: Page;
let trade = { id: '', room: '' };
let passport = { id: '', code: '' };

async function login(pathName: string, identifier: string): Promise<Party> {
  const res = await (await api.post(`${API}/v1/auth/${pathName}`, { headers: { 'x-e2e-run': env.E2E_RUN_SECRET }, data: { type: 'email', identifier, password: env.E2E_PASSWORD } })).json();
  const user = res.user ?? res.data?.user;
  return { headers: { Authorization: `Bearer ${res.ac ?? res.data?.ac}`, 'x-e2e-run': env.E2E_RUN_SECRET }, id: user?.id };
}
const staff = async () => (await login('aremu_check_admin_login', env.E2E_TEST_SUPER_ADMIN)).headers;
const key = () => ({ 'Idempotency-Key': crypto.randomUUID() });
const ok = async (res: Promise<import('@playwright/test').APIResponse>) => {
  const r = await res;
  expect(r.ok(), await r.text()).toBeTruthy();
  return (await r.json()).data;
};

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

async function choose(trigger: Locator, label: RegExp) {
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

  // An active standard with one public requirement, and a published template answering it
  const standard = await ok(api.post(`${API}/v1/passport-standards`, { headers: { ...admin, ...key() }, data: { code: `E2E_ORIGIN_${RUN}`, version: '1.0', name: STANDARD, standardType: 'BUYER_POLICY', issuer: 'E2E Buyer Ltd', jurisdiction: ['GLOBAL'] } }));
  const requirement = await ok(api.post(`${API}/v1/passport-standards/${standard.id}/properties`, { headers: { ...admin, ...key() }, data: { code: 'MINE_COUNTRY', key: 'origin.country', title: 'Country of the mine', dataType: 'STRING', required: true, visibilityRequirement: 'PUBLIC' } }));
  await ok(api.post(`${API}/v1/passport-standards/${standard.id}/activate`, { headers: admin }));
  const types = (await (await api.get(`${API}/v1/passport-types?limit=50`, { headers: admin })).json()).data as { id: string; code: string }[];
  const policies = (await (await api.get(`${API}/v1/visibility-policies?limit=50`, { headers: admin })).json()).data as { id: string; code: string }[];
  const template = await ok(api.post(`${API}/v1/passport-templates`, { headers: { ...admin, ...key() }, data: { passportTypeId: types.find((t) => t.code === 'BATCH_PASSPORT')!.id, code: `E2E_CMP_${RUN}`, name: `E2E compliance passport ${RUN}` } }));
  await ok(api.post(`${API}/v1/passport-templates/${template.id}/standards`, { headers: { ...admin, ...key() }, data: { standardId: standard.id, complianceMode: 'FULL' } }));
  const field = await ok(api.post(`${API}/v1/passport-templates/${template.id}/fields`, { headers: { ...admin, ...key() }, data: { key: 'origin.country', label: 'Country of the mine', dataType: 'STRING', required: true, visibilityPolicyId: policies.find((p) => p.code === 'PUBLIC')!.id } }));
  await ok(api.post(`${API}/v1/passport-template-fields/${field.id}/standard-properties`, { headers: { ...admin, ...key() }, data: { standardPropertyId: requirement.id, mappingType: 'DIRECT' } }));
  await ok(api.post(`${API}/v1/passport-templates/${template.id}/validate`, { headers: admin }));
  await ok(api.post(`${API}/v1/passport-templates/${template.id}/publish`, { headers: admin, data: { makeDefault: false } }));

  // A fresh tin batch, a trade on it, and the supplier's published passport
  const materials = (await (await api.get(`${API}/v1/materials?limit=100`, { headers: admin })).json()).data as { id: string; name: string; passportEligible: boolean }[];
  const units = (await (await api.get(`${API}/v1/measurement-units?limit=100`, { headers: admin })).json()).data as { id: string; code: string }[];
  const mt = units.find((u) => u.code === 'MT')!.id;
  const listing = await ok(api.post(`${API}/v1/listings`, { headers: { ...supplier.headers, ...key() }, data: { productName: `E2E tin ${RUN}`, productHeaderDescription: 'E2E cassiterite', realPrice: '900', unitCurrency: 'USD', materialId: materials.find((m) => m.passportEligible && m.name.startsWith('Tin'))!.id, unitId: mt, newBatch: { initialQuantity: '10', quantityUnitId: mt, sourceType: 'MINED' }, publish: true } }));
  const made = await api.post(`${API}/v1/trade/inquiries/create`, { headers: { ...buyer.headers, ...key() }, data: { product_id: listing.id, entity_type: 'product', mineral_tag: 'Tin', quantity: 2, measure_type: 't', delivery_location: 'Ikeja', delivery_state: 'Lagos', delivery_country: 'Nigeria', delivery_address: '1 Marina', timeline_type: 'immediate' } });
  expect(made.status(), await made.text()).toBe(201);
  const detail = (await (await api.get(`${API}/v1/trade/inquiries/${(await made.json()).data.reference}`, { headers: buyer.headers })).json()).data;
  trade = { id: detail.external_id, room: detail.firebase_room_id };
  await ok(api.post(`${API}/v1/trade/inquiry/${trade.id}/acknowledge`, { headers: supplier.headers }));
  await ok(api.put(`${API}/v1/admin/trade/inquiries/${trade.id}`, { headers: admin, data: { status: 'FINAL_TRADE_PACK_ACCEPTED', isAdminOverride: true, reason: 'E2E: test trade accepted' } }));
  const record = (await (await api.get(`${API}/v1/trades?productInquiryId=${trade.id}`, { headers: supplier.headers })).json()).data[0];
  const batchId = ((await (await api.get(`${API}/v1/trades/${record.id}/allocations`, { headers: supplier.headers })).json()).data as { status: string; batch: { id: string } }[]).find((a) => a.status === 'ACTIVE')!.batch.id;
  const created = await ok(api.post(`${API}/v1/certificates`, { headers: { ...supplier.headers, ...key() }, data: { certificateKind: 'PASSPORT', certificateType: 'BATCH_PASSPORT', subjectId: batchId, templateId: template.id } }));
  passport = { id: created.id, code: created.passportCode };
  const versionId = created.openVersion.id;
  await ok(api.put(`${API}/v1/passport-versions/${versionId}/fields/${field.id}`, { headers: supplier.headers, data: { value: 'NG', sourceType: 'USER' } }));
  await ok(api.post(`${API}/v1/certificates/${passport.id}/versions/${versionId}/validate`, { headers: supplier.headers }));
  await ok(api.post(`${API}/v1/certificates/${passport.id}/publish`, { headers: supplier.headers }));

  supplierPage = await signIn(browser, env.E2E_SUPPLIER);
});

test.afterAll(async () => {
  test.setTimeout(120_000);
  if (trade.id) await api.put(`${API}/v1/admin/trade/inquiries/${trade.id}`, { headers: await staff(), data: { status: 'REJECTED', isAdminOverride: true, reason: 'E2E: test finished' } });
  await api.dispose();
});

test('the supplier checks the passport against the standard: met, requirement by requirement, self-checked', async () => {
  const page = supplierPage;
  await page.goto('/dashboard/passports');
  await page.getByPlaceholder('Search by passport code').fill(passport.code);
  await page.getByRole('table').getByText(passport.code).click({ timeout: 60_000 });
  const sheet = page.getByRole('dialog').filter({ has: page.getByTestId(`passport-${passport.id}`) });
  const section = sheet.getByTestId('compliance-section');
  await expect(section.getByText('Not checked against any standard yet.')).toBeVisible({ timeout: 30_000 });
  await section.getByRole('button', { name: 'Check compliance' }).click();
  await choose(page.getByRole('combobox', { name: 'Check against' }), new RegExp(STANDARD));
  await page.getByRole('dialog').filter({ hasText: 'Check compliance' }).getByRole('button', { name: 'Check', exact: true }).click();
  await page.getByRole('dialog').filter({ hasText: 'Check this passport now?' }).getByRole('button', { name: 'Check', exact: true }).click();
  const result = section.locator('[data-testid^="assessment-"]').first();
  await expect(result.getByText('Meets the standard')).toBeVisible({ timeout: 30_000 });
  await expect(result.getByText('Self-checked by the company')).toBeVisible();
  await result.getByRole('button', { name: /Show each requirement/ }).click();
  await expect(result.getByRole('list', { name: 'Requirements' }).getByText('Country of the mine')).toBeVisible();
  await expect(result.getByRole('list', { name: 'Requirements' }).getByText('Met', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'tests/e2e/.results/compliance-supplier.png' });
});

test('the buyer sees the result in the trade room, labelled self-checked, never a general badge', async ({ browser }) => {
  const page = await signIn(browser, env.E2E_BUYER);
  await page.goto(`/dashboard/chat/product/${trade.room}/${trade.id}?tab=passports`);
  const section = page.getByTestId('trade-passports').getByTestId('compliance-section');
  const row = section.locator('[data-testid^="summary-"]').first();
  await expect(row.getByText(new RegExp(STANDARD))).toBeVisible({ timeout: 60_000 });
  await expect(row.getByText('Self-checked by the company')).toBeVisible();
  await expect(section.getByRole('button', { name: 'Check compliance' })).toHaveCount(0);
});
