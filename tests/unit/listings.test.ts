import { describe, it, expect } from 'vitest';
import type { Batch } from '@/lib/batches';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RichText } from '@/components/ui/rich-text';
import { actionsFor, asList, attachmentError, canBackListing, categoryChain, formatMoney, isBlankText, leafCategories, mediaError, mineralRoot, nonMineralRoots, withCommas, type CategoryNode } from '@/lib/listings';

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

const leaf = (id: string, name: string): CategoryNode => ({ id, code: id.toUpperCase(), name, children: [] });
const tree: CategoryNode[] = [
  { id: 'min', code: 'MINERALS', name: 'Minerals', children: [{ id: 'metal', code: 'METAL', name: 'Metallic', children: [leaf('gold', 'Gold Ores')] }] },
  { id: 'tools', code: 'TOOLS', name: 'Mining tools', children: [leaf('comp', 'Compressors')] },
];

describe('categories on the form', () => {
  it('splits minerals from everything else', () => {
    expect(nonMineralRoots(tree).map((n) => n.id)).toEqual(['tools']);
    expect(mineralRoot(tree)?.id).toBe('min');
  });
  it('walks from a root to a category, and lists the lowest levels with their path', () => {
    expect(categoryChain(tree, 'gold')).toEqual(['min', 'metal', 'gold']);
    expect(categoryChain(tree, 'nope')).toEqual([]);
    expect(leafCategories(tree[0])).toEqual([{ value: 'gold', label: 'Minerals › Metallic › Gold Ores' }]);
  });
});

describe('form text', () => {
  it('counts an empty editor as empty', () => {
    expect(isBlankText('<p></p>')).toBe(true);
    expect(isBlankText('<p>&nbsp;</p>')).toBe(true);
    expect(isBlankText('<p>Sn 72%</p>')).toBe(false);
  });
  it('puts commas in prices without touching decimals', () => {
    expect(withCommas('1500000.50')).toBe('1,500,000.50');
    expect(withCommas('')).toBe('');
  });
});

describe('formatted text can never run as HTML', () => {
  const html = (text: string) => renderToStaticMarkup(React.createElement(RichText, { text }));
  it('keeps the editor formatting', () => {
    expect(html('<p><strong>Sn</strong> 72%</p><ul><li><p>Dry</p></li></ul>')).toContain('<strong class="font-semibold">Sn</strong>');
    expect(html('<ul><li>Dry</li></ul>')).toContain('<li>Dry</li>');
  });
  it('shows anything else as plain text', () => {
    expect(html('<script>alert(1)</script>')).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html('<img src=x onerror=alert(1)>')).not.toContain('<img');
    expect(html('Moisture <5% & dry')).toContain('Moisture &lt;5% &amp; dry');
  });
  it('drops unsafe links and attributes', () => {
    expect(html('<a href="javascript:alert(1)">x</a>')).not.toContain('<a');
    expect(html('<p onclick="x()">Hi</p>')).not.toContain('onclick');
    expect(html('<a href="https://minmeg.com" onclick="x()">x</a>')).toContain('href="https://minmeg.com"');
  });
  it('copes with broken tags', () => {
    expect(html('</p>Hello<strong>')).toContain('Hello');
  });
});
