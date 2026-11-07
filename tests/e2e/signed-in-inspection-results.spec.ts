import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { test, expect, type Page, type APIRequestContext, type Browser } from '@playwright/test';

/*
 * Step 2.8a, signed in against the local backend: the inspector records findings and a lab result for
 * the trade's batch on a phone, and can't submit the report before every batch has findings; MINMEG
 * checks and releases; the buyer then sees the results per batch (and nothing before).
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
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');
type Party = { headers: Record<string, string>; id: string };
let api: APIRequestContext;
let buyer: Party;
let inspectorPage: Page;
let trade = { id: '', room: '' };
let assignmentId = '';
let batch = { id: '', code: '' };

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

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(300_000);
  api = await playwright.request.newContext();
  buyer = await login('umera/login', env.E2E_BUYER);
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
  const detail = (await (await api.get(`${API}/v1/trade/inquiries/${(await made.json()).data.reference}`, { headers: buyer.headers })).json()).data;
  trade = { id: detail.external_id, room: detail.firebase_room_id };
  expect((await api.post(`${API}/v1/trade/inquiry/${trade.id}/acknowledge`, { headers: supplier.headers })).ok()).toBeTruthy();
  const accepted = await api.put(`${API}/v1/admin/trade/inquiries/${trade.id}`, { headers: admin, data: { status: 'FINAL_TRADE_PACK_ACCEPTED', isAdminOverride: true, reason: 'E2E: test trade accepted' } });
  expect(accepted.ok(), await accepted.text()).toBeTruthy();

  const record = (await (await api.get(`${API}/v1/trades?productInquiryId=${trade.id}`, { headers: supplier.headers })).json()).data[0];
  const allocation = ((await (await api.get(`${API}/v1/trades/${record.id}/allocations`, { headers: supplier.headers })).json()).data as { status: string; batch: { id: string; batchCode: string } }[]).find((a) => a.status === 'ACTIVE')!;
  batch = { id: allocation.batch.id, code: allocation.batch.batchCode };

  // The inspector is assigned, accepts, and is at the lab stage
  const companyId = ((await (await api.get(`${API}/v1/inspector/assignments/me`, { headers: inspector.headers })).json()).data as { inspectorCompanyId: string }[])[0].inspectorCompanyId;
  const today = new Date(Date.now() + 3600_000).toISOString().slice(0, 10);
  const assigned = await api.post(`${API}/v1/admin/inspector/assign`, { headers: admin, data: { inquiryId: trade.id, itemType: 'product', inspectorCompanyId: companyId, scheduledDate: today, scheduledTime: '00:00' } });
  expect(assigned.ok(), await assigned.text()).toBeTruthy();
  const mine = ((await (await api.get(`${API}/v1/inspector/assignments/me`, { headers: inspector.headers })).json()).data as { id: string; inquiry_id: string }[]).find((a) => String(a.inquiry_id).replace(/-/g, '') === trade.id.replace(/-/g, ''))!;
  assignmentId = mine.id;
  for (const status of ['ACCEPTED', 'SITE_VISIT', 'LAB_ANALYSIS']) {
    const moved = await api.put(`${API}/v1/inspector/assignments/${assignmentId}/status`, { headers: inspector.headers, data: { status } });
    expect(moved.ok(), `${status}: ${await moved.text()}`).toBeTruthy();
  }

  inspectorPage = await signIn(browser, env.E2E_INSPECTOR, true);
});

test.afterAll(async () => {
  test.setTimeout(120_000);
  // Ends the test trade: its stock goes back. Results stay as history
  if (trade.id) await api.put(`${API}/v1/admin/trade/inquiries/${trade.id}`, { headers: await staff(), data: { status: 'REJECTED', isAdminOverride: true, reason: 'E2E: test finished' } });
  await api.dispose();
});

test('the inspector records findings and a lab result per batch on a phone, then submits the report', async () => {
  const page = inspectorPage;
  await page.goto(`/dashboard/inspections/workbench/${assignmentId}`);
  await expect(page.getByRole('heading', { name: 'Findings and lab results' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(`Waiting for findings: ${batch.code}`)).toBeVisible({ timeout: 30_000 });

  // The report can't go to MINMEG while a batch has no findings
  await page.getByRole('button', { name: /Lab Test Results and Report/ }).click();
  await expect(page.getByText(/Record findings for every batch first/)).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();

  const card = page.getByTestId(`results-batch-${batch.id}`);
  await card.getByRole('button', { name: 'Record findings' }).click();
  const findings = page.getByRole('dialog').filter({ hasText: `Findings for ${batch.code}` });
  await findings.locator('#findings-quantity').fill('2');
  await findings.getByLabel('Parameter 1', { exact: true }).fill('Moisture');
  await findings.getByLabel('Value 1', { exact: true }).fill('4.1');
  await findings.getByLabel('Unit 1', { exact: true }).fill('%');
  await findings.locator('#findings-summary').fill('E2E: bags sealed, sampled at 3 points');
  await findings.getByLabel('Findings photos', { exact: true }).setInputFiles({ name: 'e2e-site.png', mimeType: 'image/png', buffer: PNG });
  await expect(findings.getByText('e2e-site.png')).toBeVisible();
  await page.screenshot({ path: 'tests/e2e/.results/results-findings-form.png' });
  await findings.getByRole('button', { name: 'Save findings' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Save these findings?' }).getByRole('button', { name: 'Save', exact: true }).click();
  await expect(card.getByText('Moisture: 4.1 %')).toBeVisible({ timeout: 60_000 });
  await expect(card.getByText('Waiting for MINMEG')).toBeVisible();
  await expect(page.getByText(/Waiting for findings:/)).toHaveCount(0);

  await card.getByRole('button', { name: 'Add lab result' }).click();
  const lab = page.getByRole('dialog').filter({ hasText: `Lab result for ${batch.code}` });
  await expect(lab.getByText('Enter the laboratory.')).toBeVisible();
  await lab.locator('#lab-name').fill('E2E Minerals Lab');
  await lab.locator('#lab-sample').fill('E2E-S-001');
  await lab.getByLabel('Grade parameter').fill('Sn');
  await lab.getByLabel('Grade value').fill('58.2');
  await expect(lab.getByText('Attach the lab certificate or report.')).toBeVisible();
  await lab.getByLabel('Lab certificate', { exact: true }).setInputFiles({ name: 'e2e-certificate.pdf', mimeType: 'application/pdf', buffer: PDF });
  await lab.getByRole('button', { name: 'Save lab result' }).click();
  await page.getByRole('dialog').filter({ hasText: 'Save this lab result?' }).getByRole('button', { name: 'Save', exact: true }).click();
  await expect(card.getByText('Lab result: E2E Minerals Lab')).toBeVisible({ timeout: 60_000 });
  await expect(card.getByText('Sn 58.2 %')).toBeVisible();
  await card.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'tests/e2e/.results/results-workbench-phone.png', fullPage: false });

  // The existing report, unchanged: now accepted
  await page.getByRole('button', { name: /Lab Test Results and Report/ }).click();
  await expect(page.getByText(/Record findings for every batch first/)).toHaveCount(0);
  await page.getByPlaceholder('e.g. 85.5').fill('58.2');
  await page.locator('input[type="number"][step="0.01"]').fill('2');
  await page.getByPlaceholder(/Enter laboratory breakdown/).fill('E2E: Sn 58.2 %, moisture 4.1 %, no penalty elements found.');
  await page.getByRole('button', { name: 'Submit Report' }).click();
  await expect(page.getByText('Inspection report & findings submitted successfully')).toBeVisible({ timeout: 60_000 });
});

test('nothing reaches the buyer before release; after MINMEG checks and releases, the buyer sees the results per batch', async ({ browser }) => {
  // Before release the buyer gets an empty answer (#71)
  const early = (await (await api.get(`${API}/v1/inspections/${assignmentId}/results`, { headers: buyer.headers })).json()).data;
  expect(early).toMatchObject({ released: false, inspectionResults: [], assayResults: [] });

  const admin = await staff();
  const round = (await (await api.get(`${API}/v1/inspections/${assignmentId}/results`, { headers: admin })).json()).data as { inspectionResults: { id: string }[]; assayResults: { id: string }[] };
  for (const r of round.inspectionResults) expect((await api.post(`${API}/v1/inspection-results/${r.id}/verify`, { headers: admin, data: { outcome: 'VERIFIED' } })).ok()).toBeTruthy();
  for (const r of round.assayResults) expect((await api.post(`${API}/v1/assay-results/${r.id}/verify`, { headers: admin, data: { outcome: 'VERIFIED' } })).ok()).toBeTruthy();
  const released = await api.post(`${API}/v1/inspector/assignments/${assignmentId}/release`, { headers: admin, data: { releaseToBuyer: true, releaseToSupplier: true } });
  expect(released.ok(), await released.text()).toBeTruthy();

  const page = await signIn(browser, env.E2E_BUYER);
  await page.goto(`/dashboard/chat/product/${trade.room}/${trade.id}?tab=inspections`);
  await page.getByRole('button', { name: 'View Details' }).first().click({ timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Results per batch' })).toBeVisible({ timeout: 60_000 });
  const card = page.getByTestId(`results-batch-${batch.id}`);
  await expect(card.getByText('Moisture: 4.1 %')).toBeVisible();
  await expect(card.getByText('Sn 58.2 %')).toBeVisible();
  await expect(card.getByText('Checked by MINMEG')).toHaveCount(2);
  await expect(card.getByRole('link', { name: 'e2e-certificate.pdf' })).toBeVisible();
  await card.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'tests/e2e/.results/results-buyer-released.png' });
});
