import type { BrowserContext } from '@playwright/test';

/*
 * Marks this browser's sign-ins as an automated test run, so the backend sends no login alert email
 * (test runs used up the email provider's daily limit). Real sign-ins always get the alert. The
 * secret comes from the git-ignored .env.e2e.local and must match E2E_RUN_SECRET in the backend's .env.
 */
export async function quietLogins(context: BrowserContext, secret: string | undefined) {
  if (!secret) throw new Error('E2E_RUN_SECRET is missing from .env.e2e.local: refusing to sign in and send a login alert email');
  await context.route(/\/auth\/(umera\/login|aremu_check_admin_login)/, (route) => route.continue({ headers: { ...route.request().headers(), 'x-e2e-run': secret } }));
}
