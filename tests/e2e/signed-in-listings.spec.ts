import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { pick } from './pick';
import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

/*
 * Step 2.6 My listings with a real supplier account against the local backend (desktop only). Creates
 * "E2E listing" records with real picture uploads, works through their life, then archives them and
 * retires their batches. Listings and batches aren't deleted, so they stay as history.
 *   E2E_PORT=3001 npx playwright test signed-in-listings --project=desktop
 */
const envFile = path.join(__dirname, '../../.env.e2e.local');
const env: Record<string, string> = fs.existsSync(envFile)
  ? Object.fromEntries(
      fs
        .readFileSync(envFile, 'utf8')
        .split('\n')
        .filter((l) => l.includes('='))
        .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
    )
  : {};

test.skip(!env.E2E_PASSWORD || !env.E2E_SUPPLIER, 'no .env.e2e.local');
test.beforeAll(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop only'));
test.describe.configure({ mode: 'serial', timeout: 70_000 });

let page: Page;
const stamp = Date.now().toString(36).toUpperCase();
const name = `E2E listing ${stamp}`;
const batchCode = `E2EL-${stamp}`;
// The smallest valid PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==', 'base64');
const pictures = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `e2e-${stamp}-${i}.png`, mimeType: 'image/png', buffer: PNG }));
const shot = async (shotName: string) => {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `tests/e2e/.results/listings-${shotName}.png` });
};
const confirmIn = async (title: RegExp | string, button: string) => {
  const dialog = page.getByRole('dialog').filter({ hasText: title });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: button, exact: true }).click();
};
const sheet = () => page.getByRole('dialog').filter({ has: page.getByRole('tab', { name: 'Stock' }) });
const next = () => page.getByRole('button', { name: 'Next', exact: true }).click();

const API = 'http://localhost:8081/api';
/** A site the test company can offer listings from; reused between runs */
async function ensureSite(api: APIRequestContext, identifier: string, loginPath: string) {
  const login = await (await api.post(`${API}${loginPath}`, { headers: { 'x-e2e-run': env.E2E_RUN_SECRET }, data: { type: 'email', identifier, password: env.E2E_PASSWORD } })).json();
  const headers = { Authorization: `Bearer ${login.ac ?? login.data?.ac}` };
  const found = await (await api.get(`${API}/v1/locations?search=E2E%20listing%20site&active=true&limit=1`, { headers })).json();
  if (found.data?.length) return;
  const made = await api.post(`${API}/v1/locations`, { headers: { ...headers, 'Idempotency-Key': `e2e-site-${Date.now()}` }, data: { name: 'E2E listing site', locationType: 'WAREHOUSE', countryCode: 'NG', stateRegion: 'Plateau' } });
  if (!made.ok()) throw new Error(`Could not add the test site: ${made.status()}`);
}

test.beforeAll(async ({ browser, playwright }) => {
  const api = await playwright.request.newContext();
  await ensureSite(api, env.E2E_SUPPLIER, '/v1/auth/umera/login');
  await api.dispose();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await quietLogins(context, env.E2E_RUN_SECRET);
  page = await context.newPage();
  await page.goto('/auth/sign-in');
  await page.getByPlaceholder('Enter your email').fill(env.E2E_SUPPLIER);
  await page.getByPlaceholder('Enter your password').fill(env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
});

test('list and help', async () => {
  await page.goto('/dashboard/supplier-list');
  await expect(page.getByRole('heading', { name: 'My listings', level: 1 })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'About this page: My listings' }).click();
  await expect(page.getByRole('dialog').getByText(/selling tin ore/)).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
});

test('step 1: material and stock are checked; new stock asks for what a batch needs', async () => {
  await page.getByRole('link', { name: 'New listing' }).first().click();
  await expect(page.getByRole('heading', { name: 'New listing', level: 1 })).toBeVisible({ timeout: 30_000 });
  await next();
  await expect(page.getByText('Choose the material', { exact: true })).toBeVisible();
  await pick(page.locator('#listing-material'), { index: 1 });
  await expect(page.getByTestId('listing-categories')).toContainText('Minerals');
  await pick(page.locator('#listing-unit'), { label: 'Metric tonne (t)' });
  await page.getByRole('button', { name: 'About Material' }).click();
  await expect(page.getByRole('note', { name: 'About Material' })).toContainText('exact thing you are selling');
  await page.keyboard.press('Escape');
  await next();
  await expect(page.getByText(/Tick at least one batch/)).toBeVisible();
  await page.getByText('Add new stock', { exact: true }).click();
  await next();
  await expect(page.getByText('Enter the quantity you physically have')).toBeVisible();
  await page.locator('#listing-new-quantity').fill('100');
  await pick(page.locator('#listing-new-source'), 'MINED');
  await page.locator('#listing-new-purity').fill('98.5');
  await page.locator('#listing-new-code').fill(batchCode);
  await shot('step-stock');
  await next();
});

test('steps 2 and 3 are checked; publishing needs 5 pictures, a draft does not', async () => {
  await next();
  await expect(page.getByText('Enter a name')).toBeVisible();
  await page.locator('#listing-name').fill(name);
  await page.locator('#listing-summary').fill('E2E test listing, tin ore from Jos');
  await page.locator('#listing-color').fill('Dark grey');
  await expect(page.getByText('(Optional)').first()).toBeVisible();
  await pick(page.locator('#listing-packaging'), { label: 'Custom' });
  await page.getByLabel('Your packaging').fill('25 kg woven bags');
  await pick(page.locator('#listing-sampling'), 'SGS');
  await page.getByLabel('Heading').fill('Assay');
  await page.getByTestId('section-text-0').locator('.tiptap').click();
  await page.keyboard.type('Sn 72%');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByRole('dialog').filter({ hasText: 'Preview description' }).getByText('Sn 72%')).toBeVisible();
  await page.getByRole('dialog').filter({ hasText: 'Preview description' }).getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByLabel('Add pictures').setInputFiles(pictures(1));
  await next();

  await next();
  await expect(page.getByText('Enter a price with up to 2 decimals').first()).toBeVisible();
  await page.locator('#listing-price').fill('1500.50');
  await expect(page.locator('#listing-price')).toHaveValue('1,500.50');
  await page.locator('#listing-minimum').fill('20');
  await page.locator('#listing-delivery').fill('30 days');
  for (const label of ['Payment terms', 'Shipping terms']) {
    const field = page.locator('div').filter({ has: page.getByText(label, { exact: true }) }).last();
    await field.getByRole('button').first().click();
    await page.getByText(label === 'Payment terms' ? 'T/T - Telegraphic Transfer' : 'FOB - Free On Board', { exact: true }).click();
    await page.getByRole('heading', { name: 'New listing', level: 1 }).click();
  }
  await shot('step-terms');
  await next();

  await expect(page.getByText('100 t', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(page.getByText(/Add at least 5 pictures to publish. You have 1/)).toBeVisible();
  await shot('step-review');

  await expect(page.getByText('25 kg woven bags')).toBeVisible();
  await page.getByRole('button', { name: 'Save as draft' }).click();
  await confirmIn(`Save ${name} as a draft?`, 'Save draft');
  await expect(page.getByRole('heading', { name: 'My listings', level: 1 })).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole('row').filter({ hasText: name }).getByText('Draft')).toBeVisible({ timeout: 15_000 });
});

test('edit a draft to add pictures and publish; quantity follows the batch', async () => {
  await page.getByRole('row').filter({ hasText: name }).click();
  await expect(sheet().getByText('98.5%')).toBeVisible({ timeout: 15_000 });
  await sheet().getByRole('link', { name: 'Edit' }).click();
  await expect(page.getByRole('heading', { name: `Edit ${name}`, level: 1 })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#listing-material')).toBeDisabled();
  await next();
  await expect(page.getByRole('list', { name: 'Current pictures' }).getByRole('listitem')).toHaveCount(1);
  await page.getByLabel('Add pictures').setInputFiles(pictures(4));
  await next();
  await next();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(page.getByText(/Choose where this is offered from to publish/).first()).toBeVisible();
  await page.getByRole('button', { name: /3\. Price and terms/ }).click();
  await pick(page.locator('#listing-site'), { index: 1 });
  await next();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await confirmIn(`Publish ${name}?`, 'Publish');
  await expect(page.getByRole('heading', { name: 'My listings', level: 1 })).toBeVisible({ timeout: 60_000 });
  const row = page.getByRole('row').filter({ hasText: name });
  await expect(row.getByText('Published')).toBeVisible({ timeout: 15_000 });
  await expect(row.getByText('100 t')).toBeVisible();
  await shot('list');
});

test('stock: a batch can stop counting, and the batch says which listing it backs', async () => {
  await page.getByRole('row').filter({ hasText: name }).click();
  await sheet().getByRole('tab', { name: 'Stock' }).click();
  const stock = page.getByRole('list', { name: 'Stock behind this listing' });
  await expect(stock.getByText(batchCode)).toBeVisible({ timeout: 15_000 });
  await stock.getByRole('button', { name: `Suspend ${batchCode}` }).click();
  await confirmIn(`Suspend ${batchCode}?`, 'Suspend');
  await expect(sheet().getByText('Available to buyers now: 0')).toBeVisible({ timeout: 15_000 });
  await shot('stock');
  await stock.getByRole('button', { name: `Resume ${batchCode}` }).click();
  await confirmIn(`Resume ${batchCode}?`, 'Resume');
  await expect(sheet().getByText('Available to buyers now: 100 t')).toBeVisible({ timeout: 15_000 });

  await page.goto('/dashboard/batches');
  await page.getByRole('row').filter({ hasText: batchCode }).click();
  const batch = page.getByRole('dialog').filter({ has: page.getByRole('tab', { name: 'Family' }) });
  await expect(batch.getByText(new RegExp(`${name} \\(LST-`))).toBeVisible({ timeout: 15_000 });
  await batch.getByRole('button', { name: 'Split' }).click();
  const split = page.getByRole('dialog').filter({ hasText: `Split ${batchCode}` });
  await expect(split.getByText(`Keep this part on ${name}`).first()).toBeVisible();
  await split.getByLabel(/^Quantity/).nth(0).fill('60');
  await split.getByLabel(/^Quantity/).nth(1).fill('40');
  await split.getByText(`Keep this part on ${name}`).nth(1).click();
  await split.getByRole('button', { name: 'Split batch' }).click();
  const warning = page.getByRole('dialog').filter({ hasText: `Split ${batchCode}?` });
  await warning.getByRole('button', { name: 'Split batch', exact: true }).click();
  await expect(batch.getByText(/On listing/)).toBeVisible({ timeout: 15_000 });

  await page.goto('/dashboard/supplier-list');
  await expect(page.getByRole('row').filter({ hasText: name }).getByText('60 t')).toBeVisible({ timeout: 30_000 });
});

test('a missing material can be requested, and shows as waiting', async () => {
  await page.goto('/dashboard/supplier-list/create');
  await expect(page.getByRole('heading', { name: 'New listing', level: 1 })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: /Can't find your material/ }).click();
  const form = page.getByRole('dialog').filter({ hasText: 'Ask MINMEG to add a material' });
  await form.getByRole('button', { name: 'Send request' }).click();
  await expect(form.getByText('Enter the name of the material')).toBeVisible();
  await form.locator('#request-name').fill(`E2E material ${stamp}`);
  await form.locator('#request-note').fill('E2E test request');
  await form.getByRole('button', { name: 'Send request' }).click();
  await confirmIn(`Ask MINMEG to add E2E material ${stamp}?`, 'Send request');
  const requests = page.getByRole('list', { name: 'Your material requests' });
  await expect(requests.getByText(`E2E material ${stamp}`)).toBeVisible({ timeout: 15_000 });
  await expect(requests.getByText('Waiting for MINMEG').first()).toBeVisible();
  await shot('material-request');
});

test('non-mineral: pick the categories and type the quantity; no batch, and the success screen links to it', async () => {
  const toolName = `E2E tool ${stamp}`;
  await page.goto('/dashboard/supplier-list/create');
  await expect(page.getByRole('heading', { name: 'New listing', level: 1 })).toBeVisible({ timeout: 30_000 });
  await page.getByText('Something else', { exact: true }).click();
  await next();
  await expect(page.getByText('Choose the unit')).toBeVisible();
  await pick(page.locator('#listing-category-0'), { label: 'Mining tools' });
  await pick(page.locator('#listing-category-1'), { index: 1 });
  while (await page.locator('#listing-category-2').isVisible() && (await page.locator('#listing-category-2').innerText()).includes('Choose one')) {
    await pick(page.locator('#listing-category-2'), { index: 1 });
  }
  await pick(page.locator('#listing-unit'), { label: 'Piece (pc)' });
  await page.locator('#listing-quantity').fill('4');
  await next();
  await page.locator('#listing-name').fill(toolName);
  await page.locator('#listing-summary').fill('E2E test tool');
  await page.getByLabel('Add pictures').setInputFiles(pictures(5));
  await next();
  await page.locator('#listing-price').fill('250000');
  await page.locator('#listing-delivery').fill('14 days');
  for (const label of ['Payment terms', 'Shipping terms']) {
    const field = page.locator('div').filter({ has: page.getByText(label, { exact: true }) }).last();
    await field.getByRole('button').first().click();
    await page.getByText(label === 'Payment terms' ? 'T/T - Telegraphic Transfer' : 'FOB - Free On Board', { exact: true }).click();
    await page.getByRole('heading', { name: 'New listing', level: 1 }).click();
  }
  await pick(page.locator('#listing-site'), { index: 1 });
  await next();
  await expect(page.getByText('4 pc', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await confirmIn(`Publish ${toolName}?`, 'Publish');
  await expect(page.getByText(`${toolName} is live`)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole('button', { name: 'Copy link' })).toBeVisible();
  await shot('non-mineral-live');

  await page.goto('/dashboard/supplier-list');
  const row = page.getByRole('row').filter({ hasText: toolName });
  await expect(row.getByText('Not a mineral')).toBeVisible({ timeout: 30_000 });
  await row.click();
  const details = page.getByRole('dialog').filter({ hasText: toolName });
  await expect(details.getByRole('tab', { name: 'Stock' })).toHaveCount(0);
  await details.getByRole('region', { name: 'Actions' }).getByRole('button', { name: 'Close', exact: true }).click();
  await confirmIn(`Close ${toolName}?`, 'Close');
  await details.getByRole('button', { name: 'Archive' }).click({ timeout: 15_000 });
  await confirmIn(`Archive ${toolName}?`, 'Archive');
  await expect(details.getByRole('button', { name: 'Archive' })).toHaveCount(0, { timeout: 15_000 });
  await details.getByRole('button', { name: 'Close', exact: true }).first().click();
});

test('status: pause, close frees the batches, relist, and archive keeps it as history', async () => {
  await page.getByRole('row').filter({ hasText: name }).click();
  await sheet().getByRole('button', { name: 'Pause' }).click();
  await confirmIn(`Pause ${name}?`, 'Pause');
  await expect(sheet().getByRole('button', { name: 'Publish' })).toBeVisible({ timeout: 15_000 });
  await sheet().getByRole('region', { name: 'Actions' }).getByRole('button', { name: 'Close', exact: true }).click();
  await confirmIn(`Close ${name}?`, 'Close');
  await expect(sheet().getByRole('button', { name: 'Relist' })).toBeVisible({ timeout: 15_000 });
  await sheet().getByRole('button', { name: 'Relist' }).click();
  await confirmIn(`Relist ${name}?`, 'Relist');
  await expect(sheet().getByRole('button', { name: 'Pause' })).toBeVisible({ timeout: 15_000 });
  await sheet().getByRole('region', { name: 'Actions' }).getByRole('button', { name: 'Close', exact: true }).click();
  await confirmIn(`Close ${name}?`, 'Close');
  await sheet().getByRole('button', { name: 'Archive' }).click();
  await confirmIn(`Archive ${name}?`, 'Archive');
  await expect(sheet().getByText('Archived')).toBeVisible({ timeout: 15_000 });
  await expect(sheet().getByRole('link', { name: 'Edit' })).toHaveCount(0);
});

test('phone width: the list and the form fit', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dashboard/supplier-list');
  await expect(page.getByRole('heading', { name: 'My listings', level: 1 })).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await page.goto('/dashboard/supplier-list/create');
  await expect(page.locator('#listing-material')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await shot('phone-form');
});
