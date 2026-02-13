import * as React from 'react';
import { cn } from '@/utils/helper';

/* ============================================
   FORM LABEL
   ============================================ */

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Whether the label is in an error state */
  error?: boolean;
  /** Whether the field is required */
  required?: boolean;
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, error, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          error ? 'text-error-500' : 'text-neutral-700',
          className
        )}
        style={{ ...(props as any).sx || {} }}
        {...props}
      >
        {children}
        {required && <span className="ml-1 text-error-500">*</span>}
      </label>
    );
  }
);

FormLabel.displayName = 'FormLabel';

/**
 * InputLabel - Alias for FormLabel
 */
export const InputLabel = FormLabel;

/* ============================================
   FORM GROUP
   ============================================ */

export interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Layout direction */
  row?: boolean;
}

const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className, row = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-wrap gap-2',
          row ? 'flex-row items-center' : 'flex-col',
          className
        )}
        {...props}
      />
    );
  }
);

FormGroup.displayName = 'FormGroup';

/* ============================================
   FORM CONTROL LABEL
   ============================================ */

export interface FormControlLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** The control element (Checkbox, Radio, etc.) */
  control: React.ReactElement;
  /** The label text */
  label: React.ReactNode;
  /** Position of the label */
  labelPlacement?: 'start' | 'end' | 'top' | 'bottom';
  /** Value for the control */
  value?: any;
}

const FormControlLabel = React.forwardRef<HTMLLabelElement, FormControlLabelProps>(
  ({ className, control, label, labelPlacement = 'end', value, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'inline-flex items-center cursor-pointer group',
          labelPlacement === 'end' && 'flex-row',
          labelPlacement === 'start' && 'flex-row-reverse',
          labelPlacement === 'top' && 'flex-col-reverse',
          labelPlacement === 'bottom' && 'flex-col',
          className
        )}
        {...props}
      >
        {React.cloneElement(control as React.ReactElement<any>, { value })}
        <span
          className={cn(
            'text-sm text-neutral-700 select-none',
            labelPlacement === 'end' && 'ml-2',
            labelPlacement === 'start' && 'mr-2',
            labelPlacement === 'top' && 'mb-2',
            labelPlacement === 'bottom' && 'mt-2'
          )}
        >
          {label}
        </span>
      </label>
    );
  }
);

FormControlLabel.displayName = 'FormControlLabel';

export interface FormHelperTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  error?: boolean;
}

const FormHelperText = React.forwardRef<
  HTMLParagraphElement,
  FormHelperTextProps
>(({ className, error, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn(
        "text-xs mt-1.5",
        error ? "text-error-500" : "text-neutral-500",
        className
      )}
      {...props}
    />
  );
});
FormHelperText.displayName = "FormHelperText";

export interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {
  fullWidth?: boolean;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  sx?: any;
  component?: React.ElementType;
}

const FormControl = React.forwardRef<HTMLDivElement, FormControlProps>(
  ({ className, fullWidth, error, required, disabled, component: Component = 'div', sx, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'flex flex-col gap-1.5',
          fullWidth && 'w-full',
          disabled && 'opacity-50 pointer-events-none',
          className
        )}
        style={{ ...(sx || {}) }}
        {...props}
      />
    );
  }
);

FormControl.displayName = 'FormControl';

export { FormLabel, FormGroup, FormControlLabel, FormControl, FormHelperText };
