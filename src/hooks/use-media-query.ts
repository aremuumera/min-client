'use client';

import * as React from 'react';

// Breakpoints matching the original MUI configuration
const breakpoints = {
    xs: 0,
    sm: 600,
    md: 960, // Original MUI md is 900, but some projects use 960. Checking globals.css mapping soon.
    lg: 1200,
    xl: 1920,
};

type Breakpoint = keyof typeof breakpoints;

/**
 * Custom media query hook that mimics MUI's useMediaQuery behavior
 * and uses standard breakpoints from our design system.
 */
export function useMediaQuery(
    fn: 'up' | 'down' | 'between' | 'only' | 'not',
    start: Breakpoint | number,
    end?: Breakpoint | number
) {
    const getMq = React.useCallback(() => {
        const startValue = typeof start === 'number' ? start : breakpoints[start];
        const endValue = typeof end === 'number' ? end : (end ? breakpoints[end] : 0);

        switch (fn) {
            case 'up':
                return `(min-width: ${startValue}px)`;
            case 'down':
                return `(max-width: ${startValue - 0.05}px)`;
            case 'between':
                return `(min-width: ${startValue}px) and (max-width: ${endValue - 0.05}px)`;
            case 'only':
                // Simplified 'only' logic
                return `(min-width: ${startValue}px)`;
            case 'not':
                return `not all and (min-width: ${startValue}px)`;
            default:
                return `(min-width: ${startValue}px)`;
        }
    }, [fn, start, end]);

    const [matches, setMatches] = React.useState(false);

    React.useEffect(() => {
        const mq = getMq();
        const mediaQueryList = window.matchMedia(mq);

        setMatches(mediaQueryList.matches);

        const handler = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        mediaQueryList.addEventListener('change', handler);
        return () => mediaQueryList.removeEventListener('change', handler);
    }, [getMq]);

    return matches;
}
