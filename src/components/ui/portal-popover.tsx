'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/utils/helper';
import { Portal } from './portal';

export interface PortalPopoverProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onDragOver' | 'onDragEnter' | 'onDragLeave' | 'onPointerEnter' | 'onPointerLeave' | 'onPointerDown' | 'onPointerUp' | 'onPointerMove' | 'onPointerOut' | 'onPointerCancel' | 'onTransitionEnd'> {
    /** Trigger element */
    trigger: React.ReactNode;
    /** Children content */
    children: React.ReactNode;
    /** Whether the popover is open */
    open?: boolean;
    /** Callback when open state changes */
    onOpenChange?: (open: boolean) => void;
    /** Position relative to trigger */
    position?: 'top' | 'bottom' | 'left' | 'right';
    /** Alignment relative to trigger */
    align?: 'start' | 'center' | 'end';
}

export function PortalPopover({
    trigger,
    children,
    open: controlledOpen,
    onOpenChange,
    position = 'bottom',
    align = 'start',
    className,
    ...props
}: PortalPopoverProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
    const triggerRef = React.useRef<HTMLDivElement>(null);
    const popoverRef = React.useRef<HTMLDivElement>(null);

    const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
    const setOpen = onOpenChange !== undefined ? onOpenChange : setUncontrolledOpen;

    const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0, height: 0 });

    const updateCoords = React.useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
                height: rect.height,
            });
        }
    }, []);

    React.useEffect(() => {
        if (open) {
            updateCoords();
            window.addEventListener('resize', updateCoords);
            window.addEventListener('scroll', updateCoords, true);
        }
        return () => {
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords, true);
        };
    }, [open, updateCoords]);

    const toggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen(!open);
    };

    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                triggerRef.current?.contains(target) ||
                popoverRef.current?.contains(target)
            ) {
                return;
            }
            setOpen(false);
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, setOpen]);

    const getPopPos = () => {
        const space = 4;
        const padding = 12; // Viewport padding
        let top = 0;
        let left = 0;
        let transform = '';

        if (position === 'bottom') {
            top = coords.top + coords.height + space;
            if (align === 'start') left = coords.left;
            if (align === 'center') {
                left = coords.left + coords.width / 2;
                transform = 'translateX(-50%)';
            }
            if (align === 'end') {
                left = coords.left + coords.width;
                transform = 'translateX(-100%)';
            }
        } else if (position === 'top') {
            top = coords.top - space;
            transform = 'translateY(-100%)';
            if (align === 'start') left = coords.left;
            if (align === 'center') {
                left = coords.left + coords.width / 2;
                transform += ' translateX(-50%)';
            }
            if (align === 'end') {
                left = coords.left + coords.width;
                transform += ' translateX(-100%)';
            }
        }

        // Viewport Containment Logic
        const popoverWidth = popoverRef.current?.offsetWidth || 200;
        const screenWidth = window.innerWidth;

        let finalLeft = left;
        if (align === 'end') {
            if (left - popoverWidth < padding) {
                finalLeft = padding + popoverWidth;
            }
        } else if (align === 'start') {
            if (left + popoverWidth > screenWidth - padding) {
                finalLeft = screenWidth - padding - popoverWidth;
            }
        } else if (align === 'center') {
            if (left - popoverWidth / 2 < padding) {
                finalLeft = padding + popoverWidth / 2;
            } else if (left + popoverWidth / 2 > screenWidth - padding) {
                finalLeft = screenWidth - padding - popoverWidth / 2;
            }
        }

        return {
            top: `${top}px`,
            left: `${finalLeft}px`,
            transform,
            position: 'absolute' as const,
            zIndex: 10000
        };
    };

    return (
        <div className="inline-block" ref={triggerRef}>
            <div onClick={toggle} className="cursor-pointer">
                {trigger}
            </div>

            <AnimatePresence>
                {open && (
                    <Portal>
                        <motion.div
                            ref={popoverRef}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                            style={getPopPos()}
                            className={cn(
                                'min-w-[150px] overflow-hidden rounded-lg border border-neutral-200 bg-white p-1 shadow-lg',
                                align === 'end' && '-translate-x-full',
                                className
                            )}
                            {...props}
                        >
                            {children}
                        </motion.div>
                    </Portal>
                )}
            </AnimatePresence>
        </div>
    );
}
