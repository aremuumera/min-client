import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/* The admin shell: 264px sidebar on desktop, 72px rail on tablets, drawer on phones */
test('merchant shell at every size', async ({ page }, info) => {
  await page.goto('/design-system/shell');
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  const nav = page.getByRole('complementary', { name: 'Main menu' });
  const width = async () => (await nav.boundingBox())?.width ?? 0;

  const vw = page.viewportSize()!.width;
  if (vw >= 1024) {
    // desktop (1024px landscape tablets included)
    await expect.poll(width).toBe(264);
    await expect(nav.getByRole('link', { name: 'Overview' })).toBeVisible();
  } else if (vw >= 768) {
    // tablets: always the icon rail
    await expect.poll(width).toBe(72);
  } else {
    // phones: the sidebar is hidden; the menu opens as a drawer (a dialog)
    await expect(nav).toBeHidden();
    await page.getByRole('button', { name: 'Open menu' }).click();
    const drawer = page.getByRole('dialog', { name: 'Main menu' });
    await expect(drawer).toBeVisible();
    await drawer.getByRole('button', { name: 'Close menu' }).click();
    await expect(drawer).toHaveCount(0);
  }

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  await page.screenshot({ path: `tests/e2e/.results/shell-${info.project.name}.png` });
});
