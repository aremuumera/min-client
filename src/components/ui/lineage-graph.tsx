'use client';

import * as React from 'react';

/*
 * A family picture: boxes for records (batches, passports, certificates) and arrows for how they are
 * linked (split, merged, processed, came from, went into). Oldest on the left, newest on the right, the
 * record being viewed highlighted. Built with plain SVG and Tailwind, no chart library. Records the viewer
 * may not see stay as greyed boxes, so the shape is honest without showing their details.
 */

export interface LineageNode {
  id: string;
  title: string;
  /** A second line: type, quantity, or the full ID */
  subtitle?: string;
  status?: string;
  statusLabel?: string;
  /** The viewer may not see this record */
  restricted?: boolean;
  /** What a restricted box says instead of the picture's default (e.g. "Delivered") */
  restrictedTitle?: string;
  /** The record being viewed */
  focus?: boolean;
}

export interface LineageEdge {
  /** The older record */
  from: string;
  /** The newer record */
  to: string;
  label?: string;
}

export interface LineageGraphProps {
  nodes: LineageNode[];
  edges: LineageEdge[];
  /** Describes the picture for screen readers */
  label: string;
  /** Opens a record when its box is pressed (not for the focus or restricted boxes) */
  onSelect?: (id: string) => void;
  restrictedText?: string;
}

export const NODE_W = 208;
export const NODE_H = 92;
/** Wide enough for a link label such as "Processed · 420 t" */
const COL_GAP = 128;
const ROW_GAP = 16;
const PAD = 4;

export interface PlacedNode extends LineageNode {
  level: number;
  x: number;
  y: number;
}

/**
 * Where each box goes. Generations are counted from the focus record: parents one column left, children
 * one column right. Within a column, boxes sit near the boxes they connect to, to keep arrows from crossing.
 */
export function layoutLineage(nodes: LineageNode[], edges: LineageEdge[]): { placed: PlacedNode[]; width: number; height: number } {
  if (!nodes.length) return { placed: [], width: 0, height: 0 };
  const ids = new Set(nodes.map((n) => n.id));
  const links = edges.filter((e) => ids.has(e.from) && ids.has(e.to) && e.from !== e.to);
  const focus = nodes.find((n) => n.focus) ?? nodes[0];

  const level = new Map<string, number>([[focus.id, 0]]);
  for (let changed = true; changed; ) {
    changed = false;
    for (const e of links) {
      if (level.has(e.from) && !level.has(e.to)) {
        level.set(e.to, level.get(e.from)! + 1);
        changed = true;
      } else if (level.has(e.to) && !level.has(e.from)) {
        level.set(e.from, level.get(e.to)! - 1);
        changed = true;
      }
    }
  }
  // records not connected to the focus go to the far right
  const maxLevel = Math.max(...level.values());
  for (const n of nodes) if (!level.has(n.id)) level.set(n.id, maxLevel + 1);

  const neighbours = new Map<string, string[]>();
  for (const e of links) {
    neighbours.set(e.from, [...(neighbours.get(e.from) ?? []), e.to]);
    neighbours.set(e.to, [...(neighbours.get(e.to) ?? []), e.from]);
  }
  const order = new Map(nodes.map((n, i) => [n.id, i]));
  const columns = new Map<number, string[]>();
  for (const n of nodes) columns.set(level.get(n.id)!, [...(columns.get(level.get(n.id)!) ?? []), n.id]);

  // the focus column first, then outwards, each box placed by the average row of its placed neighbours
  const row = new Map<string, number>();
  const place = (lv: number) => {
    const col = columns.get(lv);
    if (!col) return;
    const score = (id: string) => {
      const rows = (neighbours.get(id) ?? []).map((nb) => row.get(nb)).filter((r): r is number => r !== undefined);
      return rows.length ? rows.reduce((a, b) => a + b, 0) / rows.length : order.get(id)!;
    };
    col.sort((a, b) => score(a) - score(b) || order.get(a)! - order.get(b)!);
    col.forEach((id, i) => row.set(id, i));
  };
  const levels = [...columns.keys()].sort((a, b) => a - b);
  place(0);
  for (const lv of levels.filter((l) => l > 0)) place(lv);
  for (const lv of levels.filter((l) => l < 0).reverse()) place(lv);

  const tallest = Math.max(...[...columns.values()].map((c) => c.length));
  const height = tallest * NODE_H + (tallest - 1) * ROW_GAP + PAD * 2;
  const width = levels.length * NODE_W + (levels.length - 1) * COL_GAP + PAD * 2;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const placed: PlacedNode[] = [];
  levels.forEach((lv, colIndex) => {
    const col = columns.get(lv)!;
    const colHeight = col.length * NODE_H + (col.length - 1) * ROW_GAP;
    const top = (height - colHeight) / 2;
    col.forEach((id, i) => placed.push({ ...byId.get(id)!, level: lv, x: PAD + colIndex * (NODE_W + COL_GAP), y: top + i * (NODE_H + ROW_GAP) }));
  });
  return { placed, width, height };
}

export function LineageGraph({ nodes, edges, label, onSelect, restrictedText = 'Not shared with you' }: LineageGraphProps) {
  const { placed, width, height } = React.useMemo(() => layoutLineage(nodes, edges), [nodes, edges]);
  const at = new Map(placed.map((p) => [p.id, p]));
  const markerId = React.useId().replace(/:/g, '');
  const scroller = React.useRef<HTMLDivElement>(null);
  const focusX = placed.find((p) => p.focus)?.x;
  // a wide family opens on the record being viewed, not on its oldest ancestor
  React.useEffect(() => {
    const el = scroller.current;
    if (!el || focusX === undefined) return;
    el.scrollLeft = Math.max(0, focusX - (el.clientWidth - NODE_W) / 2);
  }, [focusX, width]);

  return (
    <figure className="m-0" aria-label={label}>
      <div ref={scroller} className="overflow-x-auto rounded-lg border border-hairline bg-neutral-50 p-2" data-testid="lineage-graph">
        <div className="relative" style={{ width, height }}>
          <svg className="pointer-events-none absolute inset-0 text-neutral-400" width={width} height={height} aria-hidden="true">
            <defs>
              <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
            </defs>
            {edges.map((e, i) => {
              const a = at.get(e.from);
              const b = at.get(e.to);
              if (!a || !b) return null;
              const x1 = a.x + NODE_W;
              const y1 = a.y + NODE_H / 2;
              const x2 = b.x;
              const y2 = b.y + NODE_H / 2;
              const bend = Math.max(24, Math.abs(x2 - x1) / 2);
              return (
                <g key={`${e.from}-${e.to}-${i}`}>
                  <path d={`M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`} fill="none" stroke="currentColor" strokeWidth="1.5" markerEnd={`url(#${markerId})`} />
                  {e.label && (
                    <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} textAnchor="middle" className="fill-neutral-600 text-[11px] font-medium" stroke="#f9fafb" strokeWidth="4" paintOrder="stroke">
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          {placed.map((n) => {
            const clickable = !!onSelect && !n.focus && !n.restricted;
            const body = (
              <>
                <span className="block truncate text-sm font-semibold text-ink">{n.restricted ? (n.restrictedTitle ?? restrictedText) : n.title}</span>
                {n.subtitle && <span className="mt-0.5 block break-all text-[11px] leading-4 text-steel">{n.subtitle}</span>}
                {n.focus ? (
                  <span className="mt-1 inline-block rounded bg-primary-100 px-1.5 text-[11px] font-medium text-primary-800">This record</span>
                ) : (
                  n.statusLabel && <span className="mt-1 inline-block rounded bg-neutral-100 px-1.5 text-[11px] text-neutral-700">{n.statusLabel}</span>
                )}
              </>
            );
            const box = `absolute overflow-hidden rounded-lg border px-2.5 py-2 text-left ${
              n.focus ? 'border-primary-500 bg-primary-50' : n.restricted ? 'border-dashed border-neutral-300 bg-neutral-50' : 'border-hairline bg-white'
            }`;
            const style = { left: n.x, top: n.y, width: NODE_W, height: NODE_H };
            const name = `${n.restricted ? (n.restrictedTitle ?? restrictedText) : n.title}${n.statusLabel ? `, ${n.statusLabel}` : ''}${n.focus ? ', this record' : ''}`;
            return clickable ? (
              <button key={n.id} type="button" className={`${box} hover:border-primary-400 hover:bg-primary-50 focus-visible:outline-2`} style={style} onClick={() => onSelect!(n.id)} aria-label={`Open ${name}`}>
                {body}
              </button>
            ) : (
              <div key={n.id} className={box} style={style} aria-label={name} role="group">
                {body}
              </div>
            );
          })}
        </div>
      </div>
      <figcaption className="mt-1 text-xs text-steel">Oldest on the left. Arrows point to what each record became. Scroll sideways to see the whole family.</figcaption>
    </figure>
  );
}
