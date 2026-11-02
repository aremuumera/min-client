import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { test, expect, type Page } from '@playwright/test';

/*
 * Step 2.6d, company side, signed in. The /support answers are faked here, so this checks the screen and
 * what it sends, without the table or Firebase. The backend's own tests cover the real rules.
 */
const envFile = path.join(__dirname, '../../.env.e2e.local');
const env: Record<string, string> = fs.existsSync(envFile)
  ? Object.fromEntries(fs.readFileSync(envFile, 'utf8').split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }))
  : {};
test.describe.configure({ mode: 'serial', timeout: 90_000 });
test.skip(!env.E2E_PASSWORD || !env.E2E_SUPPLIER, 'no .env.e2e.local');

const id = '935dc217-daa9-4e33-9b04-60996aa29181';
let page: Page;
const calls: { path: string; body: string }[] = [];
let conversation: Record<string, unknown> | null = null;
let messages: Record<string, unknown>[] = [];

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await quietLogins(context, env.E2E_RUN_SECRET);
  page = await context.newPage();
  await page.route(/\/support\/conversation/, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const json = (data: unknown, status = 200) => route.fulfill({ status, json: { success: true, data } });
    if (req.method() === 'POST') calls.push({ path: url.pathname, body: req.postData() ?? '' });
    if (req.method() === 'GET' && url.pathname.endsWith('/messages')) return json({ rows: messages, hasMore: false });
    if (req.method() === 'GET') return json(conversation);
    if (url.pathname.endsWith('/read')) {
      if (conversation) conversation.unread = 0;
      return json(conversation);
    }
    messages = [{ id: `m${messages.length + 1}`, senderSide: 'COMPANY', senderId: 'x', senderName: 'Farouk', text: 'Why was my listing refused?', attachments: [], link: null, createdAt: new Date().toISOString() }, ...messages];
    conversation = { id, status: 'OPEN', lastMessageAt: new Date().toISOString(), lastMessagePreview: 'Why was my listing refused?', lastSenderSide: 'COMPANY', unread: 0 };
    return json({ message: messages[0], conversation }, 201);
  });
  await page.goto('/auth/sign-in');
  await page.getByPlaceholder('Enter your email').fill(env.E2E_SUPPLIER);
  await page.getByPlaceholder('Enter your password').fill(env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
});

test('Admin tab: MINMEG Support is there; empty conversation; help; a first message is sent and the box clears', async () => {
  await page.goto('/dashboard/chat');
  await page.getByText('Admin', { exact: true }).click({ timeout: 45_000 });
  await page.getByRole('link', { name: /MINMEG Support/ }).click({ timeout: 20_000 });
  await expect(page).toHaveURL(/\/dashboard\/chat\/support$/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'MINMEG Support', level: 1 })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('No messages yet')).toBeVisible();
  await page.screenshot({ path: 'tests/e2e/.results/support-empty.png' });

  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeDisabled();
  await page.locator('#support-message').fill('Why was my listing refused?');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.locator('#support-message')).toHaveValue('', { timeout: 15_000 });
  await expect(page.getByText('Why was my listing refused?').first()).toBeVisible({ timeout: 15_000 });
  expect(calls.some((c) => c.path.endsWith('/messages'))).toBeTruthy();
  await page.screenshot({ path: 'tests/e2e/.results/support-sent.png' });
});

test('a staff reply shows as MINMEG Support and is marked read; a failed send keeps the draft', async () => {
  messages = [{ id: 'm9', senderSide: 'STAFF', senderId: 's', senderName: 'MINMEG Support', text: 'We are checking', attachments: [], link: null, createdAt: new Date().toISOString() }, ...messages];
  conversation = { ...conversation!, unread: 1, lastSenderSide: 'STAFF', lastMessagePreview: 'We are checking' };
  await page.reload();
  await expect(page.getByText('We are checking').last()).toBeVisible({ timeout: 45_000 });
  await expect.poll(() => calls.some((c) => c.path.endsWith('/read'))).toBeTruthy();

  await page.route(/\/support\/conversation\/messages$/, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    await route.fulfill({ status: 503, json: { success: false, error: { message: 'Chat is not available right now. Please try again shortly.' } } });
  });
  await page.locator('#support-message').fill('Keep this draft');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Chat is not available' })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#support-message')).toHaveValue('Keep this draft');
  await page.screenshot({ path: 'tests/e2e/.results/support-failed.png' });
});
