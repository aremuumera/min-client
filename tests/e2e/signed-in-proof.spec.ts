import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

/*
 * Step 2.11c, signed in against the local backend (Polygon Amoy): a passport the supplier publishes
 * now shows "Sealed by MINMEG" (its fingerprint is recorded, not yet on the chain); a passport already
 * anchored (the admin anchoring test leaves one) shows "On the blockchain", and "Check it now" verifies
 * it on Polygon with the transaction link and how the record is included in its batch.
 * Run after the admin signed-in-anchoring test.
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
let fresh = { id: '', code: '' };
let anchored = { id: '', code: '' };

const key = () => ({ 'Idempotency-Key': crypto.randomUUID() });
const findBatchId = (o: unknown): string | undefined => {
  if (!o || typeof o !== 'object') return undefined;
  const r = o as Record<string, unknown>;
  if (typeof r.batchId === 'string') return r.batchId;
  for (const v of Object.values(r)) {
    const hit = findBatchId(v);
    if (hit) return hit;
  }
  return undefined;
};

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(300_000);
  api = await playwright.request.newContext();
  const login = async (p: string, identifier: string) => {
    const res = await (await api.post(`${API}/v1/auth/${p}`, { headers: { 'x-e2e-run': env.E2E_RUN_SECRET }, data: { type: 'email', identifier, password: env.E2E_PASSWORD } })).json();
    return { Authorization: `Bearer ${res.ac ?? res.data?.ac}`, 'x-e2e-run': env.E2E_RUN_SECRET };
  };
  const admin = await login('aremu_check_admin_login', env.E2E_TEST_SUPER_ADMIN);
  const supplier = await login('umera/login', env.E2E_SUPPLIER);

  // a passport already on the chain (left by the admin anchoring test)
  const published = (await (await api.get(`${API}/v1/certificates?certificateKind=PASSPORT&status=PUBLISHED&limit=50`, { headers: supplier })).json()).data as { id: string; passportCode: string; publishedVersion: { id: string } | null }[];
  for (const p of published) {
    if (!p.publishedVersion) continue;
    const proofs = (await (await api.get(`${API}/v1/proofs?subjectType=PASSPORT_VERSION&subjectId=${p.publishedVersion.id}`, { headers: supplier })).json()).data as { anchoring: { onChain: boolean } }[];
    if (proofs[0]?.anchoring.onChain) {
      anchored = { id: p.id, code: p.passportCode };
      break;
    }
  }
  expect(anchored.id, 'run the admin signed-in-anchoring test first').toBeTruthy();

  // a passport published now: sealed, not yet on the chain
  const types = (await (await api.get(`${API}/v1/passport-types?limit=50`, { headers: admin })).json()).data as { id: string; code: string }[];
  const policies = (await (await api.get(`${API}/v1/visibility-policies?limit=50`, { headers: admin })).json()).data as { id: string; code: string }[];
  const tpl = await api.post(`${API}/v1/passport-templates`, { headers: { ...admin, ...key() }, data: { passportTypeId: types.find((t) => t.code === 'BATCH_PASSPORT')!.id, code: `E2E_PRF_${RUN}`, name: `E2E proof ${RUN}` } });
  expect(tpl.status(), await tpl.text()).toBe(201);
  const templateId = (await tpl.json()).data.id;
  const added = await api.post(`${API}/v1/passport-templates/${templateId}/fields`, { headers: { ...admin, ...key() }, data: { key: 'batchCode', label: 'Batch code', dataType: 'STRING', required: true, identifierBinding: 'BATCH_CODE', visibilityPolicyId: policies.find((p) => p.code === 'PUBLIC')!.id, order: 1 } });
  expect(added.status(), await added.text()).toBe(201);
  expect((await api.post(`${API}/v1/passport-templates/${templateId}/validate`, { headers: admin })).ok()).toBeTruthy();
  expect((await api.post(`${API}/v1/passport-templates/${templateId}/publish`, { headers: admin, data: { makeDefault: false } })).ok()).toBeTruthy();
  const materials = (await (await api.get(`${API}/v1/materials?limit=100`, { headers: admin })).json()).data as { id: string; name: string; passportEligible: boolean }[];
  const units = (await (await api.get(`${API}/v1/measurement-units?limit=100`, { headers: admin })).json()).data as { id: string; code: string }[];
  const mt = units.find((u) => u.code === 'MT')!.id;
  const listing = await api.post(`${API}/v1/listings`, {
    headers: { ...supplier, ...key() },
    data: { productName: `E2E tin proof ${RUN}`, productHeaderDescription: 'E2E cassiterite concentrate', realPrice: '900', unitCurrency: 'USD', materialId: materials.find((m) => m.passportEligible && m.name.startsWith('Tin'))!.id, unitId: mt, newBatch: { initialQuantity: '10', quantityUnitId: mt, sourceType: 'MINED' }, publish: true },
  });
  expect(listing.status(), await listing.text()).toBe(201);
  const made = await api.post(`${API}/v1/certificates`, { headers: { ...supplier, ...key() }, data: { certificateKind: 'PASSPORT', certificateType: 'BATCH_PASSPORT', subjectId: findBatchId((await listing.json()).data), templateId } });
  expect(made.status(), await made.text()).toBe(201);
  const passport = (await made.json()).data;
  expect((await api.post(`${API}/v1/certificates/${passport.id}/versions/${passport.openVersion.id}/validate`, { headers: supplier })).ok()).toBeTruthy();
  expect((await api.post(`${API}/v1/certificates/${passport.id}/publish`, { headers: supplier })).ok()).toBeTruthy();
  fresh = { id: passport.id, code: passport.passportCode };

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

async function openPassport(code: string, id: string) {
  await page.goto('/dashboard/passports');
  await page.getByPlaceholder('Search by passport code').fill(code);
  await page.getByRole('table').getByText(code).click({ timeout: 60_000 });
  return page.getByTestId(`passport-${id}`).getByTestId('proof-section');
}

test('a passport published now: sealed by MINMEG, waiting for the blockchain', async () => {
  const proof = await openPassport(fresh.code, fresh.id);
  await expect(proof.locator('[data-proof="SEALED"]')).toBeVisible({ timeout: 30_000 });
  await expect(proof.getByText('It is waiting to be written on the blockchain.', { exact: false })).toBeVisible();
  await expect(proof.getByRole('button', { name: 'Check it now' })).toHaveCount(0);
});

test('an anchored passport: on the blockchain; Check it now verifies it on Polygon, with how it is included', async () => {
  const proof = await openPassport(anchored.code, anchored.id);
  await expect(proof.locator('[data-proof="ON_CHAIN"]')).toBeVisible({ timeout: 30_000 });
  await proof.getByRole('button', { name: 'Check it now' }).click();
  const check = proof.getByTestId('chain-check');
  await expect(check.getByText(/Verified on the blockchain/)).toBeVisible({ timeout: 60_000 });
  await expect(check.getByRole('link', { name: 'See it on Polygonscan' })).toHaveAttribute('href', /amoy\.polygonscan\.com\/tx\/0x[0-9a-f]{64}/);
  await proof.getByRole('button', { name: 'Show how this record is included' }).click();
  await expect(proof.getByTestId('inclusion').getByText(/This record is position \d+ of batch MB-/)).toBeVisible({ timeout: 30_000 });
  await proof.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'tests/e2e/.results/proof-on-chain.png' });
});
