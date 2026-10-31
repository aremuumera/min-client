import { describe, it, expect } from 'vitest';
import { actorFromAuth } from '@/lib/permissions/actor';
import { can } from '@/lib/permissions/can';

describe('merchant actor', () => {
  it('owner: every key for the role; "both" is buyer_supplier', () => {
    const a = actorFromAuth({ user: { role: 'both' }, isTeamMember: false, permissions: [] });
    expect(a.role).toBe('buyer_supplier');
    expect(can(a, { role: 'supplier', teamKey: 'inventory' })).toBe(true);
  });
  it('team member: only the keys they were given', () => {
    const a = actorFromAuth({ user: { role: 'supplier' }, isTeamMember: true, permissions: ['products'] });
    expect(can(a, { teamKey: 'products' })).toBe(true);
    expect(can(a, { teamKey: 'shipments' })).toBe(false);
  });
});
