import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { test, expect, type Locator, type Page, type APIRequestContext } from '@playwright/test';

/*
 * Step 2.9e, signed in against the local backend: on a fresh tin batch's draft passport the supplier
 * fills two values at once (one fails the field's rule and is shown to fix), lists a material, adds an
 * extra detail, publishes, and reads the passport's history and linked records.
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
test.skip(!env.E2E_PASSWORD || !env.E2E_SUPPLIER || !env.E2E_TEST_SUPER_ADMIN, 'no .env.e2e.local');

const API = 'http://localhost:8081/api';
const RUN = Date.now().toString(36).toUpperCase();
let api: APIRequestContext;
let page: Page;
let passport = { id: '', code: '' };
let batchCode = '';
let tinName = '';

const key = () => ({ 'Idempotency-Key': crypto.randomUUID() });
async function login(pathName: string, identifier: string) {
  const res = await (await api.post(`${API}/v1/auth/${pathName}`, { headers: { 'x-e2e-run': env.E2E_RUN_SECRET }, data: { type: 'email', identifier, password: env.E2E_PASSWORD } })).json();
  return { Authorization: `Bearer ${res.ac ?? res.data?.ac}`, 'x-e2e-run': env.E2E_RUN_SECRET };
}

/** Our dropdown closes on any scroll: open it and choose, again if the page was still moving (never Escape: it closes the dialog) */
async function choose(trigger: Locator, label: string | RegExp) {
  const p = trigger.page();
  for (let i = 0; i < 6; i++) {
    await p.waitForTimeout(500);
    if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click();
    const option = p.locator('[data-select-list="true"]').last().getByRole('option', { name: label });
    if (await option.first().isVisible().catch(() => false)) {
      await option.first().dispatchEvent('mousedown');
      await p.waitForTimeout(300);
      if ((await trigger.getAttribute('aria-expanded')) !== 'true') return;
    }
  }
  throw new Error(`could not choose ${String(label)}`);
}

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(300_000);
  api = await playwright.request.newContext();
  const admin = await login('aremu_check_admin_login', env.E2E_TEST_SUPER_ADMIN);
  const supplier = await login('umera/login', env.E2E_SUPPLIER);

  // A published batch passport template with two typed fields; the grade must be a number from 0 to 100
  const types = (await (await api.get(`${API}/v1/passport-types?limit=50`, { headers: admin })).json()).data as { id: string; code: string }[];
  const policies = (await (await api.get(`${API}/v1/visibility-policies?limit=50`, { headers: admin })).json()).data as { id: string; code: string }[];
  const policy = (code: string) => policies.find((p) => p.code === code)!.id;
  const tpl = await api.post(`${API}/v1/passport-templates`, { headers: { ...admin, ...key() }, data: { passportTypeId: types.find((t) => t.code === 'BATCH_PASSPORT')!.id, code: `E2E_PX_${RUN}`, name: `E2E passport extras ${RUN}` } });
  expect(tpl.status(), await tpl.text()).toBe(201);
  const templateId = (await tpl.json()).data.id;
  for (const field of [
    { key: 'batchCode', label: 'Batch code', dataType: 'STRING', required: true, identifierBinding: 'BATCH_CODE', visibilityPolicyId: policy('PUBLIC'), order: 1 },
    { key: 'origin.country', label: 'Country of the mine', dataType: 'STRING', required: true, visibilityPolicyId: policy('PUBLIC'), validationRules: { pattern: '^[A-Z]{2}$' }, order: 2 },
    { key: 'grade.declared', label: 'Declared grade', dataType: 'NUMBER', visibilityPolicyId: policy('PUBLIC'), validationRules: { minimum: 0, maximum: 100 }, order: 3 },
  ]) {
    const added = await api.post(`${API}/v1/passport-templates/${templateId}/fields`, { headers: { ...admin, ...key() }, data: field });
    expect(added.status(), await added.text()).toBe(201);
  }
  expect((await api.post(`${API}/v1/passport-templates/${templateId}/validate`, { headers: admin })).ok()).toBeTruthy();
  const published = await api.post(`${API}/v1/passport-templates/${templateId}/publish`, { headers: admin, data: { makeDefault: false } });
  expect(published.ok(), await published.text()).toBeTruthy();

  // A fresh tin batch (a batch has one passport) and its draft passport on that template
  const materials = (await (await api.get(`${API}/v1/materials?limit=100`, { headers: admin })).json()).data as { id: string; name: string; passportEligible: boolean }[];
  const tin = materials.find((m) => m.passportEligible && m.name.startsWith('Tin'))!;
  tinName = tin.name;
  const units = (await (await api.get(`${API}/v1/measurement-units?limit=100`, { headers: admin })).json()).data as { id: string; code: string }[];
  const mt = units.find((u) => u.code === 'MT')!.id;
  const listing = await api.post(`${API}/v1/listings`, {
    headers: { ...supplier, ...key() },
    data: { productName: `E2E tin extras ${RUN}`, productHeaderDescription: 'E2E cassiterite concentrate', realPrice: '900', unitCurrency: 'USD', materialId: tin.id, unitId: mt, newBatch: { initialQuantity: '10', quantityUnitId: mt, sourceType: 'MINED' }, publish: true },
  });
  expect(listing.status(), await listing.text()).toBe(201);
  const l = (await listing.json()).data;
  const find = (o: unknown): string | undefined => {
    if (!o || typeof o !== 'object') return undefined;
    const r = o as Record<string, unknown>;
    if (typeof r.batchId === 'string') return r.batchId;
    for (const v of Object.values(r)) {
      const hit = find(v);
      if (hit) return hit;
    }
    return undefined;
  };
  const batchId = find(l);
  expect(batchId, JSON.stringify(l)).toBeTruthy();
  const made = await api.post(`${API}/v1/certificates`, { headers: { ...supplier, ...key() }, data: { certificateKind: 'PASSPORT', certificateType: 'BATCH_PASSPORT', subjectId: batchId, templateId } });
  expect(made.status(), await made.text()).toBe(201);
  const p = (await made.json()).data;
  passport = { id: p.id, code: p.passportCode };

  const context = await browser.newContext({ baseURL: `http://localhost:${process.env.E2E_PORT ?? 3102}`, viewport: { width: 1280, height: 900 } });
  await quietLogins(context, env.E2E_RUN_SECRET);
  page = await context.newPage();
  await page.goto('/auth/sign-in');
  await page.getByPlaceholder('Enter your email').fill(env.E2E_SUPPLIER);
  await page.getByPlaceholder('Enter your password').fill(env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
});

test.afterAll(async () => {
  await api.dispose();
});

async function openPassport() {
  await page.goto('/dashboard/passports');
  await page.getByPlaceholder('Search by passport code').fill(passport.code);
  await page.getByRole('table').getByText(passport.code).click({ timeout: 60_000 });
  return page.getByTestId(`passport-${passport.id}`);
}

test('fill several: the good value is saved, the one that breaks the rule is shown to fix', async () => {
  const detail = await openPassport();
  const editor = detail.getByTestId('passport-editor');
  batchCode = (await editor.getByTestId('pfield-batchCode').locator('p').nth(1).textContent({ timeout: 30_000 })) ?? '';
  await editor.getByRole('button', { name: 'Fill several' }).click();
  const form = page.getByRole('dialog').filter({ hasText: 'Fill several values' });
  await form.locator('#bulk-origin\\.country').fill('NG');
  await form.locator('#bulk-grade\\.declared').fill('120');
  await form.getByRole('button', { name: 'Save 2 values' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Save 2 values?' }).getByRole('button', { name: 'Save', exact: true }).click();
  await expect(form.getByText('1 saved; 1 need fixing.')).toBeVisible({ timeout: 30_000 });
  await form.locator('#bulk-grade\\.declared').fill('58.5');
  await form.getByRole('button', { name: 'Save 1 value' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Save 1 value?' }).getByRole('button', { name: 'Save', exact: true }).click();
  await expect(form).toHaveCount(0, { timeout: 30_000 });
  await expect(editor.getByTestId('pfield-origin.country').getByText('NG', { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(editor.getByTestId('pfield-grade.declared').getByText('58.5', { exact: true })).toBeVisible();
});

test('materials (the batch material is listed for you; replaced with a share) and an extra detail; then check and publish', async () => {
  const detail = page.getByTestId(`passport-${passport.id}`);
  const editor = detail.getByTestId('passport-editor');
  const listed = editor.getByRole('region', { name: 'Made of' }).getByRole('listitem');
  await expect(listed).toHaveCount(1, { timeout: 30_000 });
  await expect(listed.getByText('Primary', { exact: true })).toBeVisible();
  await listed.getByRole('button', { name: 'Remove' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Remove this material?' }).getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(editor.getByText('No materials listed.')).toBeVisible({ timeout: 30_000 });
  await editor.getByRole('button', { name: 'Add material' }).click();
  const form = page.getByRole('dialog').filter({ hasText: 'Add a material' });
  await choose(form.getByRole('combobox', { name: 'Material' }), new RegExp(tinName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  await form.locator('#pm-role').fill('primary');
  await form.locator('#pm-percentage').fill('100');
  await form.getByRole('button', { name: 'Add material' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Add this material?' }).getByRole('button', { name: 'Add', exact: true }).click();
  const made = editor.getByRole('region', { name: 'Made of' });
  await expect(made.getByText('Primary · 100 %')).toBeVisible({ timeout: 30_000 });

  await editor.getByRole('button', { name: 'Add details' }).click();
  const details = page.getByRole('dialog').filter({ hasText: 'Extra details' });
  await details.getByRole('button', { name: 'Add a detail' }).click();
  await details.locator('#md-key-0').fill('shipping.mark');
  await details.locator('#md-value-0').fill(`E2E-MARK-${RUN}`);
  await details.locator('#md-description-0').fill('Painted on each bag');
  await details.getByRole('button', { name: 'Save details' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Save the extra details?' }).getByRole('button', { name: 'Save', exact: true }).click();
  const entry = editor.getByTestId('pdetail-shipping.mark');
  await expect(entry.getByText(`E2E-MARK-${RUN}`)).toBeVisible({ timeout: 30_000 });
  await expect(entry.getByText('Visible to your company and MINMEG')).toBeVisible();

  await editor.getByRole('button', { name: 'Check' }).click();
  await expect(editor.getByText('Checked: ready to publish')).toBeVisible({ timeout: 30_000 });
  await editor.getByRole('button', { name: 'Publish' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Publish version 1?' }).getByRole('button', { name: 'Publish', exact: true }).click();
  const view = detail.getByTestId('passport-published');
  await expect(view).toBeVisible({ timeout: 30_000 });
  await expect(view.getByRole('region', { name: 'Made of' }).getByText('Primary · 100 %')).toBeVisible();
  await expect(view.getByTestId('pdetail-shipping.mark')).toBeVisible();
  await expect(view.getByText(/of 3 values verified/)).toBeVisible();
  await expect(view.getByRole('button', { name: 'Add material' })).toHaveCount(0);
});

test('history and linked records', async () => {
  const detail = page.getByTestId(`passport-${passport.id}`);
  await detail.getByRole('button', { name: 'Show history' }).click();
  const history = detail.getByTestId('record-history');
  await expect(history.getByText('Version 1').first()).toBeVisible({ timeout: 30_000 });
  await expect(history.locator('li')).not.toHaveCount(0);
  await detail.getByRole('button', { name: 'Show linked records' }).click();
  const links = detail.getByTestId('linked-records');
  await expect(links.getByText(`batch ${batchCode}`)).toBeVisible({ timeout: 30_000 });
  await history.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'tests/e2e/.results/passport-extras.png' });
});
