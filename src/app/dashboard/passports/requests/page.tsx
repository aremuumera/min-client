'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button, DataTable, PageHeader, PaginationBar, StatusBadge } from '@/components/ui';
import { NewRequestSheet, RequestDetailSheet, requestLabel, requestTone } from '@/components/passports/template-requests';
import { toApiError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';
import { templateRequestsHelp } from '@/lib/help/passports';
import type { TemplateRequest } from '@/lib/passports';
import { RequireAccess } from '@/lib/permissions';
import { useGetTemplateRequestsQuery } from '@/redux/features/passports/passports_api';

/* Template requests (step 2.9a): what the company asked MINMEG for, and the answers */
function RequestsPage() {
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const list = useGetTemplateRequestsQuery({ page, limit });
  const [creating, setCreating] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);
  return (
    <div>
      <PageHeader
        title="Template requests"
        help={templateRequestsHelp}
        description="Ask MINMEG for the passport template your buyers need, and follow the answer."
        actions={<Button onClick={() => setCreating(true)} startIcon={<Plus className="h-4 w-4" aria-hidden />}>New request</Button>}
      />
      <DataTable<TemplateRequest>
        caption="Template requests"
        rows={list.isError ? undefined : list.data?.data}
        loading={list.isLoading || list.isUninitialized}
        error={list.isError ? toApiError(list.error).message : undefined}
        onRetry={list.refetch}
        empty={{ title: 'No requests yet', description: 'Ask MINMEG for a template when a buyer needs a passport you cannot issue yet.' }}
        getRowId={(r) => r.id}
        onRowClick={(r) => setSelected(r.id)}
        columns={[
          { key: 'name', header: 'Request', mobile: 'title', cell: (r) => (<div><p className="font-medium text-ink">{r.name}</p><p className="text-sm text-steel">{r.requestCode}</p></div>) },
          { key: 'at', header: 'Sent', mobile: 'subtitle', cell: (r) => (r.createdAt ? formatDateTime(r.createdAt) : '—') },
          { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={requestTone(r.status)}>{requestLabel(r.status)}</StatusBadge> },
        ]}
      />
      <PaginationBar meta={list.data?.meta} page={page} onPage={setPage} limit={limit} onLimit={(n) => { setLimit(n); setPage(1); }} />
      <NewRequestSheet open={creating} onClose={() => setCreating(false)} />
      <RequestDetailSheet id={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export default function Page() {
  return (
    <RequireAccess role={['buyer', 'supplier', 'buyer_supplier']} teamKey="passports">
      <RequestsPage />
    </RequireAccess>
  );
}
