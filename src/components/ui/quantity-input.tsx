'use client';

import * as React from 'react';
import { cn } from '@/utils/helper';

/*
 * QuantityInput — an exact decimal quantity with its unit. The value stays a string with at most
 * 6 decimals (the backend's DECIMAL(24,6)); never turned into a float.
 */
export const QUANTITY_PATTERN = /^\d{0,18}(\.\d{0,6})?$/;

export interface QuantityInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: string;
  onChange: (value: string) => void;
  /** The unit shown after the number (e.g. "MT"), or a unit picker */
  unit?: React.ReactNode;
  error?: boolean;
}

export const QuantityInput = React.forwardRef<HTMLInputElement, QuantityInputProps>(({ value, onChange, unit, error, className, disabled, ...props }, ref) => (
  // the whole 44px box is the touch target: tapping the unit or the border focuses the number
  <div
    data-touch-target
    onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement | null)?.focus()}
    className={cn(
      'flex h-11 w-full items-stretch overflow-hidden rounded-lg border bg-canvas focus-within:ring-2',
      error ? 'border-semantic-error focus-within:ring-semantic-error' : 'border-hairline-strong focus-within:border-primary focus-within:ring-primary',
      disabled && 'bg-surface-soft',
      className,
    )}
  >
    <input
      ref={ref}
      inputMode="decimal"
      autoComplete="off"
      value={value}
      disabled={disabled}
      onChange={(e) => {
        const next = e.target.value.replace(',', '.');
        if (QUANTITY_PATTERN.test(next)) onChange(next);
      }}
      className="min-w-0 flex-1 bg-transparent px-3 text-base text-ink tabular-nums outline-none placeholder:text-muted disabled:text-muted md:text-sm"
      {...props}
    />
    {unit && <div className="flex shrink-0 items-center border-l border-hairline bg-surface px-3 text-sm font-medium text-slate">{unit}</div>}
  </div>
));
QuantityInput.displayName = 'QuantityInput';
