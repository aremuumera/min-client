'use client';

import * as React from 'react';
import { cn } from '@/utils/helper';

export interface TooltipProps {
  /** Content of the tooltip */
  content?: React.ReactNode;
  /** Alias for content */
  title?: React.ReactNode;
  /** The element that triggers the tooltip */
  children: React.ReactElement;
  /** Position of the tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay before showing (ms) */
  delay?: number;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
}

const positionClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowClasses = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-neutral-800 border-x-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-neutral-800 border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-neutral-800 border-y-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-neutral-800 border-y-transparent border-l-transparent',
};

function Tooltip({
  content,
  title,
  children,
  position = 'top',
  delay = 200,
  disabled = false,
}: TooltipProps) {
  const displayContent = content || title;
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      {isVisible && displayContent && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 px-2 py-1 text-xs text-white bg-neutral-800 rounded',
            'whitespace-nowrap animate-in fade-in-0 zoom-in-95',
            positionClasses[position]
          )}
        >
          {displayContent}
          <div
            className={cn(
              'absolute border-4',
              arrowClasses[position]
            )}
          />
        </div>
      )}
    </div>
  );
}

export { Tooltip };
