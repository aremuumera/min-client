import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

/*
 * Step 2.9d, signed in against the local backend: the supplier opens its business certificate (the
 * admin certificates test issues it), reads MINMEG's statement, downloads the server-made PDF, shares
 * it with the buyer's company by ID (the buyer can then read it) and stops sharing; a published
 * passport downloads as a PDF too.
 */
const envFile = path.join(__dirname, '../../.env.e2e.local');
const env: Record<string, string> = fs.existsSync(envFile)
  ? Object.fromEntries(fs.readFileSync(envFile, 'utf8').split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }))
  : {};
test.describe.configure({ mode: 'serial', timeout: 180_000 });
test.skip(!env.E2E_PASSWORD || !env.E2E_BUYER || !env.E2E_SUPPLIER, 'no .env.e2e.local');

const API = 'http://localhost:8081/api';
let api: APIRequestContext;
let page: Page;
let buyer = { headers: {} as Record<string, string>, id: '' };
let certificate = { id: '', code: '' };
let passport = { id: '', code: '' };

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(240_000);
  api = await playwright.request.newContext();
  const login = async (identifier: string) => {
    const res = await (await api.post(`${API}/v1/auth/umera/login`, { headers: { 'x-e2e-run': env.E2E_RUN_SECRET }, data: { type: 'email', identifier, password: env.E2E_PASSWORD } })).json();
    return { headers: { Authorization: `Bearer ${res.ac ?? res.data?.ac}`, 'x-e2e-run': env.E2E_RUN_SECRET }, id: (res.user ?? res.data?.user).id as string };
  };
  buyer = await login(env.E2E_BUYER);
  const supplier = await login(env.E2E_SUPPLIER);
  const certs = (await (await api.get(`${API}/v1/certificates?certificateKind=NON_PASSPORT&certificateType=ENTITY_CERTIFICATE&limit=20`, { headers: supplier.headers })).json()).data as { id: string; certificateCode: string; subjectId: string; issued: boolean }[];
  const mine = certs.find((c) => c.subjectId === supplier.id && c.issued);
  expect(mine, 'run the admin certificates test first').toBeTruthy();
  certificate = { id: mine!.id, code: mine!.certificateCode };
  const passports = (await (await api.get(`${API}/v1/certificates?certificateKind=PASSPORT&status=PUBLISHED&limit=5`, { headers: supplier.headers })).json()).data as { id: string; passportCode: string }[];
  if (passports[0]) passport = { id: passports[0].id, code: passports[0].passportCode };

  const context = await browser.newContext({ baseURL: `http://localhost:${process.env.E2E_PORT ?? 3102}`, viewport: { width: 1280, height: 900 }, acceptDownloads: true });
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

test('the supplier opens its business certificate, reads the statement and downloads the PDF', async () => {
  await page.goto('/dashboard/certificates');
  await page.getByPlaceholder('Search by certificate code').fill(certificate.code);
  await page.getByRole('table').getByText(certificate.code).click({ timeout: 60_000 });
  const detail = page.getByTestId(`certificate-${certificate.id}`);
  await expect(detail.getByText('Issued by MINMEG')).toBeVisible({ timeout: 30_000 });
  await expect(detail.getByText('What MINMEG states')).toBeVisible();
  await page.screenshot({ path: 'tests/e2e/.results/certificate-supplier.png' });
  const download = page.waitForEvent('download');
  await detail.getByRole('button', { name: 'Download PDF' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe(`${certificate.code}.pdf`);
  expect(fs.readFileSync((await file.path())!).subarray(0, 4).toString()).toBe('%PDF');
});

test('the supplier shares it with the buyer’s company, who can then read it; then stops sharing', async () => {
  const detail = page.getByTestId(`certificate-${certificate.id}`);
  expect((await api.get(`${API}/v1/certificates/${certificate.id}`, { headers: buyer.headers })).status()).toBe(404);
  await detail.getByRole('button', { name: 'Share with a company' }).click();
  await detail.getByRole('textbox', { name: 'Company ID' }).fill(buyer.id);
  await detail.getByRole('button', { name: 'Share', exact: true }).click();
  await page.getByRole('dialog').filter({ hasText: 'Share with this company?' }).getByRole('button', { name: 'Share', exact: true }).click();
  await expect(detail.getByText(buyer.id)).toBeVisible({ timeout: 30_000 });
  expect((await api.get(`${API}/v1/certificates/${certificate.id}`, { headers: buyer.headers })).status()).toBe(200);

  await detail.getByRole('button', { name: 'Remove' }).first().click();
  const stop = page.getByRole('dialog').filter({ hasText: 'Stop sharing?' });
  await stop.getByLabel(/Reason/).fill('E2E: test finished');
  await stop.getByRole('button', { name: 'Stop sharing' }).click();
  await expect(detail.getByText('Not shared with any other company.')).toBeVisible({ timeout: 30_000 });
  expect((await api.get(`${API}/v1/certificates/${certificate.id}`, { headers: buyer.headers })).status()).toBe(404);
});

test('a published passport downloads as a PDF', async () => {
  test.skip(!passport.id, 'run the passports test first');
  await page.goto('/dashboard/passports');
  await page.getByPlaceholder('Search by passport code').fill(passport.code);
  await page.getByRole('table').getByText(passport.code).click({ timeout: 60_000 });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download the published version (PDF)' }).click({ timeout: 30_000 });
  const file = await download;
  expect(file.suggestedFilename()).toBe(`${passport.code}.pdf`);
  expect(fs.readFileSync((await file.path())!).subarray(0, 4).toString()).toBe('%PDF');
});
