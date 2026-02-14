import { cn } from '@/utils/helper';
import { Loader2 } from 'lucide-react';

/* ============================================
   LINEAR PROGRESS
   ============================================ */

export interface LinearProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current value (0-100) */
  value?: number;
  /** Whether the progress is indeterminate */
  indeterminate?: boolean;
  /** Color variant */
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const colorClasses = {
  primary: 'bg-primary-500',
  secondary: 'bg-secondary-500',
  success: 'bg-success-500',
  info: 'bg-info-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
};

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

function LinearProgress({
  className,
  value = 0,
  indeterminate = false,
  color = 'primary',
  size = 'md',
  ...props
}: LinearProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'w-full overflow-hidden rounded-full bg-neutral-200',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-300',
          colorClasses[color],
          indeterminate && 'animate-progress-indeterminate'
        )}
        style={
          indeterminate
            ? undefined
            : { width: `${clampedValue}%` }
        }
      />
    </div>
  );
}

/* ============================================
   CIRCULAR PROGRESS
   ============================================ */

export interface CircularProgressProps
  extends React.SVGAttributes<SVGSVGElement> {
  /** Current value (0-100) */
  value?: number;
  /** Whether the progress is indeterminate */
  indeterminate?: boolean;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Color variant */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'inherit';
}

const strokeColorClasses = {
  primary: 'stroke-primary-500',
  secondary: 'stroke-secondary-500',
  success: 'stroke-success-500',
  info: 'stroke-info-500',
  warning: 'stroke-warning-500',
  error: 'stroke-error-500',
  inherit: 'stroke-current',
};

const circularColorClasses = {
  primary: 'text-primary-500',
  secondary: 'text-secondary-600',
  success: 'text-success-500',
  warning: 'text-warning-500',
  error: 'text-error-500',
  info: 'text-info-500',
  inherit: 'text-inherit',
};

function CircularProgress({
  className,
  value = 0,
  indeterminate = false,
  size = 40,
  strokeWidth = 4,
  color = 'primary',
  ...props
}: CircularProgressProps) {
  return (
    <Loader2
      size={size}
      className={cn('animate-spin', circularColorClasses[color], className)}
      {...props}
    />
  );
}

export { LinearProgress, CircularProgress };
