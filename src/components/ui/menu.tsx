'use client';

import * as React from 'react';
import { cn } from '@/utils/helper';
import { Popover, type PopoverProps } from './popover';

/* ============================================
   MENU ROOT
   ============================================ */

export interface MenuProps extends Omit<PopoverProps, 'children'> {
  /** Menu items or sub-components */
  children: React.ReactNode;
}

function Menu({ trigger, children, ...props }: MenuProps) {
  return (
    <Popover trigger={trigger} {...props}>
      <div className="py-1 min-w-[200px]" role="menu">
        {children}
      </div>
    </Popover>
  );
}

/* ============================================
   MENU ITEM
   ============================================ */

export interface MenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The value of the item */
  value?: any;
  /** Whether the item is selected */
  selected?: boolean;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** As child - render as a different element */
  as?: React.ElementType;
  /** Allow any other props for custom components */
  [key: string]: any;
}

const MenuItem = React.forwardRef<HTMLButtonElement, MenuItemProps>(
  ({ className, selected = false, disabled = false, children, as: Component = 'button', value, ...props }, ref) => {
    const isOption = Component === 'option';

    return (
      <Component
        ref={ref}
        type={!isOption && Component === 'button' ? 'button' : undefined}
        role={!isOption ? 'menuitem' : undefined}
        disabled={disabled}
        value={isOption ? value : undefined}
        data-selected={selected}
        className={cn(
          !isOption && 'flex w-full items-center px-4 py-2 text-sm transition-colors',
          !isOption && (selected ? 'bg-primary-50 text-primary-500 font-medium' : 'text-neutral-700 hover:bg-neutral-50'),
          !isOption && 'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
          !isOption && 'focus-visible:outline-none focus:bg-neutral-50',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

MenuItem.displayName = 'MenuItem';

export { Menu, MenuItem };
