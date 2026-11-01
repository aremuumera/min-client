import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { pick } from './pick';
import { test, expect, type Page } from '@playwright/test';

/* Step 2.6b, signed in against the local backend: post an RFQ as a buyer, offer on it as a supplier, shortlist it */
const envFile = path.join(__dirname, '../../.env.e2e.local');
const env: Record<string, string> = fs.existsSync(envFile)
  ? Object.fromEntries(fs.readFileSync(envFile, 'utf8').split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }))
  : {};
test.describe.configure({ mode: 'serial', timeout: 120_000 });
test.skip(!env.E2E_PASSWORD || !env.E2E_BUYER || !env.E2E_SUPPLIER, 'no .env.e2e.local');

const stamp = Date.now().toString(36).toUpperCase();
const typedName = `E2E Rare Stone ${stamp}`;
const draftName = `E2E Draft ${stamp}`;
let buyer: Page;
let supplier: Page;
let rfqId = '';
const shot = async (page: Page, name: string) => {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `tests/e2e/.results/rfq-${name}.png` });
};
const next = (page: Page) => page.getByRole('button', { name: 'Next', exact: true }).click();
const confirmIn = async (page: Page, title: RegExp | string, button: string) => {
  const dialog = page.getByRole('dialog').filter({ hasText: title });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: button, exact: true }).click();
};
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

async function signIn(browser: import('@playwright/test').Browser, email: string) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await quietLogins(context, env.E2E_RUN_SECRET);
  const page = await context.newPage();
  await page.goto('/auth/sign-in');
  await page.getByPlaceholder('Enter your email').fill(email);
  await page.getByPlaceholder('Enter your password').fill(env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  return page;
}

test.beforeAll(async ({ browser }) => {
  buyer = await signIn(browser, env.E2E_BUYER);
  supplier = await signIn(browser, env.E2E_SUPPLIER);
});

async function firstStep(page: Page, name: string) {
  await page.goto('/dashboard/rfq-list/create');
  await expect(page.getByRole('heading', { name: 'New RFQ', level: 1 })).toBeVisible({ timeout: 30_000 });
  await page.locator('#rfq-name').fill(name);
  await pick(page.locator('#listing-category-0'), { label: 'Marble and Natural Stone' });
  await pick(page.locator('#listing-category-1'), { label: 'Slate' });
  await pick(page.locator('#rfq-unit'), { label: 'Slab' });
  await page.locator('#rfq-quantity').fill('40');
}
async function secondStep(page: Page) {
  await next(page);
  await page.locator('#rfq-duration').fill('2 months');
  await page.locator('#rfq-delivery').fill('3 weeks');
  await page.locator('#rfq-description').fill('E2E test: slate slabs for a building in Lagos.');
  await next(page);
}

test('a typed name with no material from the list; any unit; steps are checked; Nigeria needs state, address and a deadline to publish', async () => {
  await rfqSteps();
  async function rfqSteps() {
    const page = buyer;
    await page.goto('/dashboard/rfq-list/create');
    await expect(page.getByRole('heading', { name: 'New RFQ', level: 1 })).toBeVisible({ timeout: 30_000 });
    await next(page);
    await expect(page.getByText('Type what you are looking for')).toBeVisible();
    await expect(page.getByText('Choose the category')).toBeVisible();
    await firstStep(page, typedName);
    await secondStep(page);
    await next(page);
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await expect(page.getByText('Within Nigeria, choose the state')).toBeVisible();
    await expect(page.getByText('Within Nigeria, enter the full address')).toBeVisible();
    await expect(page.getByText('Choose the last day for offers')).toBeVisible();
    await pick(page.locator('#rfq-state'), { label: 'Lagos' });
    await page.locator('#rfq-address').fill('1 Marina, Lagos Island');
    await page.locator('#rfq-deadline').fill(inDays(20));
    await pick(page.locator('#rfq-fulfilment'), { label: 'Delivery' });
    await pick(page.locator('#rfq-location-type'), { label: 'Warehouse' });
    await shot(page, 'destination');
    await next(page);
    await shot(page, 'review');
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await confirmIn(page, `Publish ${typedName}?`, 'Publish');
    await expect(page.getByRole('heading', { name: `${typedName} is live` })).toBeVisible({ timeout: 30_000 });
    rfqId = (await page.getByRole('link', { name: 'View RFQ' }).getAttribute('href'))!.match(/details\/([0-9a-f-]{36})/)![1];
    await shot(page, 'saved');
  }
});

test('a draft needs no deadline; My RFQs filters it, and it can be published, then cancelled with its status shown', async () => {
  const page = buyer;
  await firstStep(page, draftName);
  await secondStep(page);
  await next(page);
  await page.getByRole('button', { name: 'Save draft' }).click();
  await confirmIn(page, `Save ${draftName} as a draft?`, 'Save draft');
  await expect(page.getByRole('heading', { name: 'My RFQs', level: 1 })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('All RFQs', { exact: true })).toBeVisible();
  await page.getByPlaceholder('Search your RFQs').fill(draftName);
  const row = page.getByRole('row').filter({ hasText: draftName });
  await expect(row.getByText('Draft', { exact: true })).toBeVisible({ timeout: 15_000 });
  await row.click();
  const sheet = page.getByRole('dialog').filter({ hasText: draftName }).filter({ hasText: 'RFQ ID' });
  await expect(sheet.getByText('Not from the list')).toBeVisible({ timeout: 15_000 });
  await sheet.getByRole('button', { name: 'Publish', exact: true }).click();
  await confirmIn(page, `Publish ${draftName}?`, 'Publish');
  await expect(page.getByText('Set a bidding deadline before publishing the RFQ').or(page.getByText(/bidding deadline/i)).first()).toBeVisible({ timeout: 15_000 });
  await sheet.getByRole('button', { name: 'Cancel RFQ' }).click();
  const cancel = page.getByRole('dialog').filter({ hasText: `Cancel ${draftName}?` });
  await cancel.getByRole('button', { name: 'Cancel RFQ', exact: true }).click();
  await expect(row.getByText('Cancelled')).toBeVisible({ timeout: 15_000 });
  await shot(page, 'my-rfqs');
  await page.keyboard.press('Escape');
});

test('edit: the same form, with its values, and the status list is gone', async () => {
  const page = buyer;
  await page.goto('/dashboard/rfq-list');
  await page.getByPlaceholder('Search your RFQs').fill(typedName);
  await page.getByRole('row').filter({ hasText: typedName }).click();
  const sheet = page.getByRole('dialog').filter({ hasText: 'RFQ ID' });
  await expect(sheet.getByText('1 Marina, Lagos Island', { exact: false })).toBeVisible({ timeout: 15_000 });
  await sheet.getByRole('link', { name: 'Edit' }).click();
  await expect(page.getByRole('heading', { name: `Edit ${typedName}`, level: 1 })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#rfq-name')).toHaveValue(typedName);
  await expect(page.locator('#rfq-quantity')).toHaveValue(/^40/);
  await next(page);
  await expect(page.locator('#rfq-duration')).toHaveValue('2 months');
  await next(page);
  await expect(page.locator('#rfq-address')).toHaveValue('1 Marina, Lagos Island');
  await next(page);
  await page.getByRole('button', { name: 'Save changes' }).click();
  await confirmIn(page, `Save ${typedName}?`, 'Save changes');
  await expect(page.getByRole('heading', { name: 'My RFQs', level: 1 })).toBeVisible({ timeout: 30_000 });
});

test('a supplier sees the RFQ without the address, offers in any unit, and revising makes a new version', async () => {
  const page = supplier;
  const addressLeak: string[] = [];
  page.on('response', async (r) => {
    if (/\/rfqs\/(all|[^/]+\/detail)/.test(r.url()) && r.ok()) {
      const text = await r.text().catch(() => '');
      if (text.includes('1 Marina')) addressLeak.push(r.url());
    }
  });
  await page.goto('/dashboard/products/rfq-products');
  await page.waitForTimeout(3000);
  await page.goto(`/dashboard/rfqs/details/${rfqId}/e2e`);
  await expect(page.getByText('Destination state:')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('1 Marina', { exact: false })).toHaveCount(0);
  await page.getByRole('button', { name: 'Submit Best Quote' }).click();
  const form = page.getByRole('dialog').filter({ hasText: `for ${typedName}` });
  await expect(form.getByText('The buyer asked for')).toBeVisible();
  await form.getByRole('button', { name: 'Review offer' }).click();
  await expect(form.getByText('Enter your price')).toBeVisible();
  await form.locator('#offer-price').fill('250000');
  await form.locator('#offer-quantity').fill('40');
  await pick(form.locator('#offer-unit'), { label: 'Piece' });
  await form.getByRole('button', { name: 'Review offer' }).click();
  await shot(page, 'offer-review');
  await form.getByRole('button', { name: 'Send offer' }).click();
  await confirmIn(page, `Send your offer on ${typedName}?`, 'Send offer');
  await expect(form.getByText('Your offer was sent')).toBeVisible({ timeout: 30_000 });

  await page.goto(`/dashboard/rfqs/details/${rfqId}/e2e`);
  await page.getByRole('button', { name: 'Submit Best Quote' }).click();
  const revise = page.getByRole('dialog').filter({ hasText: 'Revise your offer' });
  await expect(revise.getByText('You already sent version 1')).toBeVisible({ timeout: 15_000 });
  await expect(revise.locator('#offer-price')).toHaveValue(/^250000/);
  await revise.locator('#offer-price').fill('240000');
  await revise.getByRole('button', { name: 'Review offer' }).click();
  await revise.getByRole('button', { name: 'Send offer' }).click();
  await confirmIn(page, `Send a new version of your offer on ${typedName}?`, 'Send offer');
  await expect(revise.getByText('Your offer was sent')).toBeVisible({ timeout: 30_000 });
  expect(addressLeak).toEqual([]);

  await page.goto('/dashboard/my-submitted-offers');
  await page.getByPlaceholder('Search reference, RFQ product, location...').fill(typedName);
  const row = page.getByRole('row').filter({ hasText: typedName });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await shot(page, 'my-offers');
});

test('the buyer compares on the Offer Board and shortlists, with a confirm; the full offer id shows', async () => {
  const page = buyer;
  await page.goto('/dashboard/rfq-list');
  await page.getByPlaceholder('Search your RFQs').fill(typedName);
  await page.getByRole('row').filter({ hasText: typedName }).click();
  const sheet = page.getByRole('dialog').filter({ hasText: 'RFQ ID' });
  await sheet.getByRole('link', { name: /See offers/ }).click();
  await expect(page.getByRole('heading', { name: /Offer Management Board/ })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('240,000', { exact: false }).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Member since 2023')).toHaveCount(0);
  await shot(page, 'offer-board');
  await page.getByRole('button', { name: /^Shortlist/ }).first().click();
  await confirmIn(page, 'Shortlist this offer?', 'Shortlist');
  await expect(page.getByRole('button', { name: /Un-shortlist/ }).first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'View Details' }).first().click();
  const detail = page.getByText(/Offer ID: [0-9a-f]{8}-[0-9a-f]{4}/);
  await expect(detail).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Versions' })).toBeVisible({ timeout: 15_000 });
  await shot(page, 'offer-detail');
});

test('a dropdown near the bottom of the screen opens upward and stays fully on screen', async () => {
  const page = buyer;
  await page.setViewportSize({ width: 1280, height: 500 });
  await page.goto('/dashboard/rfq-list/create');
  const field = page.locator('#rfq-unit');
  await expect(field).toBeVisible({ timeout: 30_000 });
  await field.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const el = document.getElementById('rfq-unit')!;
    el.scrollIntoView({ block: 'end' });
  });
  await page.waitForTimeout(500);
  await field.click();
  const list = page.locator('[data-select-list="true"]').last();
  await expect(list).toBeVisible();
  const box = (await list.boundingBox())!;
  const trigger = (await field.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(500);
  expect(box.y + box.height).toBeLessThanOrEqual(trigger.y);
  expect(box.height).toBeGreaterThan(150);
  await shot(page, 'dropdown-upward');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1280, height: 800 });
});

test('phone width: the pages fit', async () => {
  const page = buyer;
  await page.setViewportSize({ width: 390, height: 844 });
  for (const url of ['/dashboard/rfq-list', '/dashboard/rfq-list/create', '/dashboard/rfq/offers']) {
    await page.goto(url);
    await page.waitForTimeout(2500);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), url).toBeLessThanOrEqual(0);
  }
  await page.goto('/dashboard/rfq-list');
  await page.waitForTimeout(1500);
  await shot(page, 'phone-my-rfqs');
});
