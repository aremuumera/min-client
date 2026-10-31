'use client';

import * as React from 'react';
import { CopyableId, DataTable, PaginationBar, StatusBadge } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';
import { label, type AccessLogEntry } from '@/lib/vault';
import { useGetAccessLogQuery } from '@/redux/features/vault/vaultApi';

const REASONS: Record<string, string> = {
  NOT_OWNER: 'Not their file',
  POLICY_NOT_GRANTED: 'Not allowed by its visibility',
  LINK_REVOKED: 'The link was revoked',
  LINK_EXPIRED: 'The link had expired',
  LOGIN_REQUIRED: 'Had to sign in first',
  FILE_DELETED: 'The file was deleted',
};

/** GET /storage/files/:id/access-log: every preview, download and share-link open, allowed or refused */
export function AccessLogPanel({ fileId, ownerOrganizationId }: { fileId: string; ownerOrganizationId: string }) {
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const log = useGetAccessLogQuery({ id: fileId, page, limit });
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-steel">Who opened this file and when, including anyone who was refused.</p>
      <DataTable<AccessLogEntry>
        caption="Access log"
        rows={log.isError ? undefined : log.data?.data}
        loading={log.isLoading}
        error={log.isError ? toApiError(log.error).message : undefined}
        onRetry={log.refetch}
        empty={{ title: 'Nobody has opened it yet' }}
        getRowId={(r) => r.id}
        columns={[
          { key: 'when', header: 'When', mobile: 'title', cell: (r) => formatDateTime(r.occurredAt) },
          { key: 'what', header: 'What', mobile: 'subtitle', cell: (r) => `${label(r.accessType)}${r.shareLinkId ? ' (share link)' : ''}` },
          {
            key: 'result',
            header: 'Result',
            cell: (r) => (
              <span className="flex flex-col gap-1">
                <StatusBadge tone={r.decision === 'ALLOWED' ? 'success' : 'error'}>{r.decision === 'ALLOWED' ? 'Allowed' : 'Refused'}</StatusBadge>
                {r.denialReason && <span className="text-xs text-steel">{REASONS[r.denialReason] ?? label(r.denialReason)}</span>}
              </span>
            ),
          },
          {
            key: 'who',
            header: 'Who',
            cell: (r) => (!r.actorUserId ? 'Someone with the link' : r.actorOrganizationId === ownerOrganizationId ? 'Your company' : r.actorOrganizationId ? <CopyableId value={r.actorOrganizationId} label="Company" /> : 'MINMEG staff'),
          },
        ]}
      />
      <PaginationBar meta={log.data?.meta} page={page} onPage={setPage} limit={limit} limitOptions={[10, 20, 50]} onLimit={(n) => {
          setLimit(n);
          setPage(1);
        }}
      />
    </div>
  );
}
