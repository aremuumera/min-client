import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { test, expect, type Page } from '@playwright/test';

/*
 * Step 2.5 Inventory with a real supplier account against the local backend (desktop only). Registers
 * "E2EI…" batches and works through their life, then retires them. Batches aren't deleted, so retired
 * ones stay in the test supplier's history.
 *   E2E_PORT=3001 npx playwright test signed-in-inventory --project=desktop
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
test.describe.configure({ mode: 'serial', timeout: 75_000 });

let page: Page;
const stamp = Date.now().toString(36).toUpperCase();
const code = `E2EI-${stamp}`;
const shot = async (name: string) => {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `tests/e2e/.results/inventory-${name}.png` });
};
const confirmIn = async (title: RegExp | string, button: string) => {
  const dialog = page.getByRole('dialog').filter({ hasText: title });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: button, exact: true }).click();
};
const reasonConfirm = async (title: RegExp | string, reason: string, button: string) => {
  const dialog = page.getByRole('dialog').filter({ hasText: title });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox').fill(reason);
  await dialog.getByRole('button', { name: button, exact: true }).click();
};
// The smallest valid PDF
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 72 72]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');
const detail = () => page.getByRole('dialog').filter({ has: page.getByRole('tab', { name: 'Family' }) });

/** Registers one batch through the form; the material and the unit are the first that fit each other */
async function register(batchCode: string, quantity: string) {
  await page.getByRole('button', { name: 'Register batch' }).first().click();
  const sheet = page.getByRole('dialog').filter({ hasText: 'Register a batch' });
  await sheet.getByLabel('Material').selectOption({ index: 1 });
  await sheet.getByLabel('Quantity').fill(quantity);
  await sheet.getByLabel('Unit').selectOption({ label: 'Metric tonne (t)' });
  await sheet.getByLabel('Where it came from').selectOption('MINED');
  await sheet.getByLabel('Batch code').fill(batchCode);
  await sheet.getByRole('button', { name: 'Register batch' }).click();
  await confirmIn(/Register [\d.,]+ t of /, 'Register batch');
  await expect(detail().getByRole('heading', { name: batchCode })).toBeVisible({ timeout: 15_000 });
}

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await quietLogins(context, env.E2E_RUN_SECRET);
  page = await context.newPage();
  await page.goto('/auth/sign-in');
  await page.getByPlaceholder('Enter your email').fill(env.E2E_SUPPLIER);
  await page.getByPlaceholder('Enter your password').fill(env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
});

test('menu and help', async () => {
  await expect(page.getByText('Inventory', { exact: true }).first()).toBeVisible({ timeout: 30_000 });
  await page.goto('/dashboard/batches');
  await expect(page.getByRole('heading', { name: 'Inventory', level: 1 })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'About this page: Inventory' }).click();
  await expect(page.getByRole('dialog').getByText(/tin ore from Jos/)).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
});

test('register: fields are checked, it asks first, and the quantity opens the ledger', async () => {
  await page.getByRole('button', { name: 'Register batch' }).first().click();
  const sheet = page.getByRole('dialog').filter({ hasText: 'Register a batch' });
  await sheet.getByRole('button', { name: 'Register batch' }).click();
  await expect(sheet.getByText('Choose the material')).toBeVisible();
  await expect(sheet.getByText('Enter the quantity you physically have')).toBeVisible();
  await sheet.getByRole('button', { name: 'Cancel' }).click();

  await register(code, '100');
  await expect(detail().getByText('100 t').first()).toBeVisible();
  await shot('detail');
  await detail().getByRole('tab', { name: 'Ledger' }).click();
  await expect(page.getByRole('list', { name: 'Quantity ledger' }).getByText(/First registration: \+ 100 t/)).toBeVisible();
});

test('change quantity: the reason is required; a measurement that matches changes nothing', async () => {
  await detail().getByRole('tab', { name: 'Details' }).click();
  await detail().getByRole('button', { name: 'Change quantity' }).click();
  const sheet = page.getByRole('dialog').filter({ hasText: `Change quantity of ${code}` });
  await sheet.getByLabel('Amount').fill('2.5');
  await sheet.getByRole('button', { name: 'Record change' }).click();
  await expect(sheet.getByText(/Explain why/)).toBeVisible();
  await sheet.getByLabel('Reason').fill('E2E spillage at the yard');
  await sheet.getByRole('button', { name: 'Record change' }).click();
  await confirmIn(/Record a reduction of 2\.5 t/, 'Record change');
  await expect(detail().getByText('97.5 t').first()).toBeVisible({ timeout: 15_000 });

  await detail().getByRole('button', { name: 'Check against a measurement' }).click();
  const check = page.getByRole('dialog').filter({ hasText: `Check ${code} against a measurement` });
  await check.getByLabel('Measured quantity').fill('97.5');
  await check.getByRole('button', { name: 'Record measurement' }).click();
  await confirmIn(/Record a measurement of 97\.5/, 'Record measurement');
  await expect(page.getByText('The measurement matches the record')).toBeVisible({ timeout: 15_000 });
  await expect(detail().getByText('97.5 t').first()).toBeVisible();
});

test('hold: blocks the actions until released', async () => {
  await detail().getByRole('button', { name: 'Place on hold' }).click();
  await reasonConfirm(/Place .* on hold/, 'E2E checking the assay', 'Place on hold');
  await expect(detail().getByText(/On hold: E2E checking the assay/)).toBeVisible({ timeout: 15_000 });
  await expect(detail().getByRole('button', { name: 'Split' })).toHaveCount(0);
  await detail().getByRole('button', { name: 'Release hold' }).click();
  await reasonConfirm(/Release .*\?/, 'E2E assay confirmed', 'Release hold');
  await expect(detail().getByRole('button', { name: 'Split' })).toBeVisible({ timeout: 15_000 });
});

test('split: must add up exactly, warns it is final, and the family is recorded', async () => {
  await detail().getByRole('button', { name: 'Split' }).click();
  const sheet = page.getByRole('dialog').filter({ hasText: `Split ${code}` });
  await sheet.getByLabel(/^Quantity/).nth(0).fill('60');
  await sheet.getByLabel(/^Quantity/).nth(1).fill('30');
  await expect(sheet.getByTestId('split-left')).toHaveText('Left to assign: 7.5 t');
  await sheet.getByRole('button', { name: 'Split batch' }).click();
  await expect(sheet.getByText(/must add up exactly to 97\.5 t/)).toBeVisible();
  await sheet.getByLabel(/^Quantity/).nth(1).fill('37.5');
  await expect(sheet.getByTestId('split-left')).toHaveText('Adds up exactly');
  await shot('split');
  await sheet.getByLabel('Batch code').nth(0).fill(`${code}-A`);
  await sheet.getByLabel('Batch code').nth(1).fill(`${code}-B`);
  await sheet.getByRole('button', { name: 'Split batch' }).click();
  const warning = page.getByRole('dialog').filter({ hasText: `Split ${code}?` });
  await expect(warning.getByText(/can't be undone/)).toBeVisible();
  await warning.getByRole('button', { name: 'Split batch', exact: true }).click();

  await expect(detail().getByRole('heading', { name: `${code}-A` })).toBeVisible({ timeout: 15_000 });
  await detail().getByRole('tab', { name: 'Family' }).click();
  await expect(detail().getByRole('button', { name: new RegExp(`^${code} `) })).toBeVisible({ timeout: 15_000 });
  await shot('family');
  await detail().getByRole('tab', { name: 'History' }).click();
  await expect(detail().getByText(/split/i).first()).toBeVisible({ timeout: 15_000 });
});

test('merge the two parts, then retire: the remainder is written off and it stays readable', async () => {
  await detail().getByRole('tab', { name: 'Details' }).click();
  await detail().getByRole('button', { name: 'Merge' }).click();
  const sheet = page.getByRole('dialog').filter({ hasText: `Merge ${code}-A` });
  await sheet.getByRole('button', { name: 'Merge batches' }).click();
  await expect(sheet.getByText('Choose at least one other batch')).toBeVisible();
  await sheet.getByLabel(new RegExp(`${code}-B`)).check();
  await sheet.getByLabel('New batch code').fill(`${code}-M`);
  await sheet.getByRole('button', { name: 'Merge batches' }).click();
  await confirmIn(/Merge 2 batches\?/, 'Merge batches');
  await expect(detail().getByRole('heading', { name: `${code}-M` })).toBeVisible({ timeout: 15_000 });
  await expect(detail().getByText('97.5 t').first()).toBeVisible();

  await detail().getByRole('button', { name: 'Retire' }).click();
  await reasonConfirm(/Retire .*\?/, 'E2E test finished', 'Retire batch');
  await expect(detail().getByText(/This batch has ended/)).toBeVisible({ timeout: 15_000 });
  await expect(detail().getByRole('button', { name: 'Split' })).toHaveCount(0);
  await page.keyboard.press('Escape');
});

test('process: the whole batch becomes the output, which can be another quantity', async () => {
  await register(`${code}-P`, '10');
  await detail().getByRole('button', { name: 'Process' }).click();
  const sheet = page.getByRole('dialog').filter({ hasText: `Process ${code}-P` });
  await sheet.getByLabel('Material').selectOption({ index: 1 });
  await sheet.getByLabel('Quantity').fill('8');
  await sheet.getByLabel('Batch code').fill(`${code}-O`);
  await sheet.getByRole('button', { name: 'Record processing' }).click();
  await confirmIn(/Process all of/, 'Record processing');
  await expect(detail().getByRole('heading', { name: `${code}-O` })).toBeVisible({ timeout: 15_000 });
  await detail().getByRole('button', { name: 'Retire' }).click();
  await reasonConfirm(/Retire .*\?/, 'E2E test finished', 'Retire batch');
  await expect(detail().getByText(/This batch has ended/)).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press('Escape');
});

test('documents: a vault file is attached, then backs a quantity change, and can be removed', async () => {
  const fileName = `e2e-weighbridge-${stamp}.pdf`;
  await page.goto('/dashboard/documents');
  await expect(page.getByRole('heading', { name: /documents/i, level: 1 })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Upload', exact: true }).first().click();
  const upload = page.getByRole('dialog').filter({ hasText: 'Upload documents' });
  await page.getByLabel('Files to upload').setInputFiles({ name: fileName, mimeType: 'application/pdf', buffer: PDF });
  await upload.getByRole('button', { name: 'Upload 1 file' }).click();
  await confirmIn('Upload 1 file?', 'Upload');
  await expect(upload.getByLabel('Uploaded')).toBeVisible({ timeout: 30_000 });

  await page.goto('/dashboard/batches');
  await expect(page.getByRole('heading', { name: 'Inventory', level: 1 })).toBeVisible({ timeout: 30_000 });
  await register(`${code}-D`, '5');
  await detail().getByRole('tab', { name: 'Documents' }).click();
  await detail().getByRole('button', { name: 'Attach a document' }).click();
  await detail().getByLabel('File').selectOption({ label: fileName });
  await detail().getByRole('button', { name: 'Attach', exact: true }).click();
  await confirmIn(`Attach ${fileName}?`, 'Attach');
  await expect(page.getByRole('list', { name: 'Batch documents' }).getByText(fileName)).toBeVisible({ timeout: 15_000 });
  await shot('documents');

  await detail().getByRole('tab', { name: 'Details' }).click();
  await detail().getByRole('button', { name: 'Change quantity' }).click();
  const sheet = page.getByRole('dialog').filter({ hasText: `Change quantity of ${code}-D` });
  await sheet.getByLabel('Amount').fill('1');
  await sheet.getByLabel('Reason').fill('E2E weighbridge correction');
  await sheet.getByLabel('Supporting document').selectOption({ label: fileName });
  await sheet.getByRole('button', { name: 'Record change' }).click();
  await confirmIn(/Record a reduction of 1 t/, 'Record change');
  await expect(detail().getByText('4 t').first()).toBeVisible({ timeout: 15_000 });

  await detail().getByRole('button', { name: 'Retire' }).click();
  await reasonConfirm(/Retire .*\?/, 'E2E test finished', 'Retire batch');
  await expect(detail().getByText(/This batch has ended/)).toBeVisible({ timeout: 15_000 });
  await detail().getByRole('tab', { name: 'Documents' }).click();
  await detail().getByRole('button', { name: `Remove ${fileName}` }).click();
  await reasonConfirm(`Remove ${fileName}?`, 'E2E test finished', 'Remove');
  await expect(page.getByRole('list', { name: 'Batch documents' })).toHaveCount(0, { timeout: 15_000 });
  await page.keyboard.press('Escape');
});

test('phone width: the list and the form fit', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dashboard/batches');
  await expect(page.getByRole('heading', { name: 'Inventory', level: 1 })).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: 'Register batch' }).first().click();
  await shot('phone-form');
  await expect(page.getByRole('dialog').getByLabel('Material')).toBeVisible();
});
