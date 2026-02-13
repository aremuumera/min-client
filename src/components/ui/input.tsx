import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helper';

const inputVariants = cva(
  [
    'flex w-full rounded-lg border bg-transparent px-3 py-2',
    'text-sm text-foreground placeholder:text-neutral-400',
    'transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
  ],
  {
    variants: {
      variant: {
        outlined: 'border-neutral-200 focus-visible:border-primary-500',
        filled: 'border-transparent bg-neutral-100 focus-visible:bg-white focus-visible:border-primary-500',
      },
      inputSize: {
        sm: 'h-8 text-xs',
        md: 'h-10 text-sm',
        lg: 'h-12 text-base',
      },
      error: {
        true: 'border-error-500 focus-visible:ring-error-500',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'outlined',
      inputSize: 'md',
      error: false,
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, 'size'>,
  Omit<VariantProps<typeof inputVariants>, 'error'> {
  /** Label for the input */
  label?: string;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Error state or message to display */
  error?: string | boolean;
  /** Error message to display (alternative to passing string to error) */
  errorMessage?: string;
  /** Start adornment */
  startAdornment?: React.ReactNode;
  /** End adornment */
  endAdornment?: React.ReactNode;
  /** Whether to render as a textarea */
  multiline?: boolean;
  /** Whether to render as a select */
  select?: boolean;
  /** Number of rows for textarea */
  rows?: number;
  /** MUI-style system props */
  sx?: any;
  /** Full width */
  fullWidth?: boolean;
  /** Margin (MUI compatibility) */
  margin?: 'none' | 'dense' | 'normal';
  /** InputProps (MUI compatibility) */
  InputProps?: any;
  /** InputLabelProps (MUI compatibility) */
  InputLabelProps?: any;
  /** Children (for select options or other usage) */
  children?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement, InputProps>(
  (
    {
      className,
      variant,
      inputSize,
      error,
      label,
      helperText,
      errorMessage,
      startAdornment,
      endAdornment,
      id,
      multiline,
      select,
      rows,
      sx,
      fullWidth,
      margin,
      style,
      children,
      // Destructure other potential MUI props to filter them
      InputProps,
      InputLabelProps,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const hasError = !!error || !!errorMessage;
    const resolvedErrorMessage = typeof error === 'string' ? error : errorMessage;

    let Component: any = multiline ? 'textarea' : 'input';
    if (select) Component = 'select';

    return (
      <div className={cn('w-full', fullWidth && 'w-full', margin === 'normal' && 'my-4', margin === 'dense' && 'my-2')}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {startAdornment && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              {startAdornment}
            </div>
          )}
          {Component === 'input' ? (
            <Component
              id={inputId}
              className={cn(
                inputVariants({ variant, inputSize, error: hasError }),
                startAdornment && 'pl-10',
                endAdornment && 'pr-10',
                multiline && 'min-h-[80px] py-2 resize-none',
                select && 'appearance-none pr-8 bg-no-repeat bg-position-[right_0.5rem_center] bg-size-[1.5em_1.5em]',
                className
              )}
              ref={ref as any}
              rows={rows}
              style={{ ...sx, ...style }}
              {...(props as any)}
            />
          ) : (
            <Component
              id={inputId}
              className={cn(
                inputVariants({ variant, inputSize, error: hasError }),
                startAdornment && 'pl-10',
                endAdornment && 'pr-10',
                multiline && 'min-h-[80px] py-2 resize-none',
                select && 'appearance-none pr-8 bg-no-repeat bg-position-[right_0.5rem_center] bg-size-[1.5em_1.5em]',
                className
              )}
              ref={ref as any}
              rows={rows}
              style={{ ...sx, ...style }}
              {...(props as any)}
            >
              {children}
            </Component>
          )}
          {select && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
          {endAdornment && !select && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
              {endAdornment}
            </div>
          )}
        </div>
        {(resolvedErrorMessage || helperText) && (
          <p
            className={cn(
              'mt-1.5 text-xs',
              hasError ? 'text-error-500' : 'text-neutral-500'
            )}
          >
            {resolvedErrorMessage || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * TextField - Alias for Input (MUI compatibility)
 */
export const TextField = Input;

/**
 * FormHelperText
 */
export const FormHelperText = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { error?: boolean }
>(({ className, error, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'mt-1.5 text-xs',
      error ? 'text-error-500' : 'text-neutral-500',
      className
    )}
    {...props}
  />
));
FormHelperText.displayName = 'FormHelperText';

/**
 * InputAdornment
 */
export const InputAdornment = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { position?: 'start' | 'end' }
>(({ className, position, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center text-neutral-500',
      position === 'start' ? 'mr-2' : 'ml-2',
      className
    )}
    {...props}
  />
));
InputAdornment.displayName = 'InputAdornment';

/**
 * InputLabel
 */
export const InputLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & { error?: boolean }
>(({ className, error, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'mb-1.5 block text-sm font-medium',
      error ? 'text-error-500' : 'text-neutral-700',
      className
    )}
    {...props}
  />
));
InputLabel.displayName = 'InputLabel';

export { Input, inputVariants };
