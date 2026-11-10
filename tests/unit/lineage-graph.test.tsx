import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { LineageGraph, layoutLineage, type LineageEdge, type LineageNode } from '@/components/ui/lineage-graph';
import { relationshipPicture, type RelationshipTree } from '@/lib/passports';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const C = '33333333-3333-4333-8333-333333333333';
const D = '44444444-4444-4444-8444-444444444444';
const E = '55555555-5555-4555-8555-555555555555';

// A and B were merged into C (the batch viewed); C was split into D and E
const nodes: LineageNode[] = [
  { id: C, title: 'B-C', focus: true },
  { id: A, title: 'B-A', statusLabel: 'Active' },
  { id: B, title: 'B-B', restricted: true, subtitle: B },
  { id: D, title: 'B-D' },
  { id: E, title: 'B-E' },
];
const edges: LineageEdge[] = [
  { from: A, to: C, label: 'Merged' },
  { from: B, to: C, label: 'Merged' },
  { from: C, to: D, label: 'Split' },
  { from: C, to: E, label: 'Split' },
];

describe('layoutLineage: where each box goes', () => {
  it('puts parents one column left of the record and children one column right, each record once', () => {
    const { placed } = layoutLineage(nodes, edges);
    const level = Object.fromEntries(placed.map((p) => [p.id, p.level]));
    expect(level).toEqual({ [A]: -1, [B]: -1, [C]: 0, [D]: 1, [E]: 1 });
    expect(placed).toHaveLength(5);
    const x = (id: string) => placed.find((p) => p.id === id)!.x;
    expect(x(A)).toBeLessThan(x(C));
    expect(x(C)).toBeLessThan(x(D));
    expect(x(D)).toBe(x(E));
  });

  it('counts several generations, and puts a record linked to nothing on the far right', () => {
    const lone = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const { placed } = layoutLineage([...nodes, { id: lone, title: 'B-X' }], [...edges, { from: D, to: E }]);
    expect(placed.find((p) => p.id === E)!.level).toBe(1);
    expect(placed.find((p) => p.id === lone)!.level).toBe(2);
  });

  it('ignores links to records it was not given, and an empty family draws nothing', () => {
    expect(layoutLineage([{ id: A, title: 'B-A', focus: true }], [{ from: A, to: 'missing' }]).placed).toHaveLength(1);
    expect(layoutLineage([], [])).toEqual({ placed: [], width: 0, height: 0 });
  });
});

describe('LineageGraph: the picture', () => {
  afterEach(cleanup);
  it('opens a record when its box is pressed, but not the record viewed or one not shared', () => {
    const onSelect = vi.fn();
    render(<LineageGraph nodes={nodes} edges={edges} label="Family" onSelect={onSelect} restrictedText="Not shared with you" />);
    fireEvent.click(screen.getByRole('button', { name: /Open B-A/ }));
    expect(onSelect).toHaveBeenCalledWith(A);
    expect(screen.queryByRole('button', { name: /B-C/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Not shared/ })).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('labels the links, keeps full IDs and hides what is not shared', () => {
    render(<LineageGraph nodes={nodes} edges={edges} label="Family" />);
    expect(screen.getAllByText('Merged')).toHaveLength(2);
    expect(screen.getAllByText('Split')).toHaveLength(2);
    expect(screen.getByText(B)).toBeTruthy();
    expect(screen.queryByText('B-B')).toBeNull();
    expect(screen.getByText('This record')).toBeTruthy();
  });
});

describe('relationshipPicture: a passport or certificate and what it is linked to', () => {
  const P = '935dc217-daa9-4e33-9b04-60996aa29181';
  const parent = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1';
  const child = 'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2';
  const shipment = 'c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3';
  const tree: RelationshipTree = {
    passport: { id: P, passportCode: 'DPP-2026-0001', status: 'PUBLISHED' },
    subject: { type: 'BATCH', id: 'batch-1', label: 'B-20260929-5B74EB' },
    lineage: [
      { relationshipType: 'DERIVED_FROM', lineageType: 'SPLIT_FROM', batchId: 'batch-0', passport: { id: parent, passportCode: 'DPP-2026-0000', status: 'PUBLISHED' } },
      { relationshipType: 'DERIVED_INTO', lineageType: 'TRANSFORMED_FROM', batchId: 'batch-2', passport: { id: child, passportCode: 'DPP-2026-0002', status: 'DRAFT' } },
    ],
    relationships: [{ id: 'r1', relationshipType: 'SHIPPED_IN', source: { type: 'PASSPORT', id: P }, target: { type: 'SHIPMENT', id: shipment } }],
  };

  it('puts the passport it came from before it, and the ones it went into and its links after it', () => {
    const { nodes, edges } = relationshipPicture(tree, P);
    expect(nodes.find((n) => n.focus)).toMatchObject({ id: P, title: 'DPP-2026-0001', subtitle: 'B-20260929-5B74EB' });
    expect(edges).toEqual([
      { from: parent, to: P, label: 'Split from' },
      { from: P, to: child, label: 'Transformed from' },
      { from: P, to: `SHIPMENT:${shipment}`, label: 'Shipped in' },
    ]);
    // the linked record keeps its full ID
    expect(nodes.find((n) => n.id === `SHIPMENT:${shipment}`)?.subtitle).toBe(shipment);
    const { placed } = layoutLineage(nodes, edges);
    expect(placed.find((p) => p.id === parent)!.level).toBe(-1);
    expect(placed.find((p) => p.id === child)!.level).toBe(1);
  });

  it('a certificate is drawn from the record it was issued from', () => {
    const { nodes, edges } = relationshipPicture({ certificate: { id: P, certificateCode: 'CERT-1', status: 'ISSUED' }, subject: { type: 'ORGANIZATION', id: 'org-1' }, relationships: [], source: { type: 'INSPECTION_RESULT', id: shipment, records: null } }, P);
    expect(nodes.find((n) => n.focus)?.title).toBe('CERT-1');
    expect(edges).toEqual([{ from: `INSPECTION_RESULT:${shipment}`, to: P, label: 'Issued from' }]);
  });
});
