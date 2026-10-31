import { describe, it, expect } from 'vitest';
import { approvalRule, batchLabel, formatQuantity, fromMicro, isPositive, leftToAssign, signedQuantity, toMicro } from '@/lib/batches';
import { canOpenArea } from '@/lib/permissions/team-members';

describe('batch quantities', () => {
  it('adds up exactly, where floats would not', () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(leftToAssign('0.3', ['0.1', '0.2'])).toBe(BigInt(0));
    expect(leftToAssign('100.000000', ['60', '40'])).toBe(BigInt(0));
    expect(fromMicro(leftToAssign('100', ['60.5']))).toBe('39.5');
    expect(fromMicro(leftToAssign('100', ['60', '50.25']))).toBe('-10.25');
    expect(leftToAssign('123456789012345678.000001', ['123456789012345678', '0.000001'])).toBe(BigInt(0));
  });

  it('treats empty or invalid input as nothing', () => {
    expect(toMicro('')).toBe(BigInt(0));
    expect(toMicro('abc')).toBe(BigInt(0));
    expect(toMicro(null)).toBe(BigInt(0));
    expect(isPositive('')).toBe(false);
    expect(isPositive('0')).toBe(false);
    expect(isPositive('0.000001')).toBe(true);
  });

  it('shows quantities without padding, and with their direction', () => {
    expect(formatQuantity('1250.500000', 't')).toBe('1,250.5 t');
    expect(formatQuantity('100.000000')).toBe('100');
    expect(formatQuantity(null, 't')).toBe('—');
    expect(signedQuantity({ direction: 'OUT', quantity: '20.000000' }, 't')).toBe('− 20 t');
    expect(signedQuantity({ direction: 'IN', quantity: '3.000000' }, 't')).toBe('+ 3 t');
  });
});

describe('batch wording', () => {
  it('uses our own words where the backend code would mislead', () => {
    expect(batchLabel('POSTED')).toBe('Applied');
    expect(batchLabel('ADDITIONAL_INVENTORY')).toBe('Additional stock');
    expect(batchLabel('IN_TRANSIT')).toBe('In transit');
    expect(batchLabel(null)).toBe('—');
  });

  it('explains the approval rule', () => {
    expect(approvalRule(null)).toBe('Changes apply at once');
    expect(approvalRule({ policy: 'NOT_REQUIRED' })).toBe('Changes apply at once');
    expect(approvalRule({ policy: 'TOLERANCE', tolerancePercent: '0' })).toBe('Every change waits for MINMEG');
    expect(approvalRule({ policy: 'TOLERANCE', tolerancePercent: '5.00' })).toBe('Changes over 5% wait for MINMEG');
  });
});

describe('who sees Inventory in the menu', () => {
  const actor = (role: string, teamKeys?: string[]) => ({ role, isStaff: false, permissions: [], isTeamMember: !!teamKeys, teamKeys: teamKeys ?? [] }) as Parameters<typeof canOpenArea>[0];
  it('suppliers and both, not buyers or inspectors', () => {
    expect(canOpenArea(actor('supplier'), 'batches')).toBe(true);
    expect(canOpenArea(actor('buyer_supplier'), 'batches')).toBe(true);
    expect(canOpenArea(actor('buyer'), 'batches')).toBe(false);
    expect(canOpenArea(actor('inspector'), 'batches')).toBe(false);
  });
  it('a team member also needs the inventory key', () => {
    expect(canOpenArea(actor('supplier', ['inventory']), 'batches')).toBe(true);
    expect(canOpenArea(actor('supplier', ['chat']), 'batches')).toBe(false);
    expect(canOpenArea(actor('buyer', ['inventory']), 'batches')).toBe(false);
  });
});
