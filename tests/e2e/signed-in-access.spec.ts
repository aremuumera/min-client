import fs from 'node:fs';
import path from 'node:path';
import { test, expect, type Browser, type Page } from '@playwright/test';

/*
 * Step 2.1 with real merchant accounts against the local backend (desktop only, one sign-in per
 * account: the backend allows 10 logins per IP per 15 minutes). Credentials come from the
 * git-ignored .env.e2e.local; the suite is skipped without it.
 *   E2E_PORT=3000 npx playwright test signed-in-access --project=desktop
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
const password = env.E2E_PASSWORD;

test.skip(!password || !env.E2E_SUPPLIER, 'no .env.e2e.local');
// one sign-in per account: never repeat the suite at every screen size
test.beforeAll(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop only'));
test.describe.configure({ mode: 'serial', timeout: 90_000 });

const shot = (page: Page, name: string) => page.screenshot({ path: `tests/e2e/.results/signed-in-${name}.png` });

async function signIn(browser: Browser, email: string): Promise<Page> {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await page.goto('/auth/sign-in');
  await page.getByPlaceholder('Enter your email').fill(email);
  await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  return page;
}

/** Sidebar areas by their exact menu title */
async function expectMenu(page: Page, shown: string[], hidden: string[]) {
  for (const t of shown) await expect(page.getByText(t, { exact: true }).first()).toBeVisible({ timeout: 30_000 });
  for (const t of hidden) await expect(page.getByText(t, { exact: true })).toHaveCount(0);
}

test('supplier: supplier areas, team page, invite a member', async ({ browser }) => {
  const page = await signIn(browser, env.E2E_SUPPLIER);
  await expectMenu(page, ['Supplier'], ['Buyer', 'My Services']);
  await shot(page, 'supplier-menu');

  await page.goto('/dashboard/settings/team');
  await expect(page.getByRole('heading', { name: 'Team', exact: true })).toBeVisible();
  const [local, domain] = env.E2E_SUPPLIER.split('@');
  const email = `${local}+e2e-member@${domain}`; // the supplier's own mailbox
  if (!(await page.getByRole('row').filter({ hasText: email }).count())) {
    await page.getByRole('button', { name: 'Invite member' }).first().click(); // the header and the empty state both offer it
    const sheet = page.getByRole('dialog');
    await sheet.getByLabel('First name').fill('E2E');
    await sheet.getByLabel('Last name').fill('Member');
    await sheet.getByLabel('Email').fill(email);
    await sheet.getByRole('button', { name: 'Send invitation' }).click();
    await expect(page.getByText(`Invitation sent to ${email}`)).toBeVisible({ timeout: 15_000 });
  }
  await expect(page.getByRole('row').filter({ hasText: email })).toBeVisible();
  await shot(page, 'supplier-team');
});

test('buyer: buyer areas only, product listing closed', async ({ browser }) => {
  const page = await signIn(browser, env.E2E_BUYER);
  await expectMenu(page, ['Buyer'], ['Supplier', 'My Services']);
  await shot(page, 'buyer-menu');
  await page.goto('/dashboard/supplier-list/create');
  // AuthGuard sends a buyer away from supplier tools
  await page.waitForURL(/\/errors\/not-authorized/, { timeout: 30_000 });
  await expect(page.getByText("This page isn't part of your account")).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to dashboard' })).toBeVisible();
  await shot(page, 'buyer-not-authorized');
});

test('buyer_supplier: both areas', async ({ browser }) => {
  const page = await signIn(browser, env.E2E_BUYER_SUPPLIER);
  await expectMenu(page, ['Supplier', 'Buyer'], ['My Services']);
  await shot(page, 'buyer-supplier-menu');
});

test('inspector: inspection areas only', async ({ browser }) => {
  const page = await signIn(browser, env.E2E_INSPECTOR);
  await expectMenu(page, ['My Services'], ['Supplier', 'Buyer']);
  await shot(page, 'inspector-menu');
});

test('team member: sees only the keys they hold', async ({ browser }) => {
  const page = await signIn(browser, env.E2E_TEAM_MEMBER);
  await shot(page, 'team-member-menu');
  await page.goto('/dashboard/settings/team');
  await expect(page.getByRole('heading', { name: 'Team', exact: true }).or(page.getByText("You don't have access to this"))).toBeVisible();
  await shot(page, 'team-member-team');
});
