'use client';

import * as React from 'react';
import { cn } from '@/utils/helper';

/* ============================================
   TABS CONTEXT
   ============================================ */

interface TabsContextValue {
  value: string;
  onChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within Tabs');
  }
  return context;
}

/* ============================================
   TABS ROOT
   ============================================ */

export interface TabsProps {
  /** Current value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Children */
  children: React.ReactNode;
  /** Class name */
  className?: string;
}

function Tabs({ value, onChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

/* ============================================
   TAB LIST
   ============================================ */

export interface TabListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variant */
  variant?: 'standard' | 'contained';
}

function TabList({ className, variant = 'standard', ...props }: TabListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center gap-1',
        variant === 'standard' && 'border-b border-neutral-200',
        variant === 'contained' && 'bg-neutral-100 rounded-lg p-1',
        className
      )}
      {...props}
    />
  );
}

/* ============================================
   TAB
   ============================================ */

export interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Value of the tab */
  value: string;
  /** Icon */
  icon?: React.ReactNode;
  /** Label */
  label?: React.ReactNode;
}

function Tab({ className, value, icon, label, children, ...props }: TabProps) {
  const { value: selectedValue, onChange } = useTabsContext();
  const isSelected = value === selectedValue;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isSelected}
      onClick={() => onChange(value)}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2',
        'text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        isSelected
          ? 'text-primary-500 border-b-2 border-primary-500 -mb-px'
          : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50',
        className
      )}
      {...props}
    >
      {icon}
      {label || children}
    </button>
  );
}

/* ============================================
   TAB PANEL
   ============================================ */

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Value corresponding to this panel */
  value: string;
}

function TabPanel({ className, value, children, ...props }: TabPanelProps) {
  const { value: selectedValue } = useTabsContext();
  const isSelected = value === selectedValue;

  if (!isSelected) return null;

  return (
    <div
      role="tabpanel"
      className={cn('py-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabList, Tab, TabPanel };
