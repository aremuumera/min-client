import { describe, it, expect } from 'vitest';
import { toApiError, fieldErrors } from '@/lib/api/errors';
import { can, ANONYMOUS, type Actor } from '@/lib/permissions/can';
import { TEAM_PERMISSION_KEYS, TEAM_ROLE_PRESETS } from '@/lib/permissions/team-permissions';
import { createSseParser, type SseEvent } from '@/lib/realtime/sse';

/* API errors, access checks and the SSE parser (docs/new/frontend/testing/frontend-testing.md §1) */

describe('toApiError', () => {
  it('leaves an already converted error alone, keeping the backend message', () => {
    const converted = toApiError({ status: 422, data: { error: { message: 'Size mismatch', code: 'BUSINESS_RULE_VIOLATION' } } });
    expect(converted.message).toBe('Size mismatch');
    expect(toApiError(converted)).toBe(converted);
  });
  it('reads the backend error and splits validation messages per field', () => {
    const e = toApiError({ status: 400, data: { success: false, error: { message: 'Validation failed: body.note: note is required when verification FAILED, body.quantity: Expected number, received string', code: 'BAD_REQUEST', statusCode: 400, requestId: 'r-1' } } });
    expect(e).toMatchObject({ status: 400, code: 'BAD_REQUEST', requestId: 'r-1' });
    expect(e.fields).toEqual({ note: 'note is required when verification FAILED', quantity: 'Expected number, received string' });
  });
  it('business rules, network and timeouts', () => {
    expect(toApiError({ status: 422, data: { error: { message: 'Batch MB-1 has only 2 available', code: 'BUSINESS_RULE_VIOLATION' } } })).toMatchObject({ status: 422, code: 'BUSINESS_RULE_VIOLATION', fields: {} });
    expect(toApiError({ status: 'FETCH_ERROR', error: 'TypeError' }).code).toBe('NETWORK');
    expect(toApiError({ status: 'TIMEOUT_ERROR' }).code).toBe('TIMEOUT');
    expect(fieldErrors('Batch not found')).toEqual({});
  });
});

describe('can()', () => {
  const staff = (permissions: string[]): Actor => ({ ...ANONYMOUS, role: 'admin', isStaff: true, permissions });
  const owner = (role: string): Actor => ({ ...ANONYMOUS, role });
  const member = (role: string, teamKeys: string[]): Actor => ({ ...ANONYMOUS, role, isTeamMember: true, teamKeys });

  it('staff: permissions; super admin holds all; merchants never pass a staff permission', () => {
    expect(can(staff(['devices:view']), { permission: 'devices:view' })).toBe(true);
    expect(can(staff(['devices:view']), { permission: 'devices:manage' })).toBe(false);
    expect(can(staff(['*']), { permission: ['devices:manage', 'operations:run'] })).toBe(true);
    expect(can(staff(['devices:view']), { permission: ['devices:manage', 'devices:view'], mode: 'any' })).toBe(true);
    expect(can(owner('supplier'), { permission: 'devices:view' })).toBe(false);
  });
  it('roles: buyer_supplier counts as both; staff are not merchants', () => {
    expect(can(owner('buyer_supplier'), { role: 'supplier' })).toBe(true);
    expect(can(owner('buyer_supplier'), { role: 'buyer' })).toBe(true);
    expect(can(owner('buyer'), { role: ['supplier'] })).toBe(false);
    expect(can(staff(['*']), { role: 'supplier' })).toBe(false);
    expect(can(ANONYMOUS, { role: 'buyer' })).toBe(false);
  });
  it('team keys: owners hold all; members only theirs; with a role both must pass', () => {
    expect(can(owner('supplier'), { teamKey: 'inventory' })).toBe(true);
    expect(can(member('supplier', ['inventory']), { teamKey: 'inventory' })).toBe(true);
    expect(can(member('supplier', ['products']), { teamKey: 'inventory' })).toBe(false);
    expect(can(member('buyer', ['inventory']), { role: 'supplier', teamKey: 'inventory' })).toBe(false);
  });
  it('the catalogue mirrors the backend: 16 keys; presets only use known keys', () => {
    expect(TEAM_PERMISSION_KEYS).toHaveLength(16);
    for (const keys of Object.values(TEAM_ROLE_PRESETS)) for (const k of keys) expect(TEAM_PERMISSION_KEYS).toContain(k);
  });
});

describe('SSE parser', () => {
  it('splits events across chunks, parses JSON, skips keep-alives', () => {
    const events: SseEvent[] = [];
    const parse = createSseParser((e) => events.push(e));
    parse(': keep-alive\n\nevent: unread\nda');
    parse('ta: {"count":3}\n\nevent: notification\ndata: {"id":"935dc217-daa9-4e33-9b04-60996aa29181"}\nid: 7\n\n');
    parse('data: plain text\n\n');
    expect(events).toEqual([
      { event: 'unread', data: { count: 3 }, id: undefined },
      { event: 'notification', data: { id: '935dc217-daa9-4e33-9b04-60996aa29181' }, id: '7' },
      { event: 'message', data: 'plain text', id: undefined },
    ]);
  });
});
