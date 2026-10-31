'use client';

import * as React from 'react';
import { Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Button, CopyableId, DataTable, PageHeader, PaginationBar } from '@/components/ui';
import { DocumentsTabs } from '@/components/documents/documents-tabs';
import { paths } from '@/config/paths';
import { toApiError } from '@/lib/api/errors';
import { formatDate } from '@/lib/format';
import { sharedWithMeHelp } from '@/lib/help/documents';
import { RequireAccess } from '@/lib/permissions';
import { label, type Grant } from '@/lib/vault';
import { useContentLinkMutation, useGetFileQuery, useGetGrantsQuery } from '@/redux/features/vault/vaultApi';

/*
 * Shared with me (step 2.3 B3): GET /resource-acl/grants?received=true. Vault files open here; other
 * kinds of record open from their own pages as those steps are built.
 */
const RECORD_NAMES: Record<string, string> = {
  FILE_ASSET: 'Document',
  BATCH: 'Batch',
  LISTING: 'Listing',
  PASSPORT: 'Passport',
  CERTIFICATE: 'Certificate',
  LOCATION: 'Location',
  ORGANIZATION: 'Company',
  TRADE: 'Trade',
};

/** A shared file's name; other companies see a safe subset of its details */
function SharedRecordName({ grant }: { grant: Grant }) {
  const file = useGetFileQuery(grant.resourceId, { skip: grant.resourceType !== 'FILE_ASSET' });
  if (grant.resourceType !== 'FILE_ASSET') return <CopyableId value={grant.resourceId} />;
  if (file.isLoading) return <span className="text-steel">Loading…</span>;
  if (file.isError) return <span className="text-steel">No longer available</span>;
  return <span className="font-medium text-ink">{file.data?.data.displayName}</span>;
}

function SharedPage() {
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const grants = useGetGrantsQuery({ received: true, status: 'ACTIVE', page, limit });
  const [contentLink, linkState] = useContentLinkMutation();

  const open = async (g: Grant, kind: 'preview' | 'download') => {
    try {
      const res = await contentLink({ id: g.resourceId, kind }).unwrap();
      window.open(res.data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  return (
    <div>
      <PageHeader title="Shared with me" help={sharedWithMeHelp} description="Documents and records other companies have given you access to." />
      <DocumentsTabs current={paths.dashboard.documents.shared} />

      <DataTable<Grant>
        caption="Shared with me"
        rows={grants.isError ? undefined : grants.data?.data}
        loading={grants.isLoading}
        error={grants.isError ? toApiError(grants.error).message : undefined}
        onRetry={grants.refetch}
        empty={{ title: 'Nothing shared with you yet', description: 'When another company gives you access to a document, it shows here.' }}
        getRowId={(g) => g.id}
        columns={[
          { key: 'what', header: 'What', mobile: 'title', className: 'min-w-[200px]', cell: (g) => <SharedRecordName grant={g} /> },
          { key: 'kind', header: 'Kind', mobile: 'subtitle', cell: (g) => RECORD_NAMES[g.resourceType] ?? label(g.resourceType) },
          { key: 'from', header: 'From company', cell: (g) => <CopyableId value={g.granterOrganizationId} /> },
          { key: 'can', header: 'You can', cell: (g) => g.permissions.map((p) => label(p)).join(', ') },
          { key: 'until', header: 'Until', cell: (g) => (g.expiresAt ? formatDate(g.expiresAt) : 'Until they remove it') },
          {
            key: 'open',
            header: <span className="sr-only">Open</span>,
            cell: (g) =>
              g.resourceType === 'FILE_ASSET' ? (
                <span className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outlined" onClick={() => open(g, 'preview')} loading={linkState.isLoading} startIcon={<Eye className="h-4 w-4" aria-hidden />}>
                    Preview
                  </Button>
                  {g.permissions.includes('DOWNLOAD') && (
                    <Button size="sm" variant="outlined" color="secondary" onClick={() => open(g, 'download')} loading={linkState.isLoading} startIcon={<Download className="h-4 w-4" aria-hidden />}>
                      Download
                    </Button>
                  )}
                </span>
              ) : (
                <span className="text-xs text-steel">Opens from its own page</span>
              ),
          },
        ]}
      />
      <PaginationBar
        meta={grants.data?.meta}
        page={page}
        onPage={setPage}
        limit={limit}
        onLimit={(n) => {
          setLimit(n);
          setPage(1);
        }}
      />
    </div>
  );
}

export default function Page() {
  return (
    <RequireAccess teamKey="documents">
      <SharedPage />
    </RequireAccess>
  );
}
