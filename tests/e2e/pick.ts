import type { Locator } from '@playwright/test';

/** Chooses from our dropdown like selectOption did: by value, label, or index (0 is the placeholder when there is one) */
export async function pick(trigger: Locator, option: string | { label: string } | { index: number }) {
  // Scrolling closes our dropdown, so let the page settle before opening it
  await trigger.scrollIntoViewIfNeeded();
  await trigger.page().waitForTimeout(400);
  await trigger.click();
  const list = trigger.page().locator('[data-select-list="true"]').last();
  const options = list.getByRole('option');
  const choice =
    typeof option === 'string'
      ? list.locator(`[data-value="${option}"]`)
      : 'label' in option
        ? options.filter({ hasText: option.label }).first()
        : options.nth(option.index);
  await choice.dispatchEvent('mousedown');
}
