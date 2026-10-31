import { describe, it, expect } from 'vitest';
import { actorFromAuth } from '@/lib/permissions/actor';
import { TEAM_PERMISSION_KEYS } from '@/lib/permissions/team-permissions';
import { canOpenArea, grantableKeys, memberLockReason, presetFor, TEAM_PERMISSION_GROUPS } from '@/lib/permissions/team-members';

const owner = actorFromAuth({ user: { role: 'supplier' }, isTeamMember: false, permissions: [] });
const member = actorFromAuth({ user: { role: 'supplier' }, isTeamMember: true, permissions: ['team_management', 'products', 'chat'] });
const me = '935dc217-daa9-4e33-9b04-60996aa29181';
const other = '4b1c2d3e-4f5a-4b60-8c71-9d2e3f4a5b62';

describe('team keys', () => {
  it('the picker groups hold all 16 keys exactly once', () => {
    const keys = TEAM_PERMISSION_GROUPS.flatMap((g) => g.keys);
    expect(keys).toHaveLength(16);
    expect(new Set(keys)).toEqual(new Set(TEAM_PERMISSION_KEYS));
  });
  it('the owner may give every key; a member only their own', () => {
    expect(grantableKeys(owner)).toHaveLength(16);
    expect(grantableKeys(member)).toEqual(['products', 'chat', 'team_management']);
  });
  it('presets follow the backend, minus keys a member cannot give', () => {
    expect(presetFor(owner, 'marketer')).toEqual(['products', 'rfq', 'analytics']);
    expect(presetFor(owner, 'admin')).toHaveLength(16);
    expect(presetFor(member, 'marketer')).toEqual(['products']);
    expect(presetFor(member, 'customer_care')).toEqual(['chat']);
  });
  it('a member cannot change themselves or someone with more access; the owner can', () => {
    expect(memberLockReason(owner, me, { id: other, permissions: ['esg'] })).toBeNull();
    expect(memberLockReason(member, me, { id: me, permissions: ['products'] })).toMatch(/This is you/);
    expect(memberLockReason(member, me, { id: other, permissions: ['products', 'esg'] })).toMatch(/ESG/);
    expect(memberLockReason(member, me, { id: other, permissions: ['chat'] })).toBeNull();
  });
});

describe('menu areas', () => {
  const as = (role: string, isTeamMember = false, permissions: string[] = []) => actorFromAuth({ user: { role }, isTeamMember, permissions });
  it('owners by role (buyer_supplier and "both" count as both)', () => {
    expect(canOpenArea(as('supplier'), 'products')).toBe(true);
    expect(canOpenArea(as('buyer'), 'products')).toBe(false);
    expect(canOpenArea(as('both'), 'rfq')).toBe(true);
    expect(canOpenArea(as('buyer'), 'inspectors')).toBe(false);
    expect(canOpenArea(as('inspector'), 'inspectors')).toBe(true);
    expect(canOpenArea(as('buyer'), 'settings')).toBe(true);
    expect(canOpenArea(as('admin'), 'products')).toBe(true);
  });
  it('team members by their keys only', () => {
    expect(canOpenArea(as('supplier', true, ['chat']), 'products')).toBe(false);
    expect(canOpenArea(as('supplier', true, ['chat']), 'chat')).toBe(true);
    expect(canOpenArea(as('supplier', true, ['chat']), undefined)).toBe(true);
  });
});
