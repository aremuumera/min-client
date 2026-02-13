'use client';

import * as React from 'react';
import { cn } from '@/utils/helper';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size'> {
  /** Value */
  value?: number | [number, number];
  /** Min value */
  min?: number;
  /** Max value */
  max?: number;
  /** Step */
  step?: number;
  /** Callback when value changes */
  onChange?: (value: number | [number, number]) => void;
  /** Color variant */
  color?: 'primary' | 'secondary';
  /** Size variant */
  size?: 'sm' | 'md';
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, value = 0, min = 0, max = 100, step = 1, onChange, color = 'primary', size = 'md', ...props }, ref) => {
    const isRange = Array.isArray(value);

    const calculatePercentage = (val: number) => {
      return ((val - min) / (max - min)) * 100;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
      const newVal = parseFloat(e.target.value);
      if (isRange) {
        const nextValue = [...value] as [number, number];
        nextValue[index!] = newVal;
        onChange?.(nextValue as [number, number]);
      } else {
        onChange?.(newVal);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex w-full touch-none select-none items-center py-4',
          className
        )}
      >
        {/* Track Background */}
        <div className={cn(
          'relative h-1 w-full grow overflow-hidden rounded-full bg-neutral-200',
          size === 'sm' ? 'h-0.5' : 'h-1'
        )}>
          {/* Active Track */}
          <div
            className={cn(
              'absolute h-full bg-primary-500',
              color === 'secondary' && 'bg-secondary-500'
            )}
            style={{
              left: isRange ? `${calculatePercentage(Math.min(value[0], value[1]))}%` : '0%',
              right: isRange ? `${100 - calculatePercentage(Math.max(value[0], value[1]))}%` : `${100 - calculatePercentage(value as number)}%`,
            }}
          />
        </div>

        {/* Input sliders (transparent over the track) */}
        {!isRange ? (
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            className="absolute w-full h-1 opacity-0 cursor-pointer z-10"
            {...props}
          />
        ) : (
          <>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value[0]}
              onChange={(e) => handleChange(e, 0)}
              className="absolute w-full h-1 opacity-0 cursor-pointer z-10"
            />
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value[1]}
              onChange={(e) => handleChange(e, 1)}
              className="absolute w-full h-1 opacity-0 cursor-pointer z-10"
            />
          </>
        )}

        {/* Thumbs (visual only) */}
        {!isRange ? (
          <div
            className={cn(
              'absolute h-4 w-4 rounded-full border-2 border-primary-500 bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50',
              size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
            )}
            style={{ left: `calc(${calculatePercentage(value as number)}% - ${size === 'sm' ? '6px' : '8px'})` }}
          />
        ) : (
          <>
            <div
              className={cn(
                'absolute h-4 w-4 rounded-full border-2 border-primary-500 bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50',
                size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
              )}
              style={{ left: `calc(${calculatePercentage(value[0])}% - ${size === 'sm' ? '6px' : '8px'})` }}
            />
            <div
              className={cn(
                'absolute h-4 w-4 rounded-full border-2 border-primary-500 bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50',
                size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
              )}
              style={{ left: `calc(${calculatePercentage(value[1])}% - ${size === 'sm' ? '6px' : '8px'})` }}
            />
          </>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export { Slider };
