'use client';

import * as React from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './button';
import { toApiError } from '@/lib/api/errors';
import { downloadFile } from '@/lib/download-file';
import { useAppSelector } from '@/redux/hooks';

export interface DownloadButtonProps {
  /** The API path of the file, e.g. /batches/export.csv */
  path: string;
  /** Query parameters (the list's filters); empty ones are left out */
  params?: Record<string, string | number | boolean | undefined | null>;
  /** The file name if the server names none */
  fileName: string;
  children: React.ReactNode;
  variant?: 'outlined' | 'text';
  'data-testid'?: string;
}

/**
 * Decision #127: downloads a file the server makes (CSV export, passport package). When the file
 * holds fewer records than match, it says so, so nobody takes a cut-off file for the whole list.
 */
export function DownloadButton({ path, params = {}, fileName, children, variant = 'outlined', ...rest }: DownloadButtonProps) {
  const token = useAppSelector((s) => (s.auth as { token?: string | null }).token ?? null);
  const [busy, setBusy] = React.useState(false);
  return (
    <Button
      size="sm"
      variant={variant}
      color="secondary"
      loading={busy}
      startIcon={<Download className="h-4 w-4" aria-hidden />}
      data-testid={rest['data-testid']}
      onClick={async () => {
        setBusy(true);
        try {
          const { total, rows } = await downloadFile(path, params, fileName, token);
          if (total !== null && rows !== null && total > rows) toast.warning(`The file holds the first ${rows} of ${total}. Narrow the filters to get the rest.`);
        } catch (err) {
          toast.error(toApiError(err).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {children}
    </Button>
  );
}
