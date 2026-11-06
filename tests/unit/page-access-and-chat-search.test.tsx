import { describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import * as React from 'react';
import { pagePermission } from '@/lib/permissions/page-access';
import { chatMatches } from '@/components/dashboard/chat/direct-search';
import { useCloseOnEscape } from '@/lib/ui/use-close-on-escape';

describe('pagePermission: the menu key that guards an address', () => {
  it('follows the menu entry, including pages under it', () => {
    expect(pagePermission('/dashboard/wallet')).toBe('wallet');
    expect(pagePermission('/dashboard/invoices/935dc217-daa9-4e33-9b04-60996aa29181')).toBe('invoices');
    expect(pagePermission('/dashboard/supplier-list/update/abc')).toBe('products');
    expect(pagePermission('/dashboard/settings/team')).toBe('team_management');
    expect(pagePermission('/dashboard/inspections/workbench/abc')).toBe('inspectionsHub');
    expect(pagePermission('/dashboard/inspections/analytics')).toBe('inspectors');
  });
  it('uses the backend key for pages whose menu key was wrong', () => {
    expect(pagePermission('/dashboard/received-inquiries')).toBe('enquiries');
    expect(pagePermission('/dashboard/my-submitted-offers')).toBe('submittedOffers');
  });
  it('leaves pages with no menu key open, and share links always open', () => {
    expect(pagePermission('/dashboard/overview')).toBeUndefined();
    expect(pagePermission('/dashboard/notifications')).toBeUndefined();
    expect(pagePermission('/dashboard/documents/open/some-token')).toBeUndefined();
    expect(pagePermission('/dashboard/documents')).toBe('documents');
  });
});

describe('chatMatches: the chat search', () => {
  const chat = {
    itemTitle: 'Columbite Concentrate 52% Nb2O5',
    conversationId: '935dc217-daa9-4e33-9b04-60996aa29181',
    aliasText: 'Buyer #1',
    roleTag: 'SALES',
    metadata: { status: 'IN_NEGOTIATION' },
    lastMessage: { content: 'Assay attached' },
  };
  it('finds a chat by product, any part of the full ID, alias, status or last message', () => {
    for (const q of ['in_negotiation', 'In Negotiation', 'columbite', '9b04-6099', 'buyer #1', 'negotiation', 'assay', 'sales', 'nb2o5 columbite']) expect(chatMatches(chat, q)).toBe(true);
  });
  it('needs every word to match, and copes with missing fields', () => {
    expect(chatMatches(chat, 'columbite lithium')).toBe(false);
    expect(chatMatches({}, 'tin')).toBe(false);
    expect(chatMatches({}, '  ')).toBe(true);
  });
});

describe('useCloseOnEscape', () => {
  function Probe({ onClose, open }: { onClose: () => void; open: boolean }) {
    useCloseOnEscape(open, onClose);
    return null;
  }
  it('closes an open layer on Escape and stops the key reaching what is underneath', () => {
    let closed = 0;
    let reachedBelow = 0;
    const below = () => reachedBelow++;
    document.addEventListener('keydown', below);
    render(<Probe open onClose={() => closed++} />);
    act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    act(() => void document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    document.removeEventListener('keydown', below);
    expect(closed).toBe(2);
    expect(reachedBelow).toBe(0);
  });
  it('does nothing while closed', () => {
    let closed = 0;
    render(<Probe open={false} onClose={() => closed++} />);
    act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(closed).toBe(0);
  });
});
