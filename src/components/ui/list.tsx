import * as React from 'react';
import { cn } from '@/utils/helper';

/* ============================================
   LIST ROOT
   ============================================ */

export interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
  /** Whether to disable padding */
  disablePadding?: boolean;
  /** Dense layout */
  dense?: boolean;
  /** Subheader content */
  subheader?: React.ReactNode;
}

export interface ListItemAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to disable padding */
  // disablePadding?: boolean;
  // /** Alignment of sub-items */
  // alignItems?: 'flex-start' | 'center';
}

const List = React.forwardRef<HTMLUListElement, ListProps>(
  ({ className, disablePadding = false, dense = false, subheader, children, ...props }, ref) => {
    return (
      <ul
        ref={ref}
        className={cn(
          'relative list-none',
          !disablePadding && 'py-2',
          className
        )}
        {...props}
      >
        {subheader && (
          <li className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            {subheader}
          </li>
        )}
        {children}
      </ul>
    );
  }
);

List.displayName = 'List';

/* ============================================
   LIST ITEM
   ============================================ */

export interface ListItemProps extends React.HTMLAttributes<HTMLLIElement> {
  /** Whether to disable padding */
  disablePadding?: boolean;
  /** Alignment of sub-items */
  alignItems?: 'flex-start' | 'center';
}

const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
  ({ className, disablePadding = false, alignItems = 'center', ...props }, ref) => {
    return (
      <li
        ref={ref}
        className={cn(
          'flex w-full',
          alignItems === 'center' ? 'items-center' : 'items-start',
          !disablePadding && 'px-4 py-2',
          className
        )}
        {...props}
      />
    );
  }
);

ListItem.displayName = 'ListItem';

/* ============================================
   LIST ITEM BUTTON
   ============================================ */

export interface ListItemButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the item is selected */
  selected?: boolean;
  /** Whether to disable padding */
  disablePadding?: boolean;
}

const ListItemButton = React.forwardRef<HTMLButtonElement, ListItemButtonProps>(
  ({ className, selected = false, disablePadding = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'flex w-full items-center gap-3 text-left transition-colors',
          !disablePadding && 'px-4 py-2',
          selected ? 'bg-primary-50 text-primary-500 font-medium' : 'text-neutral-700 hover:bg-neutral-50',
          'focus-visible:outline-none focus-visible:bg-neutral-100',
          className
        )}
        {...props}
      />
    );
  }
);

ListItemButton.displayName = 'ListItemButton';

/* ============================================
   LIST ITEM ICON
   ============================================ */

export interface ListItemIconProps extends React.HTMLAttributes<HTMLDivElement> { }

const ListItemIcon = React.forwardRef<HTMLDivElement, ListItemIconProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex-shrink-0 flex items-center justify-center text-neutral-500',
          className
        )}
        {...props}
      />
    );
  }
);

ListItemIcon.displayName = 'ListItemIcon';

/* ============================================
   LIST ITEM TEXT
   ============================================ */

export interface ListItemTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Primary text */
  primary?: React.ReactNode;
  /** Secondary text */
  secondary?: React.ReactNode;
  /** Primary text styling */
  primaryTypographyProps?: React.HTMLAttributes<HTMLSpanElement>;
  /** Secondary text styling */
  secondaryTypographyProps?: React.HTMLAttributes<HTMLSpanElement>;
}

const ListItemText = React.forwardRef<HTMLDivElement, ListItemTextProps>(
  ({ className, primary, secondary, primaryTypographyProps, secondaryTypographyProps, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex-1 min-w-0', className)}
        {...props}
      >
        {primary && (
          <span
            className={cn(
              'block text-sm font-medium text-neutral-900 truncate',
              primaryTypographyProps?.className
            )}
            {...primaryTypographyProps}
          >
            {primary}
          </span>
        )}
        {secondary && (
          <span
            className={cn(
              'block text-xs text-neutral-500 truncate',
              secondaryTypographyProps?.className
            )}
            {...secondaryTypographyProps}
          >
            {secondary}
          </span>
        )}
        {children}
      </div>
    );
  }
);

ListItemText.displayName = 'ListItemText';

/* ============================================
   LIST ITEM AVATAR
   ============================================ */

export const ListItemAvatar = React.forwardRef<HTMLDivElement, ListItemAvatarProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex-shrink-0 flex items-center pr-3', className)}
        {...props}
      />
    );
  }
);

ListItemAvatar.displayName = 'ListItemAvatar';

export {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
};
