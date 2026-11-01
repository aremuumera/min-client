import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { test, expect, type Page } from '@playwright/test';
import { pick } from './pick';

/*
 * Step 2.4 My sites with a real buyer account against the local backend (desktop only). Makes one
 * "E2E site" with a checkpoint, using the real map, then deactivates both. Sites aren't deleted, so
 * an inactive E2E site stays in the test buyer's list unless the local cleanup removes it.
 *   E2E_PORT=3002 npx playwright test signed-in-sites --project=desktop
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

test.skip(!env.E2E_PASSWORD || !env.E2E_BUYER, 'no .env.e2e.local');
test.beforeAll(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop only'));
test.describe.configure({ mode: 'serial', timeout: 90_000 });

let page: Page;
const stamp = Date.now().toString(36);
const siteName = `E2E site ${stamp}`;
const shot = async (name: string) => {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `tests/e2e/.results/sites-${name}.png` });
};
const confirmIn = async (title: RegExp | string, button: string) => {
  const dialog = page.getByRole('dialog').filter({ hasText: title });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: button, exact: true }).click();
};
const clickMap = async (x = 0.5, y = 0.5) => {
  const map = page.getByRole('dialog').getByTestId('map-picker').first();
  await map.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600); // the map sizes itself once the sheet has slid in
  const box = (await map.boundingBox())!;
  await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
};

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await quietLogins(context, env.E2E_RUN_SECRET);
  page = await context.newPage();
  await page.goto('/auth/sign-in');
  await page.getByPlaceholder('Enter your email').fill(env.E2E_BUYER);
  await page.getByPlaceholder('Enter your password').fill(env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
});

test('menu and help', async () => {
  await expect(page.getByText('My sites', { exact: true }).first()).toBeVisible({ timeout: 30_000 });
  await page.goto('/dashboard/sites');
  await expect(page.getByRole('heading', { name: 'My sites', level: 1 })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'About this page: My sites' }).click();
  await expect(page.getByRole('dialog').getByText(/a tin mine in Jos/)).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
});

test('add a site: fields are checked, the map drops a pin, it asks first, then it saves', async () => {
  await page.getByRole('button', { name: 'Add site' }).first().click();
  const sheet = page.getByRole('dialog').filter({ hasText: 'Add a site' });
  await sheet.getByRole('button', { name: 'Create site' }).click();
  await expect(sheet.getByText('Enter a name')).toBeVisible();
  await expect(sheet.getByText('Choose the kind of site')).toBeVisible();

  await sheet.getByLabel('Name').fill(siteName);
  await pick(sheet.getByLabel('Kind of site'), 'MINE_LOCATION');
  await pick(sheet.getByLabel('State or region'), { index: 1 });
  await sheet.getByLabel('City or town').fill('Barkin Ladi');
  await clickMap();
  await expect(sheet.getByLabel('Latitude')).not.toHaveValue('');
  await expect(sheet.getByLabel('Longitude')).not.toHaveValue('');
  await sheet.getByLabel('Zone radius (metres)').fill('500');
  await shot('form');

  // an outline needs at least 3 points
  await sheet.getByRole('button', { name: 'Draw outline' }).click();
  await clickMap(0.4, 0.4);
  await sheet.getByRole('button', { name: 'Create site' }).click();
  await expect(sheet.getByText('An outline needs at least 3 points')).toBeVisible();
  await clickMap(0.6, 0.4);
  await clickMap(0.5, 0.6);

  await sheet.getByRole('button', { name: 'Create site' }).click();
  await confirmIn(`Create ${siteName}?`, 'Create site');
  const detail = page.getByRole('dialog').filter({ hasText: 'Site ID' });
  await expect(detail.getByText('Drawn outline')).toBeVisible({ timeout: 15_000 });
  await expect(detail.getByTestId('map-picker').locator('img.leaflet-tile-loaded').first()).toBeVisible({ timeout: 20_000 });
  await shot('detail');
});

test('a checkpoint with requirements and its own zone; a repeated code is refused', async () => {
  const detail = page.getByRole('dialog').filter({ hasText: 'Site ID' });
  const addOne = async (name: string) => {
    await detail.getByRole('button', { name: 'Add checkpoint' }).click();
    const form = page.getByRole('dialog').filter({ hasText: 'Add a checkpoint' });
    await form.getByLabel('Name').fill(name);
    await pick(form.getByLabel('What happens here'), 'WEIGHBRIDGE');
    return form;
  };
  const form = await addOne('Main weighbridge');
  await form.getByText('Scan a code (QR, NFC or seal)').click();
  await form.getByText('Be inside the zone (GPS)').click();
  await form.getByRole('button', { name: 'Add a measurement' }).click();
  await pick(form.getByLabel('Measurement 1', { exact: true }), 'MASS');
  await form.getByText('Compare with the quantity shipped').click();
  await form.getByText(/has its own zone/).click();
  await clickMap();
  await form.getByLabel('Zone radius (metres)').fill('50');
  await shot('checkpoint');
  await form.getByRole('button', { name: 'Add checkpoint' }).click();
  await confirmIn('Add Main weighbridge?', 'Add checkpoint');
  const list = detail.getByRole('list', { name: 'Checkpoints' });
  await expect(list.getByText(/scan, GPS, 1 measurement/)).toBeVisible({ timeout: 15_000 });

  const again = await addOne('Main weighbridge');
  await again.getByRole('button', { name: 'Add checkpoint' }).click();
  await confirmIn('Add Main weighbridge?', 'Add checkpoint');
  await expect(again.getByText(/already|exists/i).first()).toBeVisible({ timeout: 15_000 });
  await again.getByRole('button', { name: 'Cancel' }).click();
});

test('the backend refuses to deactivate a site with active checkpoints; in order, both deactivate', async () => {
  const detail = page.getByRole('dialog').filter({ hasText: 'Site ID' });
  await detail.getByRole('button', { name: 'Deactivate', exact: true }).click();
  await confirmIn(`Deactivate ${siteName}?`, 'Deactivate');
  await expect(page.locator('[data-sonner-toast]').getByText(/checkpoint/i).first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole('dialog').filter({ hasText: `Deactivate ${siteName}?` }).getByRole('button', { name: 'Cancel' }).click();

  await detail.getByRole('button', { name: 'Deactivate Main weighbridge' }).click();
  await confirmIn('Deactivate Main weighbridge?', 'Deactivate');
  await expect(detail.getByRole('button', { name: 'Activate Main weighbridge' })).toBeVisible({ timeout: 15_000 });
  await detail.getByRole('button', { name: 'Deactivate', exact: true }).click();
  await confirmIn(`Deactivate ${siteName}?`, 'Deactivate');
  await expect(detail.getByRole('button', { name: 'Activate', exact: true })).toBeVisible({ timeout: 15_000 });
  await detail.getByRole('button', { name: 'Close', exact: true }).click();
});

test('phone width: the list and the form fit; the map has real map images', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dashboard/sites');
  await expect(page.getByRole('heading', { name: 'My sites', level: 1 })).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: 'Add site' }).first().click();
  const map = page.getByRole('dialog').getByTestId('map-picker');
  await map.scrollIntoViewIfNeeded();
  await expect(map.locator('img.leaflet-tile-loaded').first()).toBeVisible({ timeout: 20_000 });
  await shot('phone-form');
});
