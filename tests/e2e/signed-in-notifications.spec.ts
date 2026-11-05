import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { API, emailOff, login, raiseTestAlert, type Party } from './alert-setup';
import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

/*
 * Step 2.13, supplier side, signed in against the local backend, in-app only (no email is sent):
 * notification settings are kept; the inbox marks everything read; the supplier sees an alert on
 * its shipment and acknowledges it; MINMEG resolving it arrives in the bell live, and opening the
 * notice marks it read and opens the alert.
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
test.describe.configure({ mode: 'serial', timeout: 150_000 });
test.skip(!env.E2E_PASSWORD || !env.E2E_SUPPLIER || !env.E2E_BUYER || !env.E2E_TEST_SUPER_ADMIN || !env.E2E_SUPER_ADMIN, 'no .env.e2e.local');

const RUN = Date.now().toString(36).toUpperCase();
let api: APIRequestContext;
let page: Page;
let staff: Party;
let alert = { id: '', title: '' };

test.beforeAll(async ({ browser, playwright }) => {
  test.setTimeout(300_000);
  api = await playwright.request.newContext();
  const supplier = await login(api, env, 'umera/login', env.E2E_SUPPLIER);
  const buyer = await login(api, env, 'umera/login', env.E2E_BUYER);
  staff = await login(api, env, 'aremu_check_admin_login', env.E2E_TEST_SUPER_ADMIN);
  const otherStaff = await login(api, env, 'aremu_check_admin_login', env.E2E_SUPER_ADMIN);
  await emailOff(api, supplier, buyer, staff, otherStaff);
  alert = (await raiseTestAlert(api, supplier, buyer, staff, RUN)).alert;

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

test('settings: email stays off; quiet hours are saved and kept', async () => {
  await page.goto('/dashboard/settings/notifications');
  const form = page.getByTestId('notification-settings');
  await expect(form.getByRole('checkbox', { name: 'Email', exact: true })).not.toBeChecked({ timeout: 60_000 });
  await expect(form.getByText('Critical notices are always emailed too', { exact: false })).toBeVisible();
  const quiet = form.getByRole('checkbox', { name: 'No email or phone notifications during these hours' });
  const was = await quiet.isChecked();
  const save = async () => {
    await form.getByRole('button', { name: 'Save settings' }).click();
    await page.getByRole('dialog').filter({ hasText: 'Save your notification settings?' }).getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('dialog').filter({ hasText: 'Save your notification settings?' })).toHaveCount(0, { timeout: 30_000 });
  };
  await quiet.setChecked(!was, { force: true }); // the styled box covers the input
  await save();
  await page.reload();
  await expect(form.getByRole('checkbox', { name: 'No email or phone notifications during these hours' })).toBeChecked({ checked: !was, timeout: 60_000 });
  await expect(form.getByRole('checkbox', { name: 'Email', exact: true })).not.toBeChecked();
  await page.screenshot({ path: 'tests/e2e/.results/notifications-settings.png' });
  await form.getByRole('checkbox', { name: 'No email or phone notifications during these hours' }).setChecked(was, { force: true });
  await save();
});

test('inbox: the Notifications page lists notices; Mark all as read clears the bell', async () => {
  await page.goto('/dashboard/notifications');
  const inbox = page.getByTestId('inbox-page');
  await expect(inbox.locator('[data-testid^="notice-"]').first()).toBeVisible({ timeout: 60_000 });
  const markAll = page.getByRole('button', { name: 'Mark all as read' }).first();
  if (await markAll.isVisible()) await markAll.click();
  await expect(page.getByTestId('inbox-count')).toHaveCount(0, { timeout: 30_000 });
  await expect(inbox.locator('[data-unread="true"]')).toHaveCount(0);
  await page.screenshot({ path: 'tests/e2e/.results/notifications-inbox.png' });
});

test('alerts: the supplier sees the alert on its shipment (dispatched before its inspection) and acknowledges it', async () => {
  await page.goto('/dashboard/alerts');
  const row = page.getByRole('row').filter({ hasText: `E2E ${RUN}` });
  await row.click({ timeout: 60_000 });
  const sheet = page.getByTestId(`alert-${alert.id}`);
  await expect(sheet.getByText(`E2E ${RUN}: notifications and alerts test`, { exact: false })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: /Resolve|Dismiss/ })).toHaveCount(0);
  await page.screenshot({ path: 'tests/e2e/.results/alerts-supplier.png' });
  await sheet.getByRole('button', { name: 'Acknowledge' }).click();
  const confirm = page.getByRole('dialog').filter({ hasText: 'Acknowledge this alert?' });
  await confirm.getByRole('textbox').fill(`E2E ${RUN}: we know, the inspection is booked`);
  await confirm.getByRole('button', { name: 'Acknowledge' }).click();
  await expect(confirm).toHaveCount(0, { timeout: 30_000 });
  const seen = (await (await api.get(`${API}/v1/alerts/${alert.id}`, { headers: staff.headers })).json()).data;
  expect(seen.status).toBe('ACKNOWLEDGED');
});

test('live: MINMEG resolves the alert; the notice arrives in the bell without a reload and opens the alert', async () => {
  await page.goto('/dashboard/overview');
  const bell = page.getByTestId('inbox-bell');
  await expect(bell).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('inbox-count')).toHaveCount(0, { timeout: 30_000 });
  await page.waitForTimeout(2_000); // the live connection opens
  const resolved = await api.post(`${API}/v1/alerts/${alert.id}/resolve`, { headers: staff.headers, data: { resolutionCode: 'FIXED', resolutionNote: `E2E ${RUN}: inspection done at the destination` } });
  expect(resolved.ok(), await resolved.text()).toBeTruthy();

  await expect(page.getByTestId('inbox-count')).toHaveText('1', { timeout: 30_000 });
  await bell.click();
  const notice = page.getByTestId('inbox-popover').locator('li').filter({ hasText: `E2E ${RUN}: inspection done` });
  await expect(notice).toHaveAttribute('data-unread', 'true', { timeout: 30_000 });
  await expect(notice.getByText(`Alert resolved: ${alert.title}`)).toBeVisible();
  await page.screenshot({ path: 'tests/e2e/.results/notifications-bell-live.png' });
  await notice.getByRole('button', { name: new RegExp(`Alert resolved`) }).click();

  await page.waitForURL(new RegExp(`/dashboard/alerts\\?alert=${alert.id}`), { timeout: 30_000 });
  const sheet = page.getByTestId(`alert-${alert.id}`);
  await expect(sheet.getByText('Resolved by MINMEG')).toBeVisible({ timeout: 30_000 });
  await expect(sheet.getByText(`E2E ${RUN}: inspection done`, { exact: false })).toBeVisible();
  await expect(page.getByTestId('inbox-count')).toHaveCount(0, { timeout: 30_000 });
  await page.screenshot({ path: 'tests/e2e/.results/notifications-opened-alert.png' });
});
