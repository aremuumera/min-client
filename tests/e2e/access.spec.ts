import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { pick } from './pick';

/* The team-member sheet (step 2.1 B1), as the owner and as a limited member, at every size */
async function check(page: Page, name: string, project: string) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  await page.screenshot({ path: `tests/e2e/.results/access-${name}-${project}.png` });
}

test('owner invites: all 16 keys, role presets', async ({ page }, info) => {
  await page.goto('/design-system/access');
  await page.getByRole('button', { name: 'Invite' }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByText('3 of 16')).toBeVisible(); // marketer preset
  await pick(sheet.getByLabel('Team role'), 'admin');
  await expect(sheet.getByText('16 of 16')).toBeVisible();
  await pick(sheet.getByLabel('Team role'), 'customer_care');
  await expect(sheet.getByText('2 of 16')).toBeVisible();
  await expect(sheet.getByLabel(/ESG & carbon/)).toBeEnabled();
  await check(page, 'owner-invite', info.project.name);
});

test('a member gives only keys they hold, and cannot edit someone with more access', async ({ page }, info) => {
  await page.goto('/design-system/access?as=member');
  await page.getByRole('button', { name: 'Invite' }).click();
  let sheet = page.getByRole('dialog');
  await expect(sheet.getByText('1 of 16')).toBeVisible(); // marketer preset minus rfq, analytics
  await expect(sheet.getByLabel(/ESG & carbon/)).toBeDisabled();
  await expect(sheet.getByLabel('Access chat')).toBeEnabled();
  await check(page, 'member-invite', info.project.name);
  await page.getByRole('button', { name: 'Close', exact: true }).click();

  await page.getByRole('button', { name: 'Edit Tunde' }).click();
  sheet = page.getByRole('dialog');
  await expect(sheet.getByText(/They have access you don.t/)).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Save changes' })).toHaveCount(0);
  await expect(sheet.getByLabel('Team role')).toBeDisabled();
  await check(page, 'member-locked', info.project.name);
});
