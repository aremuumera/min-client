import * as React from 'react';
import { cn } from '@/utils/helper';

/*
 * StatusBadge (design.md: badge-success / neutral / warning / error / dark).
 * One place maps every backend status to a tone, so the same status looks the same on every screen.
 */
export type BadgeTone = 'success' | 'neutral' | 'warning' | 'error' | 'dark';

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: 'bg-brand-green-soft text-brand-green-dark',
  neutral: 'bg-surface-soft text-slate',
  warning: 'bg-semantic-warning-bg text-semantic-warning-text',
  error: 'bg-semantic-error-bg text-semantic-error-text',
  dark: 'bg-brand-dark text-on-dark',
};

const SUCCESS = ['ACTIVE', 'ACCEPTED', 'APPROVED', 'CONFIRMED', 'VERIFIED', 'PUBLISHED', 'COMPLETED', 'DELIVERED', 'FULFILLED', 'POSTED', 'PASSED', 'COMPLIANT', 'ISSUED', 'SENT', 'ANCHORED', 'RESOLVED', 'VALID', 'OK'];
const WARNING = ['PENDING', 'PENDING_APPROVAL', 'PENDING_VERIFICATION', 'QUEUED', 'SUBMITTED', 'PROCESSING', 'IN_REVIEW', 'UNDER_REVIEW', 'RESERVED', 'IN_TRANSIT', 'DEPARTED', 'PARTIALLY_ACCEPTED', 'PARTIALLY_DELIVERED', 'PARTIALLY_FULFILLED', 'CONDITIONAL', 'EXPIRING', 'ON_HOLD', 'MAINTENANCE', 'OFFLINE', 'DEGRADED', 'ACKNOWLEDGED', 'INVESTIGATING'];
const ERROR = ['REJECTED', 'FAILED', 'QUARANTINED', 'REVOKED', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'DISQUALIFIED', 'COMPROMISED', 'LOST', 'INVALIDATED', 'NON_COMPLIANT', 'DELIVERY_REJECTED', 'REORGED', 'BOUNCED', 'ERROR', 'TAMPERED', 'DOWN', 'CRITICAL'];

/** The tone for a backend status (anything unknown is neutral) */
export function statusTone(status: string | null | undefined): BadgeTone {
  const s = String(status ?? '').toUpperCase();
  if (SUCCESS.includes(s)) return 'success';
  if (ERROR.includes(s)) return 'error';
  if (WARNING.includes(s)) return 'warning';
  return 'neutral';
}

/** "PENDING_APPROVAL" → "Pending approval" */
export function statusLabel(status: string | null | undefined): string {
  const s = String(status ?? '').replace(/_/g, ' ').trim().toLowerCase();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';
}

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** A backend status (tone and label are derived from it) */
  status?: string | null;
  /** Or set the tone yourself */
  tone?: BadgeTone;
  children?: React.ReactNode;
}

export function StatusBadge({ status, tone, children, className, ...props }: StatusBadgeProps) {
  const t = tone ?? statusTone(status);
  return (
    <span
      className={cn('inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[13px] font-semibold leading-tight', TONE_CLASSES[t], className)}
      data-tone={t}
      {...props}
    >
      <span className="truncate">{children ?? statusLabel(status)}</span>
    </span>
  );
}
