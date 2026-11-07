'use client';

import * as React from 'react';
import { Button, DataTable, DropdownSelect, FilterBar, FormField, Modal, PageHeader, PaginationBar, StatusBadge, Tab, TabList, Tabs, Textarea, useConfirm } from '@/components/ui';
import { toast } from '@/components/core/toaster';
import { toApiError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';
import { handoversHelp } from '@/lib/help/traceability';
import { RequireAccess } from '@/lib/permissions';
import { CUSTODY_STATUS_LABELS, type CustodyRow } from '@/lib/traceability';
import { useCustodyActionMutation, useGetTransfersQuery } from '@/redux/features/traceability/traceability_api';

type Reasoned = { row: CustodyRow; action: 'reject' | 'cancel' | 'dispute' } | null;
const REASON_TEXT = {
  reject: { title: 'Refuse this handover?', body: 'The goods stay with the sender. Say why, so the sender and MINMEG know what to fix.', button: 'Refuse' },
  cancel: { title: 'Cancel this handover?', body: 'The goods stay with you.', button: 'Cancel handover' },
  dispute: { title: 'Dispute this record?', body: 'MINMEG is alerted and decides. Until then, nobody can hand these goods on.', button: 'Dispute' },
} as const;

function ReasonModal({ value, onClose }: { value: NonNullable<Reasoned>; onClose: () => void }) {
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [act, { isLoading }] = useCustodyActionMutation();
  const text = REASON_TEXT[value.action];
  const submit = async () => {
    setError(null);
    try {
      await act({ id: value.row.id, action: value.action, body: { reason: reason.trim() } }).unwrap();
      onClose();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };
  return (
    <Modal open onClose={onClose} size="sm">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{text.title}</h3>
          <p className="mt-1 text-sm text-gray-500">{text.body}</p>
        </div>
        <FormField htmlFor="handover-reason" label="Reason" required>
          <Textarea id="handover-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={1000} />
        </FormField>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Back</Button>
          <Button disabled={reason.trim().length < 3 || isLoading} onClick={submit}>{text.button}</Button>
        </div>
      </div>
    </Modal>
  );
}

function HandoversPage() {
  const [direction, setDirection] = React.useState<'incoming' | 'outgoing'>('incoming');
  const [status, setStatus] = React.useState('PENDING');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [reasoned, setReasoned] = React.useState<Reasoned>(null);
  React.useEffect(() => setPage(1), [direction, status]);
  const list = useGetTransfersQuery({ direction, status: status || undefined, page, limit }, { refetchOnMountOrArgChange: true });
  const [act] = useCustodyActionMutation();
  const { confirm, dialog } = useConfirm();

  const accept = async (row: CustodyRow) => {
    if (!(await confirm({ title: 'Accept this handover?', description: `Your company now holds ${row.subjectLabel ?? 'the goods'}. Only accept once you have checked them.`, confirmLabel: 'Accept' }))) return;
    try {
      await act({ id: row.id, action: 'accept' }).unwrap();
      toast.success('Handover accepted');
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  return (
    <div>
      <PageHeader title="Handovers" help={handoversHelp} description="Goods handed to your company, and goods you handed on." />
      <Tabs value={direction} onChange={(v) => setDirection(v as 'incoming' | 'outgoing')}>
        <TabList className="mb-4" aria-label="Direction">
          <Tab value="incoming" label="Handed to you" />
          <Tab value="outgoing" label="Handed on by you" />
        </TabList>
      </Tabs>
      <FilterBar activeCount={status === 'PENDING' ? 0 : 1} onClear={() => setStatus('PENDING')}>
        <DropdownSelect aria-label="Status" value={status} onValueChange={setStatus} placeholder="All" options={Object.entries(CUSTODY_STATUS_LABELS).map(([value, label]) => ({ value, label }))} />
      </FilterBar>
      <DataTable<CustodyRow>
        caption="Handovers"
        rows={list.isError ? undefined : list.data?.data}
        loading={list.isLoading}
        error={list.isError ? toApiError(list.error).message : undefined}
        onRetry={list.refetch}
        empty={{ title: status === 'PENDING' ? 'Nothing waiting' : 'No handovers', description: direction === 'incoming' ? 'Goods handed to your company appear here for you to accept.' : 'Handovers you start appear here until the receiver answers.' }}
        getRowId={(r) => r.id}
        columns={[
          { key: 'what', header: 'Goods', mobile: 'title', cell: (r) => <span className="font-medium text-ink">{r.subjectLabel}</span> },
          { key: 'from', header: 'From', cell: (r) => r.fromName ?? '—' },
          { key: 'to', header: 'To', cell: (r) => r.toName ?? '—' },
          { key: 'when', header: 'Sent', mobile: 'subtitle', cell: (r) => formatDateTime(r.createdAt) },
          { key: 'note', header: 'Note', cell: (r) => r.metadata?.note ?? '—' },
          { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status}>{CUSTODY_STATUS_LABELS[r.status] ?? r.status}</StatusBadge> },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            cell: (r) => (
              <div className="flex flex-wrap justify-end gap-2">
                {direction === 'incoming' && r.status === 'PENDING' && <Button size="sm" onClick={() => accept(r)}>Accept</Button>}
                {direction === 'incoming' && r.status === 'PENDING' && <Button size="sm" variant="outlined" onClick={() => setReasoned({ row: r, action: 'reject' })}>Refuse</Button>}
                {direction === 'outgoing' && r.status === 'PENDING' && <Button size="sm" variant="outlined" onClick={() => setReasoned({ row: r, action: 'cancel' })}>Cancel</Button>}
                {r.status === 'ACTIVE' && <Button size="sm" variant="outlined" onClick={() => setReasoned({ row: r, action: 'dispute' })}>Dispute</Button>}
              </div>
            ),
          },
        ]}
      />
      <PaginationBar meta={list.data?.meta} page={page} onPage={setPage} limit={limit} onLimit={(n) => { setLimit(n); setPage(1); }} />
      {reasoned && <ReasonModal value={reasoned} onClose={() => setReasoned(null)} />}
      {dialog}
    </div>
  );
}

export default function Page() {
  return (
    <RequireAccess role={['buyer', 'supplier', 'buyer_supplier']} teamKey="traceability">
      <HandoversPage />
    </RequireAccess>
  );
}
