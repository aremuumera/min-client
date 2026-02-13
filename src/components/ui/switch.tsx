'use client';

import * as React from 'react';
import { cn } from '@/utils/helper';

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Label for the switch */
  label?: string;
  /** Description text */
  description?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  color?: 'primary' | 'secondary' | 'success' | 'error';
}

const sizeClasses = {
  sm: { track: 'w-8 h-4', thumb: 'h-3 w-3', translate: 'translate-x-4' },
  md: { track: 'w-11 h-6', thumb: 'h-5 w-5', translate: 'translate-x-5' },
  lg: { track: 'w-14 h-7', thumb: 'h-6 w-6', translate: 'translate-x-7' },
};

const colorClasses = {
  primary: 'bg-primary-500',
  secondary: 'bg-secondary-600',
  success: 'bg-success-500',
  error: 'bg-error-500',
};

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      label,
      description,
      size = 'md',
      color = 'primary',
      disabled,
      checked,
      ...props
    },
    ref
  ) => {
    const id = React.useId();
    const sizes = sizeClasses[size];

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            ref={ref}
            id={props.id || id}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'rounded-full transition-colors',
              sizes.track,
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2',
              checked ? colorClasses[color] : 'bg-neutral-200',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div
              className={cn(
                'rounded-full bg-white shadow-sm transition-transform',
                sizes.thumb,
                'absolute top-1/2 -translate-y-1/2 left-0.5',
                checked && sizes.translate
              )}
            />
          </div>
        </label>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={props.id || id}
                className={cn(
                  'text-sm font-medium text-neutral-900 cursor-pointer',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <span className="text-xs text-neutral-500">{description}</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';

export { Switch };
