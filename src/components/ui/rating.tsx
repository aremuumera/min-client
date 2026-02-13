import * as React from 'react';
import { cn } from '@/utils/helper';
import { Star } from 'lucide-react';

export interface RatingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Value (0-5) */
  value?: number;
  /** Maximum value */
  max?: number;
  /** Callback when value changes */
  onChange?: (value: number) => void;
  /** Precision (0.5 or 1) */
  precision?: 0.5 | 1;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Read only mode */
  readOnly?: boolean;
}

const Rating = React.forwardRef<HTMLDivElement, RatingProps>(
  ({ className, value = 0, max = 5, onChange, precision = 1, size = 'md', readOnly = false, ...props }, ref) => {
    const [hoverValue, setHoverValue] = React.useState<number | null>(null);

    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-7 w-7',
    };

    const handleClick = (val: number) => {
      if (readOnly) return;
      onChange?.(val);
    };

    const renderStar = (index: number) => {
      const displayValue = hoverValue !== null ? hoverValue : value;
      const filled = displayValue >= index;
      const half = precision === 0.5 && displayValue >= index - 0.5 && displayValue < index;

      return (
        <div
          key={index}
          className={cn(
            'relative cursor-pointer transition-transform active:scale-90',
            readOnly && 'cursor-default active:scale-100'
          )}
          onMouseMove={(e) => {
            if (readOnly) return;
            if (precision === 0.5) {
              const rect = e.currentTarget.getBoundingClientRect();
              const isHalf = e.clientX - rect.left < rect.width / 2;
              setHoverValue(isHalf ? index - 0.5 : index);
            } else {
              setHoverValue(index);
            }
          }}
          onMouseLeave={() => !readOnly && setHoverValue(null)}
          onClick={() => handleClick(hoverValue !== null ? hoverValue : index)}
        >
          <Star
            className={cn(
              sizeClasses[size],
              filled ? 'fill-warning-400 text-warning-400' : 'text-neutral-300',
              half && 'hidden'
            )}
          />
          {half && (
            <div className="relative overflow-hidden">
              <Star className={cn(sizeClasses[size], 'text-neutral-300')} />
              <div className="absolute inset-0 w-1/2 overflow-hidden">
                <Star className={cn(sizeClasses[size], 'fill-warning-400 text-warning-400')} />
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-0.5', className)}
        {...props}
      >
        {Array.from({ length: max }, (_, i) => renderStar(i + 1))}
      </div>
    );
  }
);

Rating.displayName = 'Rating';

export { Rating };
