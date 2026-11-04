import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { test, expect, type Locator, type Page, type APIRequestContext, type Browser } from '@playwright/test';

/*
 * Step 2.8b, signed in against the local backend: the supplier declares a reading and records an event on
 * its batch (shown as declared / waiting for a check); the inspector assigned to the trade checks both in
 * the workbench, and the inspector's own reading waits for someone else's check.
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
test.skip(!env.E2E_PASSWORD || !env.E2E_BUYER || !env.E2E_SUPPLIER || !env.E2E_INSPECTOR || !env.E2E_TEST_SUPER_ADMIN, 'no .env.e2e.local');

const API = 'http://localhost:8081/api';
const TYPE_CODE = 'E2E_SITE_CHECK';
// Values unique to this run: the test batch keeps the readings of earlier runs
// One decimal, never ending in 0 (the screen shows 4.5, not 4.50), within 0 to 100
const oneDecimal = (n: number) => `${1 + (n % 97)}.${1 + (Math.floor(n / 97) % 9)}`;
const SUPPLIER_VALUE = oneDecimal(Date.now());
const INSPECTOR_VALUE = oneDecimal(Date.now() + 7);
const BAGS = String(100 + (Date.now() % 800));
type Party = { headers: Record<string, string>; id: string };
let api: APIRequestContext;
let supplierPage: Page;
let inspectorPage: Page;
let trade = { id: '', room: '' };
let assignmentId = '';
let batch = { id: '', code: '' };
let measure = { type: '', unit: '' };

async function login(pathName: string, identifier: string): Promise<Party> {
  const res = await (await api.post(`${API}/v1/auth/${pathName}`, { headers: { 'x-e2e-run': env.E2E_RUN_SECRET }, data: { type: 'email', identifier, password: env.E2E_PASSWORD } })).json();
  const user = res.user ?? res.data?.user;
  return { headers: { Authorization: `Bearer ${res.ac ?? res.data?.ac}`, 'x-e2e-run': env.E2E_RUN_SECRET }, id: user?.id };
}
const staff = async () => (await login('aremu_check_admin_login', env.E2E_TEST_SUPER_ADMIN)).headers;

async function signIn(browser: Browser, email: string, phone = false) {
  const context = await browser.newContext({ baseURL: `http://localhost:${process.env.E2E_PORT ?? 3102}`, viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 900 } });
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
async function choose(trigger: Locator, label: string) {
  const page = trigger.page();
  let seen: string[] = [];
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(600);
    if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click();
    const list = page.locator('[data-select-list="true"]').last();
    const option = list.getByRole('option', { name: label, exact: true });
    if (await option.isVisible().catch(() => false)) {
      await option.dispatchEvent('mousedown');
      await page.waitForTimeout(300);
      if ((await trigger.textContent())?.includes(label)) return;
    } else if (await list.isVisible().catch(() => false)) {
      seen = await list.getByRole('option').allTextContents();
    }
  }
  throw new Error(`could not choose ${label}; options: ${seen.join(' | ')}`);
}

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(300_000);
  api = await playwright.request.newContext();
  const buyer = await login('umera/login', env.E2E_BUYER);
  const supplier = await login('umera/login', env.E2E_SUPPLIER);
  const inspector = await login('umera/login', env.E2E_INSPECTOR);
  const admin = await staff();

  // An event type the company and the inspector may record, kept between runs
  const types = (await (await api.get(`${API}/v1/event-types?search=${TYPE_CODE}&limit=100`, { headers: admin })).json()).data as { code: string }[];
  if (!types.some((t) => t.code === TYPE_CODE)) {
    const cats = (await (await api.get(`${API}/v1/event-categories?search=E2E_CHECKS&limit=100`, { headers: admin })).json()).data as { id: string; code: string }[];
    let categoryId = cats.find((c) => c.code === 'E2E_CHECKS')?.id;
    if (!categoryId) {
      const made = await api.post(`${API}/v1/event-categories`, { headers: { ...admin, 'Idempotency-Key': crypto.randomUUID() }, data: { code: 'E2E_CHECKS', name: 'E2E checks' } });
      expect(made.status(), await made.text()).toBe(201);
      categoryId = (await made.json()).data.id;
    }
    const made = await api.post(`${API}/v1/event-types`, {
      headers: { ...admin, 'Idempotency-Key': crypto.randomUUID() },
      data: {
        categoryId, code: TYPE_CODE, name: 'E2E site check', subjectType: 'BATCH', recordableBy: ['OWNER', 'INSPECTOR', 'STAFF'], requiresVerification: true,
        metadataSchema: { fields: [{ key: 'bagsSampled', label: 'Bags sampled', type: 'integer', required: true }, { key: 'method', label: 'Method', type: 'enum', values: ['PROBE', 'OVEN_DRY'] }] },
      },
    });
    expect(made.status(), await made.text()).toBe(201);
  }
  // A measurement measured in %
  const units = (await (await api.get(`${API}/v1/measurement-units?active=true&limit=100`, { headers: admin })).json()).data as { name: string; symbol: string; measurementTypeId: string }[];
  const percent = units.find((u) => u.symbol === '%')!;
  const mtypes = (await (await api.get(`${API}/v1/measurement-types?active=true&limit=100`, { headers: admin })).json()).data as { id: string; name: string }[];
  measure = { type: mtypes.find((t) => t.id === percent.measurementTypeId)!.name, unit: `${percent.name} (%)` };

  const live = (await (await api.get(`${API}/v1/listings?status=published&limit=100`, { headers: supplier.headers })).json()).data as { id: string; supplierId: string; listingKind: string }[];
  const mineral = live.find((l) => l.supplierId === supplier.id && l.listingKind === 'MINERAL')!;
  const made = await api.post(`${API}/v1/trade/inquiries/create`, {
    headers: { ...buyer.headers, 'Idempotency-Key': crypto.randomUUID() },
    data: { product_id: mineral.id, entity_type: 'product', mineral_tag: 'Copper', quantity: 2, measure_type: 't', delivery_location: 'Ikeja', delivery_state: 'Lagos', delivery_country: 'Nigeria', delivery_address: '1 Marina', timeline_type: 'immediate' },
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

  const companyId = ((await (await api.get(`${API}/v1/inspector/assignments/me`, { headers: inspector.headers })).json()).data as { inspectorCompanyId: string }[])[0].inspectorCompanyId;
  const today = new Date(Date.now() + 3600_000).toISOString().slice(0, 10);
  const assigned = await api.post(`${API}/v1/admin/inspector/assign`, { headers: admin, data: { inquiryId: trade.id, itemType: 'product', inspectorCompanyId: companyId, scheduledDate: today, scheduledTime: '00:00' } });
  expect(assigned.ok(), await assigned.text()).toBeTruthy();
  assignmentId = ((await (await api.get(`${API}/v1/inspector/assignments/me`, { headers: inspector.headers })).json()).data as { id: string; inquiry_id: string }[]).find((a) => String(a.inquiry_id).replace(/-/g, '') === trade.id.replace(/-/g, ''))!.id;
  for (const status of ['ACCEPTED', 'SITE_VISIT']) {
    expect((await api.put(`${API}/v1/inspector/assignments/${assignmentId}/status`, { headers: inspector.headers, data: { status } })).ok()).toBeTruthy();
  }

  supplierPage = await signIn(browser, env.E2E_SUPPLIER);
  inspectorPage = await signIn(browser, env.E2E_INSPECTOR, true);
});

test.afterAll(async () => {
  test.setTimeout(120_000);
  if (trade.id) await api.put(`${API}/v1/admin/trade/inquiries/${trade.id}`, { headers: await staff(), data: { status: 'REJECTED', isAdminOverride: true, reason: 'E2E: test finished' } });
  await api.dispose();
});

test('the supplier declares a reading and records an event on its batch: both wait for a check', async () => {
  const page = supplierPage;
  await page.goto('/dashboard/batches');
  await page.getByPlaceholder('Search batch code').fill(batch.code);
  await page.getByText(batch.code, { exact: true }).first().click({ timeout: 60_000 });
  const sheet = page.getByRole('dialog').filter({ has: page.getByRole('tab', { name: 'Family' }) });
  await sheet.getByRole('tab', { name: 'History' }).click();
  const records = sheet.getByTestId(`records-${batch.id}`);
  await expect(records.getByRole('heading', { name: 'Readings and events' })).toBeVisible({ timeout: 30_000 });

  await records.getByRole('button', { name: 'Record a reading' }).click();
  const form = page.getByRole('dialog').filter({ hasText: 'Record a reading' });
  await choose(page.getByRole('combobox', { name: 'What was measured' }), measure.type);
  await form.locator('#reading-value').fill(SUPPLIER_VALUE);
  await choose(page.getByRole('combobox', { name: 'Unit' }), measure.unit);
  await form.getByRole('button', { name: 'Save reading' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Save this reading?' }).getByRole('button', { name: 'Save', exact: true }).click();
  const reading = records.locator('[data-testid^="reading-"]').filter({ hasText: `${measure.type}: ${SUPPLIER_VALUE} %` });
  await expect(reading.getByText('Declared by the company, not checked')).toBeVisible({ timeout: 30_000 });
  await expect(reading.getByRole('button', { name: 'Checked' })).toHaveCount(0);

  await records.getByRole('button', { name: 'Record an event' }).click();
  const eventForm = page.getByRole('dialog').filter({ hasText: 'Record an event' });
  await choose(page.getByRole('combobox', { name: 'What happened' }), 'E2E site check');
  await expect(eventForm.getByText('Fill in Bags sampled.')).toBeVisible();
  await eventForm.locator('#event-data-bagsSampled').fill(BAGS);
  await choose(page.getByRole('combobox', { name: 'Method' }), 'PROBE');
  await eventForm.getByRole('button', { name: 'Save event' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Record E2E site check?' }).getByRole('button', { name: 'Save', exact: true }).click();
  const event = records.locator('[data-testid^="event-"]').filter({ hasText: `bagsSampled: ${BAGS}` });
  await expect(event.getByText('Waiting for a check')).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: 'tests/e2e/.results/records-supplier.png' });
});

test('the inspector checks what the supplier declared, on a phone; the inspector’s own reading waits for someone else', async () => {
  const page = inspectorPage;
  await page.goto(`/dashboard/inspections/workbench/${assignmentId}`);
  const records = page.getByTestId(`records-${batch.id}`);
  await expect(records).toBeVisible({ timeout: 60_000 });

  const reading = records.locator('[data-testid^="reading-"]').filter({ hasText: `${measure.type}: ${SUPPLIER_VALUE} %` });
  await reading.getByRole('button', { name: 'Checked' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Mark this reading as checked?' }).getByRole('button', { name: 'Checked' }).click();
  await expect(reading.getByText('Checked', { exact: true })).toBeVisible({ timeout: 30_000 });

  const event = records.locator('[data-testid^="event-"]').filter({ hasText: `bagsSampled: ${BAGS}` });
  await event.getByRole('button', { name: 'Checked' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Mark this event as checked?' }).getByRole('button', { name: 'Checked' }).click();
  await expect(event.getByText('Checked', { exact: true })).toBeVisible({ timeout: 30_000 });

  await records.getByRole('button', { name: 'Record a reading' }).click();
  const form = page.getByRole('dialog').filter({ hasText: 'Record a reading' });
  await choose(page.getByRole('combobox', { name: 'What was measured' }), measure.type);
  await form.locator('#reading-value').fill(INSPECTOR_VALUE);
  await choose(page.getByRole('combobox', { name: 'Unit' }), measure.unit);
  await form.getByRole('button', { name: 'Save reading' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Save this reading?' }).getByRole('button', { name: 'Save', exact: true }).click();
  const mine = records.locator('[data-testid^="reading-"]').filter({ hasText: `${measure.type}: ${INSPECTOR_VALUE} %` });
  // No location from this browser, so it is not counted as taken on site
  await expect(mine.getByText('Waiting for a check')).toBeVisible({ timeout: 30_000 });
  await expect(mine.getByRole('button', { name: 'Checked' })).toHaveCount(0);
  await mine.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'tests/e2e/.results/records-inspector-phone.png' });
});
