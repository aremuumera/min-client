'use client';

import * as React from 'react';
import { Button } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import type { Evidence } from '@/lib/records';
import { useContentLinkMutation } from '@/redux/features/vault/vaultApi';

/*
 * Evidence files on a reading or an event (decision #107). Each Open asks MINMEG for a fresh link
 * that works for 10 minutes; every opening is logged on the file. Another company's file opens only
 * after MINMEG released the record to you.
 */
export function EvidenceList({ evidence }: { evidence?: Evidence[] }) {
  const [open, { isLoading }] = useContentLinkMutation();
  const [error, setError] = React.useState<string | null>(null);
  if (!evidence?.length) return null;
  const show = async (fileId: string) => {
    setError(null);
    try {
      const link = await open({ id: fileId, kind: 'preview' }).unwrap();
      window.open(link.data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      const e = toApiError(err);
      setError(e.status === 404 ? 'MINMEG has not released this file to you.' : e.message);
    }
  };
  return (
    <div className="space-y-1">
      <ul className="flex flex-wrap gap-2" aria-label="Evidence">
        {evidence.map((e) => (
          <li key={e.id}>
            <Button size="sm" variant="outlined" disabled={isLoading} onClick={() => show(e.fileAssetId)}>Open {e.title ?? 'evidence'}</Button>
          </li>
        ))}
      </ul>
      {error && <p className="text-sm text-semantic-error-text">{error}</p>}
    </div>
  );
}
