import type { TeamPermission } from './team-permissions';

/*
 * One access check for the whole app (docs/new/frontend/rules/frontend-access-rules.md §4).
 * The backend decides; this only keeps the UI from offering what it would refuse.
 *
 *   can(actor, { permission: 'devices:manage' })      staff holding the permission (super_admin: '*')
 *   can(actor, { role: ['supplier'] })                merchant role (buyer_supplier counts as both)
 *   can(actor, { teamKey: 'inventory' })              team member holding the key; owners hold all
 * Several conditions in one rule must all pass.
 */
export const STAFF_ROLES = ['super_admin', 'admin', 'manager', 'customer_care'] as const;
export type MerchantRole = 'buyer' | 'supplier' | 'buyer_supplier' | 'inspector';

export interface Actor {
  role: string | null;
  isStaff: boolean;
  /** Staff: the AdminRole permissions ('*' = all) */
  permissions: readonly string[];
  isTeamMember: boolean;
  /** Team member: the keys they were given */
  teamKeys: readonly string[];
}

export interface AccessRule {
  permission?: string | readonly string[];
  /** with several permissions: all (default) or any */
  mode?: 'all' | 'any';
  role?: MerchantRole | readonly MerchantRole[];
  teamKey?: TeamPermission | readonly TeamPermission[];
}

export const ANONYMOUS: Actor = { role: null, isStaff: false, permissions: [], isTeamMember: false, teamKeys: [] };

const list = <T,>(v: T | readonly T[] | undefined): readonly T[] => (v === undefined ? [] : Array.isArray(v) ? (v as readonly T[]) : [v as T]);

export function normalizeRole(role: unknown): string | null {
  const r = String(Array.isArray(role) ? role[0] ?? '' : role ?? '').toLowerCase();
  if (!r) return null;
  return r === 'both' ? 'buyer_supplier' : r;
}

export function can(actor: Actor, rule: AccessRule): boolean {
  const perms = list(rule.permission);
  if (perms.length) {
    if (!actor.isStaff) return false;
    if (!actor.permissions.includes('*')) {
      const held = (p: string) => actor.permissions.includes(p);
      if (rule.mode === 'any' ? !perms.some(held) : !perms.every(held)) return false;
    }
  }
  const roles = list(rule.role);
  if (roles.length) {
    if (actor.isStaff || !actor.role) return false;
    const r = actor.role;
    const ok = roles.some((want) => want === r || (r === 'buyer_supplier' && (want === 'buyer' || want === 'supplier')));
    if (!ok) return false;
  }
  const keys = list(rule.teamKey);
  if (keys.length && actor.isTeamMember && !keys.some((k) => actor.teamKeys.includes(k))) return false;
  return true;
}
