'use client';

import * as React from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from './modal';
import { Button } from './button';
import { Textarea } from './textarea';
import { cn } from '@/utils/helper';

/*
 * ConfirmDialog — every destructive or irreversible action (cancel, retire, revoke, quarantine,
 * suspend…; frontend-design-rules.md §6). When the backend needs a reason, `reason` asks for it
 * (minimum length checked here, the backend checks again).
 */
export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** error = red confirm button (destructive) */
  tone?: 'primary' | 'error';
  /** Ask for a reason (passed to onConfirm) */
  reason?: { label: string; placeholder?: string; minLength?: number };
  loading?: boolean;
  onConfirm: (reason?: string) => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'primary', reason, loading, onConfirm, onClose }: ConfirmDialogProps) {
  const [text, setText] = React.useState('');
  React.useEffect(() => {
    if (open) setText('');
  }, [open]);
  const min = reason?.minLength ?? 3;
  const reasonOk = !reason || text.trim().length >= min;

  return (
    <Modal open={open} onClose={loading ? () => undefined : onClose} size="sm" mobileFullScreen={false} closeOnBackdropClick={!loading}>
      <ModalHeader>{title}</ModalHeader>
      <ModalBody>
        {description && <div className="text-sm text-slate">{description}</div>}
        {reason && (
          <div className={cn(description && 'mt-4')}>
            <label className="mb-1 block text-sm font-medium text-ink" htmlFor="confirm-reason">
              {reason.label}
            </label>
            <Textarea id="confirm-reason" value={text} onChange={(e) => setText(e.target.value)} placeholder={reason.placeholder} rows={3} />
            {!reasonOk && text.length > 0 && <p className="mt-1 text-xs text-semantic-error-text">At least {min} characters</p>}
          </div>
        )}
      </ModalBody>
      <ModalFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outlined" color="secondary" onClick={onClose} disabled={loading} fullWidth className="sm:w-auto">
          {cancelLabel}
        </Button>
        <Button color={tone} onClick={() => onConfirm(reason ? text.trim() : undefined)} disabled={!reasonOk} loading={loading} fullWidth className="sm:w-auto">
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
