import { describe, it, expect } from 'vitest';
import { codeFromName, CODE_PATTERN, locationLabel, outlinePoints, outlineToBoundary, positionErrors, type LngLat } from '@/lib/locations';

describe('locations helpers', () => {
  it('codes made from a name pass the backend code rule', () => {
    expect(codeFromName('Gate A (north)')).toBe('GATE_A_NORTH');
    for (const n of ['Gate A', '2nd weighbridge', 'Tin pit #3']) expect(CODE_PATTERN.test(codeFromName(n))).toBe(true);
  });

  it('an outline closes itself, needs 3 points, and reads back without the repeat', () => {
    const pts: LngLat[] = [[8.9, 9.5], [8.91, 9.5], [8.91, 9.51]];
    expect(outlineToBoundary(pts.slice(0, 2))).toBeNull();
    const poly = outlineToBoundary(pts)!;
    expect(poly.coordinates[0]).toHaveLength(4);
    expect(poly.coordinates[0][3]).toEqual(pts[0]);
    expect(outlinePoints(poly)).toEqual(pts);
    expect(outlinePoints(null)).toEqual([]);
  });

  it('a position needs both numbers, in range; a radius needs a position', () => {
    expect(positionErrors('', '', '', 0)).toEqual({});
    expect(positionErrors('9.5', '8.9', '500', 0)).toEqual({});
    expect(positionErrors('9.5', '', '', 0).longitude).toBeTruthy();
    expect(positionErrors('95', '8.9', '', 0).latitude).toBeTruthy();
    expect(positionErrors('', '', '50', 0).geofenceRadiusMeters).toBeTruthy();
    expect(positionErrors('9.5', '8.9', '0', 1).geofenceRadiusMeters).toBeTruthy();
  });

  it('labels read as words', () => {
    expect(locationLabel('MINE_LOCATION')).toBe('Mine');
    expect(locationLabel('STORAGE_FACILITY')).toBe('Storage facility');
    expect(locationLabel(null)).toBe('—');
  });
});
