import * as React from 'react';
import { AlertTriangle, Inbox, Lock } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/utils/helper';

/*
 * The states every screen must have (frontend-design-rules.md §5): empty, error, no access.
 * Loading uses Skeleton.
 */
interface StateProps {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

function StateFrame({ icon, title, description, action, className, tone }: StateProps & { icon: React.ReactNode; tone: 'neutral' | 'error' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-4 py-12 text-center', className)}>
      <div className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-full', tone === 'error' ? 'bg-semantic-error-bg text-semantic-error-text' : 'bg-surface-feature text-primary-pressed')}>{icon}</div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <div className="mt-1 max-w-md text-sm text-steel">{description}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Nothing here yet — say why, and offer the next action */
export function EmptyState(props: StateProps) {
  return <StateFrame icon={<Inbox className="h-6 w-6" aria-hidden />} tone="neutral" {...props} />;
}

/** The request failed — the backend's message and a retry */
export function ErrorState({ title = 'Something went wrong', description, onRetry, className }: Omit<StateProps, 'title' | 'action'> & { title?: string; onRetry?: () => void }) {
  return (
    <StateFrame
      icon={<AlertTriangle className="h-6 w-6" aria-hidden />}
      tone="error"
      title={title}
      description={description}
      className={className}
      action={onRetry && <Button variant="outlined" color="secondary" onClick={onRetry}>Try again</Button>}
    />
  );
}

/** A 403, or can() said no */
export function NoAccess({ title = "You don't have access to this", description = 'Ask your account owner or a MINMEG administrator if you need it.', action, className }: Partial<StateProps>) {
  return <StateFrame icon={<Lock className="h-6 w-6" aria-hidden />} tone="neutral" title={title} description={description} action={action} className={className} />;
}
