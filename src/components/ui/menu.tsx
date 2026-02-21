'use client';

import * as React from 'react';
import { cn } from '@/utils/helper';
import { Popover, type PopoverProps } from './popover';
import { PortalPopover, type PortalPopoverProps } from './portal-popover';

/* ============================================
   MENU CONTEXT
   ============================================ */

interface MenuContextValue {
  onItemClick: () => void;
}

const MenuContext = React.createContext<MenuContextValue | undefined>(undefined);

function useMenuContext() {
  return React.useContext(MenuContext);
}

/* ============================================
   MENU ROOT
   ============================================ */

export interface MenuProps extends Omit<PopoverProps, 'children'> {
  /** Menu items or sub-components */
  children: React.ReactNode;
  /** Whether to use a portal for the dropdown */
  usePortal?: boolean;
}

function Menu({ trigger, children, usePortal = false, open: controlledOpen, onOpenChange, ...props }: MenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = onOpenChange !== undefined ? onOpenChange : setUncontrolledOpen;

  const handleItemClick = () => {
    setOpen(false);
  };

  const PopoverComponent = usePortal ? (PortalPopover as any) : Popover;

  return (
    <MenuContext.Provider value={{ onItemClick: handleItemClick }}>
      <PopoverComponent
        trigger={trigger}
        open={open}
        onOpenChange={setOpen}
        {...props}
      >
        <div className="py-1 min-w-[200px]" role="menu">
          {children}
        </div>
      </PopoverComponent>
    </MenuContext.Provider>
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
  ({ className, onClick, selected = false, disabled = false, children, as: Component = 'button', value, ...props }, ref) => {
    const isOption = Component === 'option';
    const menuContext = useMenuContext();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) onClick(e);
      if (menuContext) menuContext.onItemClick();
    };

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
        onClick={handleClick}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

MenuItem.displayName = 'MenuItem';

export { Menu, MenuItem };
