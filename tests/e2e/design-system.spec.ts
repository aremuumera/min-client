import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/*
 * The component gallery at phone, tablet (both orientations) and desktop sizes
 * (docs/new/frontend/testing/frontend-testing.md §2–4).
 */
test.describe('design system gallery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/design-system');
    await expect(page.getByRole('heading', { name: 'MINMEG design system' })).toBeVisible();
  });

  test('no sideways scroll, flat, light, readable', async ({ page }, info) => {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, 'the page must never scroll sideways').toBeLessThanOrEqual(0);

    const shadows = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('main *')]
        .map((el) => getComputedStyle(el).boxShadow)
        // ring-* focus outlines use box-shadow only while focused; nothing is focused here
        .filter((s) => s && s !== 'none').length,
    );
    expect(shadows, 'no shadows').toBe(0);

    const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(font.toLowerCase()).toContain('euclid');

    const results = await new AxeBuilder({ page }).include('main').analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);

    await page.screenshot({ path: `tests/e2e/.results/design-system-${info.project.name}.png`, fullPage: true });
  });

  test('confirm dialog asks for a reason; touch targets are 44px', async ({ page }, info) => {
    if (info.project.name === 'phone') {
      const small = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('main button, main input, main select')]
          .filter((el) => el.offsetParent !== null)
          // a control inside a larger touch box (e.g. QuantityInput) is measured by that box
          .map((el) => (el.closest<HTMLElement>('[data-touch-target]') ?? el).getBoundingClientRect())
          .filter((r) => r.height < 44 - 0.5).length,
      );
      expect(small, 'buttons and inputs at least 44px tall on phones').toBe(0);
    }
    await page.getByRole('button', { name: 'Quarantine device…' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const confirm = dialog.getByRole('button', { name: 'Quarantine' });
    await expect(confirm).toBeDisabled();
    await dialog.getByLabel('Reason').fill('Seal broken at gate 2');
    await expect(confirm).toBeEnabled();
    await page.screenshot({ path: `tests/e2e/.results/confirm-${info.project.name}.png` });
  });
});
