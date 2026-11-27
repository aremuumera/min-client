import type { UnitChoice } from '@/lib/batches';

export interface UnitOption {
  value: string;
  label: string;
}

const unitText = (u: UnitChoice) => u.symbol || u.code;
const unitLabel = (u: UnitChoice) => (u.name ? `${u.name} (${unitText(u)})` : unitText(u));
const typeOf = (u: UnitChoice) => u.measurementTypeId ?? u.measurementType?.id ?? null;

/**
 * The units a buyer may ask for a listing in (owner, 2026-11-27): every active unit that measures the same kind of
 * thing as the listing's own unit (weight for ore: tonne, kilogram, gram…), by full name, the listing's unit first.
 * Nothing is converted on screen; the backend checks a minimum order in the listing's unit.
 * Null when the listing's unit is unknown (older listings): the form keeps its general list.
 */
export function inquiryUnitOptions(units: UnitChoice[], listedUnitId: string | null | undefined, listedMeasure: string | null | undefined): UnitOption[] | null {
  const listed = units.find((u) => u.id === listedUnitId) ?? units.find((u) => !!listedMeasure && (u.symbol === listedMeasure || u.code === listedMeasure));
  if (!listed) return null;
  const kind = typeOf(listed);
  const others = units
    .filter((u) => u.id !== listed.id && kind !== null && typeOf(u) === kind)
    .sort((a, b) => unitLabel(a).localeCompare(unitLabel(b)));
  return [listed, ...others].map((u) => ({ value: unitText(u), label: unitLabel(u) }));
}
