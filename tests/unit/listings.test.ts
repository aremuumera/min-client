import { describe, it, expect } from 'vitest';
import type { Batch } from '@/lib/batches';
import { actionsFor, asList, attachmentError, canBackListing, formatMoney, mediaError } from '@/lib/listings';

const file = (name: string, type: string, size = 1000) => {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};
const batch = (extra: Partial<Batch> & { listing?: unknown } = {}) => ({ quantityUnitId: 'tonne', batchStatus: 'ACTIVE', listingEligibilityStatus: 'PENDING', availableQuantity: '10.000000', listing: null, ...extra }) as Batch;

describe('which batches can back a listing', () => {
  it('a free, usable batch in the same unit', () => expect(canBackListing(batch(), 'tonne')).toBe(true));
  it('not another unit, a batch on another listing, on hold, ended, ineligible or empty', () => {
    expect(canBackListing(batch(), 'kg')).toBe(false);
    expect(canBackListing(batch({ listing: { id: 'x', listingCode: null, product_name: 'x', status: 'published' } }), 'tonne')).toBe(false);
    expect(canBackListing(batch({ batchStatus: 'QUARANTINED' }), 'tonne')).toBe(false);
    expect(canBackListing(batch({ batchStatus: 'RETIRED' }), 'tonne')).toBe(false);
    expect(canBackListing(batch({ listingEligibilityStatus: 'SUSPENDED' }), 'tonne')).toBe(false);
    expect(canBackListing(batch({ availableQuantity: '0.000000' }), 'tonne')).toBe(false);
  });
});

describe('listing status actions match the backend', () => {
  it('offers only what each status allows', () => {
    expect(actionsFor('draft').sort()).toEqual(['archive', 'publish']);
    expect(actionsFor('published').sort()).toEqual(['close', 'pause']);
    expect(actionsFor('paused').sort()).toEqual(['archive', 'close', 'publish']);
    expect(actionsFor('closed').sort()).toEqual(['archive', 'relist']);
    expect(actionsFor('archived')).toEqual([]);
  });
});

describe('listing files', () => {
  it('pictures: type, size, one video', () => {
    expect(mediaError([file('a.png', 'image/png')], false)).toBeNull();
    expect(mediaError([file('a.gif', 'image/gif')], false)).toMatch(/PNG/);
    expect(mediaError([file('a.png', 'image/png', 6 * 1024 * 1024)], false)).toMatch(/too large/);
    expect(mediaError([file('a.mp4', 'video/mp4', 14 * 1024 * 1024)], false)).toBeNull();
    expect(mediaError([file('a.mp4', 'video/mp4')], true)).toMatch(/one video/);
  });
  it('attachments: type and size', () => {
    expect(attachmentError([file('a.pdf', 'application/pdf')])).toBeNull();
    expect(attachmentError([file('a.exe', 'application/x-msdownload')])).toMatch(/PDF/);
    expect(attachmentError([file('a.pdf', 'application/pdf', 6 * 1024 * 1024)])).toMatch(/too large/);
  });
});

describe('listing wording', () => {
  it('reads terms stored either way', () => {
    expect(asList(['T/T'])).toEqual(['T/T']);
    expect(asList('["FOB","CIF"]')).toEqual(['FOB', 'CIF']);
    expect(asList('FOB')).toEqual(['FOB']);
    expect(asList(null)).toEqual([]);
  });
  it('shows money', () => expect(formatMoney(1250.5)).toBe('NGN 1,250.5'));
});
