'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from './skeleton';
import type { TrackMapInnerProps } from './track-map-inner';

const Inner = dynamic(() => import('./track-map-inner'), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });

export type { TrackMapPlace } from './track-map-inner';
export type TrackMapProps = Omit<TrackMapInnerProps, 'height'> & { height?: number };

/** A shipment on a map: sites and checkpoints, the trail so far, and the live position */
export function TrackMap({ height = 300, ...props }: TrackMapProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline" style={{ height }}>
      <Inner {...props} height={height} />
    </div>
  );
}
