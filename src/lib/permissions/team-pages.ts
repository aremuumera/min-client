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

const sectionName = (title: string) => title.charAt(0) + title.slice(1).toLowerCase();

function walk(items: NavItemConfig[], section: string, parent: NavItemConfig | null, inherited: string[], out: Map<string, { name: string; section: string }[]>) {
  for (const item of items) {
    const keys = keysOf(item.permission);
    const effective = keys.length ? keys : inherited;
    if (item.items?.length) {
      walk(item.items, section, item, effective, out);
      continue;
    }
    if (!item.href) continue;
    const name = parent && parent.items ? `${parent.title} › ${item.title}` : item.title;
    for (const k of effective) out.set(k, [...(out.get(k) ?? []), { name, section }]);
  }
}

let cache: Map<string, string[]> | null = null;
/** e.g. pagesFor('products') → ['Supplier › New listing', 'Supplier › My listings', …] */
export function pagesFor(key: TeamPermission): string[] {
  if (!cache) {
    const raw = new Map<string, { name: string; section: string }[]>();
    for (const section of dashboardConfig.navItems) walk(section.items ?? [], sectionName(section.title), null, [], raw);
    // a title used twice in the menu (two "Analytics") is told apart by its section
    const all = [...raw.values()].flat();
    const twice = (name: string) => new Set(all.filter((x) => x.name === name).map((x) => x.section)).size > 1;
    cache = new Map([...raw].map(([k, pages]) => [k, [...new Set(pages.map((x) => (twice(x.name) ? `${x.section} › ${x.name}` : x.name)))]]));
  }
  return cache.get(key) ?? [];
}
