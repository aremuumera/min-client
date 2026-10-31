import fs from 'node:fs';
import path from 'node:path';
import { quietLogins } from './quiet-login';
import { test, expect, type Page } from '@playwright/test';

/*
 * Step 2.3 documents vault with a real buyer account against the local backend (desktop only).
 * It makes an "E2E docs" folder and a tiny PDF, shares it with a signed-in-only link (no email is
 * sent), checks the access log, then deletes the file and archives the folder.
 *   E2E_PORT=3000 npx playwright test signed-in-documents --project=desktop
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
let shareToken = '';
const folderName = `E2E docs ${Date.now().toString(36)}`;
const shot = async (name: string) => {
  await page.waitForTimeout(400); // sheets finish sliding in
  await page.screenshot({ path: `tests/e2e/.results/documents-${name}.png` });
};
// a minimal valid PDF: the server checks the real type from the bytes
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');
const confirmIn = async (title: RegExp | string, button: string) => {
  const dialog = page.getByRole('dialog').filter({ hasText: title });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: button, exact: true }).click();
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

test('menu and page: Documents with its help', async () => {
  await expect(page.getByText('Documents', { exact: true }).first()).toBeVisible({ timeout: 30_000 });
  await page.goto('/dashboard/documents');
  await expect(page.getByRole('heading', { name: 'Documents', level: 1 })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'About this page: Documents' }).click();
  await expect(page.getByRole('dialog').getByText(/proving a tin shipment/)).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
});

test('a folder, then a PDF uploaded into it with progress and a SHA-256 check', async () => {
  await page.getByRole('button', { name: 'New folder' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill(folderName);
  await page.getByRole('dialog').getByRole('button', { name: 'Create folder' }).click();
  await confirmIn(`Create the folder ${folderName}?`, 'Create folder');
  await page.getByRole('navigation', { name: 'Folders' }).getByRole('button', { name: new RegExp(folderName) }).click();

  await page.getByRole('button', { name: 'Upload', exact: true }).first().click(); // the header and the empty state both offer it
  const sheet = page.getByRole('dialog').filter({ hasText: 'Upload documents' });
  await expect(sheet.getByLabel('Folder')).toHaveValue(/.+/); // the open folder is preselected
  await page.getByLabel('Files to upload').setInputFiles({ name: 'assay-lot-12.pdf', mimeType: 'application/pdf', buffer: PDF });
  await expect(sheet.getByLabel('Kind of document: assay-lot-12.pdf')).toHaveValue('DOCUMENT');
  await sheet.getByLabel('Kind of document: assay-lot-12.pdf').selectOption('REPORT');
  await shot('upload');
  await sheet.getByRole('button', { name: 'Upload 1 file' }).click();
  await confirmIn('Upload 1 file?', 'Upload');
  await expect(sheet.getByLabel('Uploaded')).toBeVisible({ timeout: 30_000 });
  await sheet.getByRole('button', { name: 'Close', exact: true }).first().click();

  await expect(page.getByRole('table', { name: 'Files' }).getByText('assay-lot-12.pdf')).toBeVisible({ timeout: 15_000 });
});

test('details: preview is logged; a share link is shown once, then revoked', async () => {
  await page.getByRole('table', { name: 'Files' }).getByText('assay-lot-12.pdf').click();
  const sheet = page.getByRole('dialog').filter({ hasText: 'assay-lot-12.pdf' });
  await expect(sheet.getByText('Fingerprint (SHA-256)')).toBeVisible();
  await expect(sheet.getByText('Report', { exact: false }).first()).toBeVisible();

  const [popup] = await Promise.all([page.waitForEvent('popup'), sheet.getByRole('button', { name: 'Preview' }).click()]);
  await popup.close();

  await sheet.getByRole('tab', { name: /Share links/ }).click();
  await sheet.getByRole('button', { name: 'New share link' }).click();
  await sheet.getByLabel('Who can open it').selectOption('AUTHENTICATED_LINK');
  await sheet.getByRole('button', { name: 'Create link' }).click();
  await confirmIn('Share assay-lot-12.pdf?', 'Create link');
  const shown = page.getByRole('dialog').filter({ hasText: 'Copy the link now' });
  await expect(shown.getByTestId('share-url')).toContainText('/share/');
  await shot('share-link');
  shareToken = (await shown.getByTestId('share-url').textContent())!.trim().split('/share/')[1];
  await shown.getByRole('button', { name: 'Done' }).click();

  // a signed-in link opens with this session, on click only
  const opener = await page.context().newPage();
  await opener.goto(`/dashboard/documents/open/${shareToken}`);
  await opener.getByRole('button', { name: 'Open document' }).click();
  await expect(opener.getByRole('link', { name: 'View', exact: true })).toHaveAttribute('href', /^https?:/, { timeout: 15_000 });
  await opener.screenshot({ path: 'tests/e2e/.results/documents-open-link.png' });
  await opener.close();

  const links = sheet.getByRole('list', { name: 'Share links' });
  await expect(links.getByText('Active')).toBeVisible();
  await links.getByRole('button', { name: 'Revoke' }).click();
  const revoke = page.getByRole('dialog').filter({ hasText: 'Revoke this link?' });
  await revoke.getByLabel('Reason').fill('E2E test finished');
  await revoke.getByRole('button', { name: 'Revoke link' }).click();
  await expect(links.getByText('Revoked')).toBeVisible({ timeout: 15_000 });

  await sheet.getByRole('tab', { name: 'Access log' }).click();
  await expect(sheet.getByRole('table', { name: 'Access log' }).getByText('Allowed').first()).toBeVisible({ timeout: 15_000 });
  await shot('access-log');
});

test('who can see it: email and ID are offered, trade participants are not; email sends a link', async () => {
  const sheet = page.getByRole('dialog').filter({ has: page.getByRole('tablist', { name: 'File' }) });
  await sheet.getByRole('tab', { name: 'Who can see it' }).click();
  await expect(sheet.getByLabel('Access', { exact: true })).toHaveValue('PRIVATE');
  await sheet.getByRole('button', { name: 'Give access' }).click();
  const form = sheet.getByRole('form', { name: 'Give access' });
  expect(await form.getByLabel('To').locator('option').allTextContents()).toEqual(['An email address', 'A company', 'A person']);

  await form.getByRole('button', { name: 'Send link' }).click();
  await expect(form.getByText('Enter the email address')).toBeVisible();

  // the buyer's own mailbox, so nothing goes to a stranger
  const [local, domain] = env.E2E_BUYER.split('@');
  const email = `${local}+e2e-share@${domain}`;
  await form.getByLabel('Email address').fill(email);
  await form.getByRole('button', { name: 'Send link' }).click();
  await confirmIn(`Share with ${email}?`, 'Send link');
  // either message is right here: a local run can hit the email provider's daily limit, and the link still exists
  await expect(page.locator('[data-sonner-toast]').getByText(/Sent to|could not be sent/).first()).toBeVisible({ timeout: 30_000 });

  await sheet.getByRole('tab', { name: /Share links/ }).click();
  const row = sheet.getByRole('list', { name: 'Share links' }).getByRole('listitem').filter({ hasText: email });
  await expect(row.getByText('Active')).toBeVisible({ timeout: 15_000 });
  await row.getByRole('button', { name: 'Revoke' }).click();
  const revoke = page.getByRole('dialog').filter({ hasText: 'Revoke this link?' });
  await revoke.getByLabel('Reason').fill('E2E test finished');
  await revoke.getByRole('button', { name: 'Revoke link' }).click();
  await expect(row.getByText('Revoked')).toBeVisible({ timeout: 15_000 });

  // a company by ID is still there
  await sheet.getByRole('tab', { name: 'Who can see it' }).click();
  await sheet.getByRole('button', { name: 'Give access' }).click();
  await form.getByLabel('To').selectOption('ORGANIZATION');
  await form.getByRole('button', { name: 'Give access' }).click();
  await expect(form.getByText('Paste the full ID')).toBeVisible();
  await shot('access');
});

test('company evidence: attach the file; it can\'t be deleted while attached; remove it', async () => {
  await page.goto('/dashboard/documents/evidence');
  await expect(page.getByRole('heading', { name: 'Company evidence', level: 1 })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Attach evidence' }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByRole('button', { name: 'Attach', exact: true }).click();
  await expect(sheet.getByText('Choose a file from your documents')).toBeVisible();
  await sheet.getByLabel('File').selectOption({ label: 'assay-lot-12.pdf' });
  await sheet.getByLabel('What it proves').selectOption('ASSAY');
  await sheet.getByRole('button', { name: 'Attach', exact: true }).click();
  await confirmIn('Attach assay-lot-12.pdf?', 'Attach');
  const list = page.getByRole('list', { name: 'Company evidence' });
  await expect(list.getByText('Waiting for MINMEG')).toBeVisible({ timeout: 15_000 });
  await shot('evidence');

  await page.goto('/dashboard/documents');
  await page.getByRole('table', { name: 'Files' }).getByText('assay-lot-12.pdf').click();
  const file = page.getByRole('dialog').filter({ has: page.getByRole('tablist', { name: 'File' }) });
  await file.getByRole('button', { name: 'Delete' }).click();
  const del = page.getByRole('dialog').filter({ hasText: 'Delete assay-lot-12.pdf?' });
  await del.getByLabel('Reason').fill('E2E: should be refused');
  await del.getByRole('button', { name: 'Delete file' }).click();
  await expect(page.locator('[data-sonner-toast]').getByText(/attached|evidence/i)).toBeVisible({ timeout: 15_000 });
  await del.getByRole('button', { name: 'Cancel' }).click();
  await file.getByRole('button', { name: 'Close', exact: true }).click();

  await page.goto('/dashboard/documents/evidence');
  await page.getByRole('list', { name: 'Company evidence' }).getByRole('button', { name: 'Remove' }).click();
  const rm = page.getByRole('dialog').filter({ hasText: 'Remove this evidence?' });
  await rm.getByLabel('Reason').fill('E2E test finished');
  await rm.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(page.getByText('No evidence yet')).toBeVisible({ timeout: 15_000 });
  await page.goto('/dashboard/documents');
  await page.getByRole('navigation', { name: 'Folders' }).getByRole('button', { name: new RegExp(folderName) }).click();
  await page.getByRole('table', { name: 'Files' }).getByText('assay-lot-12.pdf').click();
});

test('clean up: the file is deleted with a reason and the folder archived', async () => {
  const sheet = page.getByRole('dialog').filter({ has: page.getByRole('tablist', { name: 'File' }) });
  await sheet.getByRole('button', { name: 'Delete' }).click();
  const del = page.getByRole('dialog').filter({ hasText: 'Delete assay-lot-12.pdf?' });
  await del.getByLabel('Reason').fill('E2E test finished');
  await del.getByRole('button', { name: 'Delete file' }).click();
  await expect(page.getByRole('table', { name: 'Files' }).getByText('assay-lot-12.pdf')).toHaveCount(0, { timeout: 15_000 });

  await page.getByRole('button', { name: 'Archive folder' }).click();
  await confirmIn(`Archive ${folderName}?`, 'Archive folder');
  await expect(page.getByRole('navigation', { name: 'Folders' }).getByText(folderName)).toHaveCount(0, { timeout: 15_000 });
});

test('a revoked signed-in link says so on the page that opens it', async () => {
  await page.goto(`/dashboard/documents/open/${shareToken}`);
  await page.getByRole('button', { name: 'Open document' }).click();
  await expect(page.getByText(/not valid/)).toBeVisible({ timeout: 15_000 });
});

test('shared with me loads', async () => {
  await page.goto('/dashboard/documents/shared');
  await expect(page.getByRole('heading', { name: 'Shared with me', level: 1 })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('table', { name: 'Shared with me' }).or(page.getByText('Nothing shared with you yet'))).toBeVisible();
});
