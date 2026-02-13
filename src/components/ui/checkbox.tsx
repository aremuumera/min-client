'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/helper';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label for the checkbox */
  label?: React.ReactNode;
  /** Description text below the label */
  description?: string;
  /** Whether the checkbox is in an indeterminate state */
  indeterminate?: boolean;
  /** Color variant */
  color?: 'primary' | 'secondary' | 'success' | 'error';
}

const colorClasses = {
  primary: 'border-primary-500 bg-primary-500',
  secondary: 'border-secondary-600 bg-secondary-600',
  success: 'border-success-500 bg-success-500',
  error: 'border-error-500 bg-error-500',
};

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      description,
      indeterminate = false,
      color = 'primary',
      disabled,
      checked,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const combinedRef = React.useMemo(() => {
      return (node: HTMLInputElement) => {
        // Handle forwarded ref
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
        // Handle local ref
        (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
      };
    }, [ref]);

    // Handle indeterminate state
    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const id = React.useId();

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <div className="relative flex items-center justify-center">
          <input
            ref={combinedRef}
            id={props.id || id}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'h-5 w-5 rounded border-2 transition-colors',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2',
              checked || indeterminate
                ? colorClasses[color]
                : 'border-neutral-300 bg-white',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {(checked || indeterminate) && (
              <div className="flex items-center justify-center h-full w-full text-white">
                {indeterminate ? (
                  <div className="h-0.5 w-2.5 bg-current" />
                ) : (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                )}
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

Checkbox.displayName = 'Checkbox';

export { Checkbox };
