import * as React from 'react';
import { cn } from '@/utils/helper';
import { PageHelp, type PageHelpContent } from './page-help';

/*
 * PageHeader — title, optional breadcrumbs / description / status, and the page's actions.
 * Stacks on phones (actions under the title, full width); one row from tablet up. `help` adds the
 * (i) button that explains the page.
 */
export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  /** e.g. a StatusBadge next to the title */
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  /** Adds the (i) "About this page" button next to the title */
  help?: PageHelpContent;
  className?: string;
}

export function PageHeader({ title, description, breadcrumbs, meta, actions, help, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between', className)}>
      <div className="min-w-0">
        {breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[22px] font-medium leading-tight text-ink break-words md:text-[28px]">{title}</h1>
          {help && <PageHelp content={help} />}
          {meta}
        </div>
        {description && <p className="mt-1 text-sm text-steel">{description}</p>}
      </div>
      {actions && <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:shrink-0 md:justify-end [&>*]:w-full sm:[&>*]:w-auto">{actions}</div>}
    </div>
  );
}
