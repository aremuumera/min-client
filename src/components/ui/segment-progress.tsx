import * as React from 'react';
import { cn } from '@/utils/helper';

/* SegmentProgress — "step 3 of 10" as small segments: done (green), current (lime), still to come (hairline). */
export interface SegmentProgressProps {
  step: number;
  total: number;
  /** Shown after the segments, e.g. "Step 3 of 10" */
  label?: React.ReactNode;
  className?: string;
}

export function SegmentProgress({ step, total, label, className }: SegmentProgressProps) {
  const count = Math.max(1, total);
  return (
    <span className={cn('flex items-center gap-[3px]', className)} role="img" aria-label={`Step ${step} of ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={cn('h-1.5 w-2.5 shrink-0 rounded-full', i < step - 1 ? 'bg-primary' : i === step - 1 ? 'bg-brand-green-light' : 'bg-hairline')} />
      ))}
      {label && <span className="ml-2 whitespace-nowrap text-xs text-steel">{label}</span>}
    </span>
  );
}
