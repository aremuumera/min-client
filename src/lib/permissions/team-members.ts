import type { Actor } from './can';
import { TEAM_PERMISSION_KEYS, TEAM_PERMISSIONS, TEAM_ROLE_PRESETS, type TeamPermission, type TeamRole } from './team-permissions';

/*
 * Team screen rules, mirroring the backend (modules/auth/services/team.service.ts, decision #84):
 * - the account owner grants any key; a member with team_management grants only keys they hold
 * - a member can't change or remove themselves, nor someone holding a key they don't
 * The server enforces all of these; this only keeps the UI from offering what it would refuse.
 */
export const TEAM_ROLE_OPTIONS: { value: TeamRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'marketer', label: 'Marketer' },
  { value: 'customer_care', label: 'Customer care' },
  { value: 'operations_manager', label: 'Operations manager' },
];

export const teamRoleLabel = (role: string | null | undefined) => TEAM_ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role ?? '—';

/** The 16 keys by area, for the picker (every key appears once) */
export const TEAM_PERMISSION_GROUPS: { area: string; keys: TeamPermission[] }[] = [
  { area: 'Trading', keys: ['products', 'rfq', 'enquiries', 'chat', 'invoices', 'inspectors'] },
  { area: 'Supply chain', keys: ['inventory', 'shipments', 'traceability', 'passports', 'esg', 'documents'] },
  { area: 'Account', keys: ['analytics', 'activity', 'settings', 'team_management'] },
];

export const teamPermissionLabel = (key: string) => (TEAM_PERMISSIONS as Record<string, string>)[key] ?? key;

export interface TeamMemberLike {
  id: string;
  permissions?: readonly string[];
}

/** Keys the actor may give: all for the owner, their own for a member */
export function grantableKeys(actor: Actor): TeamPermission[] {
  if (!actor.isTeamMember) return [...TEAM_PERMISSION_KEYS];
  return TEAM_PERMISSION_KEYS.filter((k) => actor.teamKeys.includes(k));
}

/** A role's preset, minus the keys the actor can't give */
export function presetFor(actor: Actor, role: TeamRole): TeamPermission[] {
  const allowed = grantableKeys(actor);
  return TEAM_ROLE_PRESETS[role].filter((k) => allowed.includes(k));
}

/** Why the actor can't change this member, or null when they can */
export function memberLockReason(actor: Actor, meId: string | null | undefined, member: TeamMemberLike): string | null {
  if (!actor.isTeamMember) return null;
  if (meId && meId === member.id) return 'This is you. Ask the account owner to change your access.';
  const beyond = (member.permissions ?? []).filter((k) => (TEAM_PERMISSION_KEYS as string[]).includes(k) && !actor.teamKeys.includes(k));
  return beyond.length ? `They have access you don't (${beyond.map(teamPermissionLabel).join(', ')}). Ask the account owner.` : null;
}

/**
 * May the actor open a menu area (a team key)? Team members: only the keys they were given.
 * Owners: products needs a supplier role, rfq a buyer role, inspectors the inspector role
 * (buyer_supplier counts as both); everything else is open. Staff (admin) see every area.
 */
export function canOpenArea(actor: Actor, key: string | undefined): boolean {
  if (!key) return true;
  if (actor.isTeamMember) return actor.teamKeys.includes(key);
  if (actor.isStaff) return true;
  const r = actor.role;
  switch (key) {
    case 'products':
      return r === 'supplier' || r === 'buyer_supplier';
    case 'rfq':
      return r === 'buyer' || r === 'buyer_supplier';
    case 'inspectors':
      return r === 'inspector';
    default:
      return true;
  }
}
