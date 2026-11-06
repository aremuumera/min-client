/*
 * The menu pages each team key opens, read from the sidebar config so the Team screen can never drift
 * from the menu (owner's decision 2026-11-06). "Supplier › My listings" for a page inside a folder.
 */
import { dashboardConfig, type NavItemConfig } from '@/config/dashboard-config';

import { AREA_KEYS } from './team-members';
import type { TeamPermission } from './team-permissions';

/** The team keys a menu permission stands for */
function keysOf(permission: NavItemConfig['permission']): string[] {
  if (!permission) return [];
  if (permission === 'batches') return ['inventory'];
  return AREA_KEYS[permission] ?? [permission];
}

function walk(items: NavItemConfig[], parent: NavItemConfig | null, inherited: string[], out: Map<string, string[]>) {
  for (const item of items) {
    const keys = keysOf(item.permission);
    const effective = keys.length ? keys : inherited;
    if (item.items?.length) {
      walk(item.items, item, effective, out);
      continue;
    }
    if (!item.href) continue;
    const name = parent && parent.items ? `${parent.title} › ${item.title}` : item.title;
    for (const k of effective) out.set(k, [...(out.get(k) ?? []), name]);
  }
}

let cache: Map<string, string[]> | null = null;
/** e.g. pagesFor('products') → ['Supplier › New listing', 'Supplier › My listings', …] */
export function pagesFor(key: TeamPermission): string[] {
  if (!cache) {
    cache = new Map();
    for (const section of dashboardConfig.navItems) walk(section.items ?? [], null, [], cache);
  }
  return cache.get(key) ?? [];
}
