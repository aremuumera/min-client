/*
 * Which menu permission guards a dashboard address. The dashboard layout uses it so a team member who types
 * an address gets the "no access" page for anything their menu hides (finding 8, 2026-11-06), not a page of
 * refused calls. Read from the sidebar config, so menu and pages follow one rule. The backend still enforces.
 */
import { dashboardConfig, type NavItemConfig } from '@/config/dashboard-config';

/** Addresses anyone signed in may open whatever their menu shows (a share link is opened by whoever was sent it) */
const ALWAYS_OPEN = ['/dashboard/documents/open/'];

type Entry = { prefix: string; permission: NavItemConfig['permission'] };

function collect(items: NavItemConfig[], inherited: NavItemConfig['permission'], out: Entry[]) {
  for (const item of items) {
    const permission = item.permission ?? inherited;
    if (item.items?.length) collect(item.items, permission, out);
    for (const href of [item.href, item.matcher?.href]) {
      if (href && href.startsWith('/dashboard/')) out.push({ prefix: href.replace(/\/$/, ''), permission });
    }
  }
}

let entries: Entry[] | null = null;
/** The menu entries, longest address first, so the most specific one wins */
function allEntries(): Entry[] {
  if (!entries) {
    const out: Entry[] = [];
    for (const section of dashboardConfig.navItems) collect(section.items ?? [], undefined, out);
    entries = out.sort((a, b) => b.prefix.length - a.prefix.length);
  }
  return entries;
}

/**
 * The permission of the menu entry an address sits under: '/dashboard/invoices/abc' → 'invoices'.
 * undefined when no menu entry guards it (overview, notifications, marketplace pages, share links).
 */
export function pagePermission(pathname: string | null | undefined): NavItemConfig['permission'] {
  if (!pathname || ALWAYS_OPEN.some((p) => pathname.startsWith(p))) return undefined;
  const path = pathname.replace(/\/$/, '');
  return allEntries().find((e) => path === e.prefix || path.startsWith(`${e.prefix}/`))?.permission;
}
