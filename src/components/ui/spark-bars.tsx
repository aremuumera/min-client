import * as React from 'react';
import { cn } from '@/utils/helper';

/* SparkBars — a tiny bar chart of recent counts (decorative; the figure next to it carries the meaning). Flat, no shadow. */
export interface SparkBarsProps {
  values: number[];
  /** Height of the tallest bar in px */
  height?: number;
  className?: string;
}

export function SparkBars({ values, height = 30, className }: SparkBarsProps) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  return (
    <span aria-hidden="true" className={cn('flex items-end gap-[3px]', className)} style={{ height }}>
      {values.map((v, i) => (
        <span
          key={i}
          className={cn('w-[5px] rounded-sm', i === values.length - 1 ? 'bg-primary' : 'bg-brand-green-soft')}
          style={{ height: Math.max(3, Math.round((v / max) * height)) }}
        />
      ))}
    </span>
  );
}
