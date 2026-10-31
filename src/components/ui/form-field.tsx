import * as React from 'react';
import { cn } from '@/utils/helper';

/*
 * FormField — label, the control, help text and the error under it (backend field errors are
 * shown here, next to the right field). Links them for screen readers.
 */
export interface FormFieldProps {
  label: React.ReactNode;
  /** The control's id (label `for`) */
  htmlFor: string;
  required?: boolean;
  help?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ label, htmlFor, required, help, error, className, children }: FormFieldProps) {
  const helpId = `${htmlFor}-help`;
  const errorId = `${htmlFor}-error`;
  const control = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        'aria-invalid': error ? true : undefined,
        'aria-describedby': [error ? errorId : null, help ? helpId : null].filter(Boolean).join(' ') || undefined,
      })
    : children;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-semantic-error-text" aria-hidden>*</span>}
      </label>
      {control}
      {help && !error && <p id={helpId} className="text-[13px] text-steel">{help}</p>}
      {error && <p id={errorId} className="text-[13px] text-semantic-error-text" role="alert">{error}</p>}
    </div>
  );
}
