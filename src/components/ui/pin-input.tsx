'use client';

import * as React from 'react';
import { cn } from '@/utils/helper';

/*
 * PinInput — a short numeric code (wallet PIN, one-time code) as separate boxes. Typing moves to the
 * next box, Backspace goes back, and pasting fills every box. Digits are masked unless `reveal`.
 */
export interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  reveal?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  /** Read by screen readers, e.g. "Wallet PIN" */
  'aria-label': string;
  className?: string;
}

export function PinInput({ value, onChange, length = 4, reveal = false, error, autoFocus, className, ...rest }: PinInputProps) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const setAt = (i: number, d: string) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join('').slice(0, length));
  };

  return (
    <div role="group" aria-label={rest['aria-label']} className={cn('flex gap-2', className)}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type={reveal ? 'text' : 'password'}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          autoFocus={autoFocus && i === 0}
          aria-label={`${rest['aria-label']} digit ${i + 1}`}
          aria-invalid={error || undefined}
          value={d}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(-1);
            setAt(i, v);
            if (v && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !digits[i] && i > 0) {
              setAt(i - 1, '');
              refs.current[i - 1]?.focus();
            }
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
            if (!pasted) return;
            e.preventDefault();
            onChange(pasted);
            refs.current[Math.min(pasted.length, length - 1)]?.focus();
          }}
          className={cn(
            'h-12 w-12 rounded-lg border bg-canvas text-center text-lg font-medium text-ink outline-none transition-colors',
            'focus:border-primary focus:ring-2 focus:ring-primary/20',
            error ? 'border-semantic-error' : 'border-hairline-strong',
          )}
        />
      ))}
    </div>
  );
}
