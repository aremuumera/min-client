'use client';

import * as React from 'react';
import { cn } from '@/utils/helper';

export interface NativeSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface NativeSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: readonly NativeSelectOption[];
  /** First option with an empty value ("All", "None"…) */
  placeholder?: string;
  onValueChange: (value: string) => void;
  error?: boolean;
}

/** The browser's own select, styled like Input: works with keyboards, screen readers and phone pickers */
export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ options, placeholder, onValueChange, error, className, ...props }, ref) => (
    <select
      ref={ref}
      onChange={(e) => onValueChange(e.target.value)}
      aria-invalid={error || undefined}
      className={cn(
        'h-11 w-full rounded-lg border bg-canvas px-3 text-base text-ink disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted md:text-sm',
        error ? 'border-semantic-error' : 'border-hairline-strong',
        className,
      )}
      {...props}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
    </select>
  ),
);
NativeSelect.displayName = 'NativeSelect';
