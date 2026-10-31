'use client';

import * as React from 'react';
import { ConfirmDialog, type ConfirmDialogProps } from './confirm-dialog';

export type ConfirmOptions = Pick<ConfirmDialogProps, 'title' | 'description' | 'confirmLabel' | 'cancelLabel' | 'tone'>;

/**
 * A confirm step before an action is carried out, in our own modal (never the browser's
 * window.confirm). Render `dialog` once; `confirm()` resolves true when the person confirms.
 *
 *   const { confirm, dialog } = useConfirm();
 *   if (!(await confirm({ title: 'Create category?', confirmLabel: 'Create' }))) return;
 */
export function useConfirm() {
  const [pending, setPending] = React.useState<{ options: ConfirmOptions; resolve: (ok: boolean) => void } | null>(null);

  const confirm = React.useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ options, resolve })), []);

  const settle = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  const dialog = (
    <ConfirmDialog
      open={!!pending}
      title={pending?.options.title ?? ''}
      description={pending?.options.description}
      confirmLabel={pending?.options.confirmLabel}
      cancelLabel={pending?.options.cancelLabel}
      tone={pending?.options.tone}
      onConfirm={() => settle(true)}
      onClose={() => settle(false)}
    />
  );

  return { confirm, dialog };
}
