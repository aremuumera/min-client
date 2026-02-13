'use client';

import * as React from 'react';
import { cn } from '@/utils/helper';

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label for the radio button */
  label?: string;
  /** Description text below the label */
  description?: string;
  /** Color variant */
  color?: 'primary' | 'secondary' | 'success' | 'error';
}

const colorClasses = {
  primary: 'border-primary-500 bg-primary-500',
  secondary: 'border-secondary-600 bg-secondary-600',
  success: 'border-success-500 bg-success-500',
  error: 'border-error-500 bg-error-500',
};

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, color = 'primary', disabled, checked, ...props }, ref) => {
    const id = React.useId();

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <div className="relative flex items-center justify-center">
          <input
            ref={ref}
            id={props.id || id}
            type="radio"
            checked={checked}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'h-5 w-5 rounded-full border-2 transition-colors',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2',
              checked ? colorClasses[color] : 'border-neutral-300 bg-white',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {checked && (
              <div className="flex items-center justify-center h-full w-full">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
            )}
          </div>
        </div>

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

Radio.displayName = 'Radio';

/* ============================================
   RADIO GROUP
   ============================================ */

export interface RadioGroupProps {
  /** Name for the radio group */
  name: string;
  /** Current value */
  value?: string;
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Children (Radio components) */
  children: React.ReactNode;
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Label for the group */
  label?: string;
  /** Class name */
  className?: string;
  /** Row layout alias for direction='horizontal' */
  row?: boolean;
}

function RadioGroup({
  name,
  value,
  onChange,
  children,
  direction = 'vertical',
  row = false,
  label,
  className,
}: RadioGroupProps) {
  const actualDirection = row ? 'horizontal' : direction;
  return (
    <div className={className} role="radiogroup" aria-label={label}>
      {label && (
        <p className="mb-2 text-sm font-medium text-neutral-700">{label}</p>
      )}
      <div
        className={cn(
          'flex gap-4',
          actualDirection === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
        )}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement<RadioProps>(child)) {
            return React.cloneElement(child, {
              name,
              checked: child.props.value === value,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                onChange?.(e.target.value);
              },
            });
          }
          return child;
        })}
      </div>
    </div>
  );
}

export { Radio, RadioGroup };
