'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Pentagon, Undo2, X } from 'lucide-react';
import type { LngLat } from '@/lib/locations';
import { Button } from './button';
import { Skeleton } from './skeleton';

const Inner = dynamic(() => import('./map-picker-inner'), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });

export interface MapPickerProps {
  /** Where the map opens when nothing is set */
  center: [number, number];
  zoom?: number;
  latitude: string;
  longitude: string;
  radius: string;
  outline: LngLat[];
  onPoint?: (latitude: string, longitude: string) => void;
  onClearPoint?: () => void;
  onOutline?: (points: LngLat[]) => void;
  height?: number;
}

/**
 * Shows a site's position and zone. With onPoint it is also a picker: click to drop the pin, or switch
 * to outline and click round an odd-shaped zone. Latitude and longitude can always be typed instead.
 */
export function MapPicker({ center, zoom = 6, latitude, longitude, radius, outline, onPoint, onClearPoint, onOutline, height = 280 }: MapPickerProps) {
  const [tool, setTool] = React.useState<'pin' | 'outline'>('pin');
  const editable = !!onPoint;
  const lat = latitude.trim() === '' ? NaN : Number(latitude);
  const lng = longitude.trim() === '' ? NaN : Number(longitude);
  const point: [number, number] | null = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lat, lng] : null;
  const firstOutline = outline[0] ? ([outline[0][1], outline[0][0]] as [number, number]) : null;
  const focus = point ?? firstOutline ?? center;
  const r = Number(radius);

  const click = (clickLat: number, clickLng: number) => {
    if (tool === 'pin') onPoint?.(String(clickLat), String(clickLng));
    else if (outline.length < 499) onOutline?.([...outline, [clickLng, clickLat]]);
  };

  return (
    <div className="flex flex-col gap-2">
      {editable && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant={tool === 'pin' ? 'contained' : 'outlined'} onClick={() => setTool('pin')} startIcon={<MapPin className="h-4 w-4" aria-hidden />} aria-pressed={tool === 'pin'}>
            Drop pin
          </Button>
          <Button type="button" size="sm" variant={tool === 'outline' ? 'contained' : 'outlined'} onClick={() => setTool('outline')} startIcon={<Pentagon className="h-4 w-4" aria-hidden />} aria-pressed={tool === 'outline'}>
            Draw outline
          </Button>
          {point && tool === 'pin' && onClearPoint && (
            <Button type="button" size="sm" variant="text" color="secondary" onClick={onClearPoint} startIcon={<X className="h-4 w-4" aria-hidden />}>
              Remove pin
            </Button>
          )}
          {tool === 'outline' && outline.length > 0 && (
            <>
              <Button type="button" size="sm" variant="text" color="secondary" onClick={() => onOutline?.(outline.slice(0, -1))} startIcon={<Undo2 className="h-4 w-4" aria-hidden />}>
                Undo point
              </Button>
              <Button type="button" size="sm" variant="text" color="secondary" onClick={() => onOutline?.([])} startIcon={<X className="h-4 w-4" aria-hidden />}>
                Clear outline
              </Button>
            </>
          )}
        </div>
      )}
      <div className="isolate overflow-hidden rounded-lg border border-hairline-strong" style={{ height }} data-testid="map-picker">
        <Inner center={focus} zoom={point || firstOutline ? Math.max(zoom, 13) : zoom} point={point} radius={r > 0 ? r : null} outline={outline} drawing={editable && tool === 'outline'} height={height} onClick={editable ? click : undefined} />
      </div>
      {editable && <p className="text-xs text-steel">{tool === 'pin' ? 'Click the map to place the pin.' : `Click round the zone. ${outline.length < 3 ? `At least 3 points (${outline.length} so far).` : `${outline.length} points.`}`}</p>}
    </div>
  );
}
