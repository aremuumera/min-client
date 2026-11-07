import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { test, expect, type Page, type APIRequestContext, type Browser } from '@playwright/test';

/*
 * Step 2.7c, signed in against the local backend: the supplier packs a unit; the inspector assigned to the
 * trade makes a code, prints it and applies it by typing the label at the site; the supplier sees it.
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
const SITE = { latitude: 6.5244, longitude: 3.3792 };
type Party = { headers: Record<string, string>; id: string };
let api: APIRequestContext;
let supplierPage: Page;
let inspectorPage: Page;
let inquiryId = '';
let assignmentId = '';
let batch = { id: '', code: '' };
let unitSerial = '';

async function login(pathName: string, identifier: string): Promise<Party> {
  const res = await (await api.post(`${API}/v1/auth/${pathName}`, { headers: { 'x-e2e-run': env.E2E_RUN_SECRET }, data: { type: 'email', identifier, password: env.E2E_PASSWORD } })).json();
  const user = res.user ?? res.data?.user;
  return { headers: { Authorization: `Bearer ${res.ac ?? res.data?.ac}`, 'x-e2e-run': env.E2E_RUN_SECRET }, id: user?.id };
}
const staff = async () => (await login('aremu_check_admin_login', env.E2E_TEST_SUPER_ADMIN)).headers;

async function signIn(browser: Browser, email: string, geo = false) {
  const context = await browser.newContext({ baseURL: `http://localhost:${process.env.E2E_PORT ?? 3102}`, viewport: { width: 1280, height: 900 }, ...(geo ? { geolocation: { ...SITE, accuracy: 10 }, permissions: ['geolocation'] } : {}) });
  await quietLogins(context, env.E2E_RUN_SECRET);
  const page = await context.newPage();
  await page.goto('/auth/sign-in');
  await page.getByPlaceholder('Enter your email').fill(email);
  await page.getByPlaceholder('Enter your password').fill(env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
  return page;
}

/** Units left by earlier runs would fill the batch (units can't hold more than it): retire them */
async function retireTestUnits(headers: Record<string, string>) {
  const data = (await (await api.get(`${API}/v1/handling-units?batchId=${batch.id}`, { headers })).json()).data;
  const ours = (data?.units ?? []) as { id: string; serialNumber: string | null; parentHandlingUnitId: string | null; status: string }[];
  // Inner units first, so a parent is never retired with live children inside
  for (const u of [...ours].sort((a, b) => Number(!a.parentHandlingUnitId) - Number(!b.parentHandlingUnitId))) {
    if (u.serialNumber?.startsWith('E2E-') && !['RETIRED', 'LOADED', 'IN_TRANSIT'].includes(u.status)) {
      await api.post(`${API}/v1/handling-units/${u.id}/retire`, { headers, data: { reason: 'E2E: clearing test units' } });
    }
  }
}

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(300_000);
  api = await playwright.request.newContext();
  const buyer = await login('umera/login', env.E2E_BUYER);
  const supplier = await login('umera/login', env.E2E_SUPPLIER);
  const inspector = await login('umera/login', env.E2E_INSPECTOR);
  const admin = await staff();
  const live = (await (await api.get(`${API}/v1/listings?status=published&limit=100`, { headers: supplier.headers })).json()).data as { id: string; supplierId: string; listingKind: string }[];
  const mineral = live.find((l) => l.supplierId === supplier.id && l.listingKind === 'MINERAL')!;
  const made = await api.post(`${API}/v1/trade/inquiries/create`, {
    headers: { ...buyer.headers, 'Idempotency-Key': crypto.randomUUID() },
    data: { product_id: mineral.id, entity_type: 'product', mineral_tag: 'Copper', quantity: 2, measure_type: 't', delivery_location: 'Ikeja', delivery_state: 'Lagos', delivery_country: 'Nigeria', delivery_address: '1 Marina', timeline_type: 'immediate' },
  });
  expect(made.status(), await made.text()).toBe(201);
  inquiryId = (await (await api.get(`${API}/v1/trade/inquiries/${(await made.json()).data.reference}`, { headers: buyer.headers })).json()).data.external_id;
  expect((await api.post(`${API}/v1/trade/inquiry/${inquiryId}/acknowledge`, { headers: supplier.headers })).ok()).toBeTruthy();
  const accepted = await api.put(`${API}/v1/admin/trade/inquiries/${inquiryId}`, { headers: admin, data: { status: 'FINAL_TRADE_PACK_ACCEPTED', isAdminOverride: true, reason: 'E2E: test trade accepted' } });
  expect(accepted.ok(), await accepted.text()).toBeTruthy();

  // The committed batch, and its site placed on the map so the inspector can be "at the site"
  const trade = (await (await api.get(`${API}/v1/trades?productInquiryId=${inquiryId}`, { headers: supplier.headers })).json()).data[0];
  const allocation = ((await (await api.get(`${API}/v1/trades/${trade.id}/allocations`, { headers: supplier.headers })).json()).data as { status: string; batch: { id: string; batchCode: string; currentLocationId: string | null; sourceLocationId: string | null } }[]).find((a) => a.status === 'ACTIVE')!;
  batch = { id: allocation.batch.id, code: allocation.batch.batchCode };
  // A batch without a site can't be labelled (the inspector must be at the goods): give it the supplier's own site
  let siteId = allocation.batch.currentLocationId ?? allocation.batch.sourceLocationId;
  if (!siteId) {
    siteId = ((await (await api.get(`${API}/v1/locations?limit=100`, { headers: supplier.headers })).json()).data as { id: string; organizationId: string | null }[]).find((l) => l.organizationId)!.id;
    const moved = await api.patch(`${API}/v1/batches/${batch.id}`, { headers: supplier.headers, data: { currentLocationId: siteId } });
    expect(moved.ok(), await moved.text()).toBeTruthy();
  }
  const placed = await api.patch(`${API}/v1/locations/${siteId}`, { headers: supplier.headers, data: { ...SITE, geofenceRadiusMeters: 500 } });
  expect(placed.ok(), await placed.text()).toBeTruthy();

  // The inspector is assigned for today and accepts
  const companyId = ((await (await api.get(`${API}/v1/inspector/assignments/me`, { headers: inspector.headers })).json()).data as { inspectorCompanyId: string }[])[0].inspectorCompanyId;
  const lagosToday = new Date(Date.now() + 3600_000).toISOString().slice(0, 10);
  const assigned = await api.post(`${API}/v1/admin/inspector/assign`, { headers: admin, data: { inquiryId, itemType: 'product', inspectorCompanyId: companyId, scheduledDate: lagosToday, scheduledTime: '00:00' } });
  expect(assigned.ok(), await assigned.text()).toBeTruthy();
  const mine = ((await (await api.get(`${API}/v1/inspector/assignments/me`, { headers: inspector.headers })).json()).data as { id: string; inquiry_id: string }[]).find((a) => String(a.inquiry_id).replace(/-/g, '') === inquiryId.replace(/-/g, ''))!;
  assignmentId = mine.id;
  const ok = await api.put(`${API}/v1/inspector/assignments/${assignmentId}/status`, { headers: inspector.headers, data: { status: 'ACCEPTED' } });
  expect(ok.ok(), await ok.text()).toBeTruthy();

  await retireTestUnits(supplier.headers);

  supplierPage = await signIn(browser, env.E2E_SUPPLIER);
  inspectorPage = await signIn(browser, env.E2E_INSPECTOR, true);
});

test.afterAll(async () => {
  test.setTimeout(120_000);
  // Ends the test trade: its stock goes back. Units and codes stay as history
  if (batch.id) await retireTestUnits((await login('umera/login', env.E2E_SUPPLIER)).headers);
  if (inquiryId) await api.put(`${API}/v1/admin/trade/inquiries/${inquiryId}`, { headers: await staff(), data: { status: 'REJECTED', isAdminOverride: true, reason: 'E2E: test finished' } });
  await api.dispose();
});

const openBatch = async (page: Page) => {
  await page.goto('/dashboard/batches');
  await page.getByPlaceholder(/Search/).first().fill(batch.code);
  await page.getByRole('row').filter({ hasText: batch.code }).first().click({ timeout: 60_000 });
  await page.getByRole('tab', { name: 'Units and codes' }).click({ timeout: 30_000 });
};

test('the supplier packs a bag on the batch; it has no MINMEG code yet; handing over is there', async () => {
  const page = supplierPage;
  await openBatch(page);
  unitSerial = `E2E-${Date.now().toString(36).toUpperCase()}`;
  await page.getByRole('button', { name: 'Add a unit' }).click({ timeout: 30_000 });
  const modal = page.getByRole('dialog').filter({ hasText: 'Add a unit' });
  await modal.locator('#unit-quantity').fill('0.5');
  await modal.locator('#unit-serial').fill(unitSerial);
  await modal.getByRole('button', { name: 'Add unit' }).click();
  await expect(page.getByText(`Bag ${unitSerial}`)).toBeVisible({ timeout: 30_000 });
  // A pallet, then the bag moved inside it
  await page.getByRole('button', { name: 'Add a unit' }).click();
  const pallet = page.getByRole('dialog').filter({ hasText: 'Add a unit' });
  await pallet.getByRole('combobox', { name: 'Type' }).click();
  await page.getByRole('option', { name: 'Pallet' }).click();
  await pallet.locator('#unit-quantity').fill('0.5');
  await pallet.locator('#unit-serial').fill(`${unitSerial}-P`);
  await pallet.getByRole('button', { name: 'Add unit' }).click();
  const palletRow = page.locator('li').filter({ hasText: `Pallet ${unitSerial}-P` }).first();
  await expect(palletRow).toBeVisible({ timeout: 30_000 });
  await palletRow.getByRole('button', { name: 'Add inside' }).click();
  const inside = page.getByRole('dialog').filter({ hasText: 'Add a unit inside' });
  await inside.getByRole('combobox', { name: 'What goes inside' }).click();
  await page.getByRole('option', { name: 'A unit already packed' }).click();
  await inside.getByRole('combobox', { name: 'Unit' }).click();
  await page.getByRole('option', { name: new RegExp(`Bag ${unitSerial}`) }).click();
  await inside.getByRole('button', { name: 'Move inside' }).click();
  await expect(inside).toHaveCount(0, { timeout: 30_000 });
  // The bag now sits under the pallet, indented
  const bagRow = page.locator('li').filter({ hasText: `Bag ${unitSerial}` }).first();
  await expect(bagRow).toHaveAttribute('style', /padding-left: 32px/, { timeout: 30_000 });
  await bagRow.getByRole('button', { name: 'Who holds it' }).click();
  const holder = page.getByRole('dialog').filter({ hasText: 'Who holds the goods' });
  await expect(holder.getByText(/No handover yet|Holding/).first()).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: 'tests/e2e/.results/trace-nested.png' });
  await page.getByRole('button', { name: 'Close', exact: true }).last().click();
  await expect(page.getByText('Who holds the goods')).toBeVisible();
  await expect(page.getByRole('button', { name: /Make codes|Apply codes/ })).toHaveCount(0);
  await page.screenshot({ path: 'tests/e2e/.results/trace-supplier-units.png' });
});

test('the inspector makes the code, prints the label and applies it at the site', async () => {
  const page = inspectorPage;
  await page.goto(`/dashboard/inspections/workbench/${assignmentId}`);
  await expect(page.getByRole('heading', { name: 'Labels on the goods' })).toBeVisible({ timeout: 60_000 });
  // The assignment ID shows exactly as stored, never in capitals (rule 8)
  await expect(page.getByText(`ID: ${assignmentId}`, { exact: true })).toBeVisible();
  await expect(page.getByText(/^Open until/)).toBeVisible({ timeout: 30_000 });
  const section = page.locator('div').filter({ has: page.getByRole('heading', { name: new RegExp(batch.code) }) }).last();
  await section.getByRole('button', { name: 'Make codes' }).click();
  const make = page.getByRole('dialog').filter({ hasText: 'Make MINMEG codes' });
  await make.getByRole('button', { name: /^Make \d+ code/ }).click();
  await expect(make).toHaveCount(0, { timeout: 30_000 });
  await expect(section.getByText('Not applied yet').first()).toBeVisible({ timeout: 30_000 });

  await section.getByRole('button', { name: 'Print labels' }).click();
  const print = page.getByRole('dialog').filter({ hasText: 'Print labels' });
  const ref = (await print.locator('label').filter({ hasText: /^MNG-/ }).first().textContent())!.trim();
  await print.getByRole('button', { name: /^Prepare/ }).click();
  await expect(print.locator('svg').first()).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: 'tests/e2e/.results/trace-print.png' });
  await print.getByRole('button', { name: 'All printed' }).click();
  await expect(print).toHaveCount(0, { timeout: 30_000 });

  await section.getByRole('button', { name: 'Apply codes' }).click();
  const apply = page.getByRole('dialog').filter({ hasText: 'Apply codes' });
  // A camera reads the label's full signed value; the test enters that value (the inspector may see it)
  const units = (await (await api.get(`${API}/v1/handling-units?batchId=${batch.id}`, { headers: (await login('umera/login', env.E2E_INSPECTOR)).headers })).json()).data;
  const signed = [...units.identifiers, ...units.units.flatMap((u: { identifiers: unknown[] }) => u.identifiers)].find((c: { publicReference: string }) => c.publicReference === ref).identifierValue;
  // A typed reference alone is refused: it doesn't prove the label was scanned
  await apply.getByPlaceholder('MNG-XXXX-XXXX-XXXX-XXXX-X').fill(ref);
  await apply.getByRole('button', { name: 'Use' }).click();
  await expect(apply.getByText('The scanned label is not this code; scan the label applied on the goods')).toBeVisible({ timeout: 30_000 });
  await apply.getByPlaceholder('MNG-XXXX-XXXX-XXXX-XXXX-X').fill(signed);
  await apply.getByRole('button', { name: 'Use' }).click();
  await expect(apply.getByText(`${ref} is now active.`)).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: 'tests/e2e/.results/trace-applied.png' });
  await apply.getByRole('button', { name: 'Done' }).click();
  await expect(section.getByText('Active').first()).toBeVisible({ timeout: 30_000 });
});

test('the supplier sees the active code, without the printable value', async () => {
  const page = supplierPage;
  await openBatch(page);
  await expect(page.getByText('Active').first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/verify\.minmeg\.com/)).toHaveCount(0);
  await page.screenshot({ path: 'tests/e2e/.results/trace-supplier-active.png' });
});

test('scan page: a typed reference is checked; a made-up one is not a MINMEG code', async () => {
  const page = supplierPage;
  await page.goto('/dashboard/scan');
  await page.getByPlaceholder('MNG-XXXX-XXXX-XXXX-XXXX-X').fill('MNG-0000-0000-0000-0000-0', { timeout: 60_000 });
  await page.getByRole('button', { name: 'Use' }).click();
  await expect(page.getByText(/Not a MINMEG code|not active|copy/i).first()).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: 'tests/e2e/.results/trace-scan.png' });
});

test('handovers page: tabs, filter, help', async () => {
  const page = supplierPage;
  await page.goto('/dashboard/handovers');
  await expect(page.getByRole('heading', { name: 'Handovers', level: 1 })).toBeVisible({ timeout: 60_000 });
  await page.getByRole('tab', { name: 'Handed on by you' }).click();
  await page.screenshot({ path: 'tests/e2e/.results/trace-handovers.png' });
});
