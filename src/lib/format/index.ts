/*
 * Formatting rules (frontend-design-rules.md §4): exact quantities with their unit, local dates with
 * the full timestamp available, ids exactly as the backend sends them.
 */

/** "120.500000" + "MT" → "120.5 MT". Exact: the string is trimmed, never parsed into a float. */
export function formatQuantity(value: string | number | null | undefined, unit?: string | null): string {
  if (value === null || value === undefined || value === '') return '—';
  const s = String(value);
  if (!/^-?\d+(\.\d+)?$/.test(s)) return s;
  const [int, frac = ''] = s.split('.');
  const trimmed = frac.replace(/0+$/, '');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${grouped}${trimmed ? `.${trimmed}` : ''}${unit ? ` ${unit}` : ''}`;
}

/** Local date and time, e.g. "23 Oct 2026, 14:05" */
export function formatDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Local date only */
export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
