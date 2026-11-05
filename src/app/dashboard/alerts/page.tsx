'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert as Notice, Button, ConfirmDialog, CopyableId, DataTable, DropdownSelect, FilterBar, PageHeader, PaginationBar, SideSheet, StatusBadge } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { ALERT_STATUS_TEXT, OPEN_ALERT, SEVERITY_TEXT, severityTone, words, type AlertSeverity, type OperationalAlert } from '@/lib/alerts';
import { formatDateTime } from '@/lib/format';
import { alertsHelp } from '@/lib/help/notifications';
import { RequireAccess } from '@/lib/permissions';
import { useAcknowledgeAlertMutation, useGetAlertQuery, useGetAlertsQuery } from '@/redux/features/shipments/shipments_api';

/* Alerts (step 2.13b, decision #113 D8): the company's shipment alerts. See and acknowledge; MINMEG resolves. */
const SEVERITIES = (['CRITICAL', 'HIGH', 'WARNING', 'INFO'] as AlertSeverity[]).map((s) => ({ value: s, label: SEVERITY_TEXT[s] }));

function AlertSheet({ alert, onClose }: { alert: OperationalAlert; onClose: () => void }) {
  const [ack, { isLoading }] = useAcknowledgeAlertMutation();
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const a = alert;
  const open = OPEN_ALERT.includes(a.status);
  return (
    <SideSheet open onClose={onClose} title={a.title} subtitle={<span className="flex flex-wrap gap-2"><StatusBadge tone={severityTone(a.severity)}>{SEVERITY_TEXT[a.severity]}</StatusBadge><StatusBadge status={open ? 'PENDING' : 'RESOLVED'}>{ALERT_STATUS_TEXT[a.status]}</StatusBadge></span>}>
      <div className="space-y-4" data-testid={`alert-${a.id}`}>
        {error && <Notice severity="error">{error}</Notice>}
        <p className="text-sm text-gray-700">{a.message}</p>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-gray-500">Kind</dt><dd>{words(a.alertType)}</dd></div>
          <div><dt className="text-xs text-gray-500">First seen</dt><dd>{formatDateTime(a.detectedAt)}{a.occurrenceCount > 1 ? ` · seen ${a.occurrenceCount} times` : ''}</dd></div>
          {a.shipmentId && <div className="sm:col-span-2"><dt className="text-xs text-gray-500">Shipment</dt><dd><CopyableId value={a.shipmentId} /></dd></div>}
          {a.acknowledgedAt && <div><dt className="text-xs text-gray-500">Seen</dt><dd>{formatDateTime(a.acknowledgedAt)}</dd></div>}
          {a.resolvedAt && <div className="sm:col-span-2"><dt className="text-xs text-gray-500">Resolved by MINMEG</dt><dd>{formatDateTime(a.resolvedAt)}{a.resolutionNote ? `: ${a.resolutionNote}` : ''}</dd></div>}
        </dl>
        {a.status === 'OPEN' && <Button onClick={() => setConfirming(true)}>Acknowledge</Button>}
        {open && <p className="text-xs text-gray-500">MINMEG looks into every alert and resolves it. Acknowledging tells MINMEG you have seen it; add a note if you know what happened.</p>}
      </div>
      <ConfirmDialog
        open={confirming}
        title="Acknowledge this alert?"
        description="MINMEG sees that you have read it."
        confirmLabel="Acknowledge"
        reason={{ label: 'Note (optional)', minLength: 0 }}
        loading={isLoading}
        onConfirm={async (note) => {
          setError(null);
          try {
            await ack({ id: a.id, note: note?.trim() || undefined }).unwrap();
            onClose();
          } catch (err) {
            setError(toApiError(err).message);
          }
          setConfirming(false);
        }}
        onClose={() => setConfirming(false)}
      />
    </SideSheet>
  );
}

function AlertsPage() {
  const [show, setShow] = React.useState('open');
  const [severity, setSeverity] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  React.useEffect(() => setPage(1), [show, severity]);
  const list = useGetAlertsQuery({ page, limit, severity, ...(show === 'open' ? { open: true } : {}) });
  const [selected, setSelected] = React.useState<OperationalAlert | null>(null);
  // a notice opens its alert (?alert=<id>)
  const fromNotice = useSearchParams().get('alert');
  const linked = useGetAlertQuery(fromNotice ?? '', { skip: !fromNotice });
  React.useEffect(() => {
    if (linked.data?.data) setSelected(linked.data.data);
  }, [linked.data]);
  return (
    <div>
      <PageHeader title="Alerts" help={alertsHelp} description="Problems MINMEG’s tracking found on your shipments: late, off route, stopped, a broken seal. MINMEG looks into each one." />
      <FilterBar activeCount={(show !== 'open' ? 1 : 0) + (severity ? 1 : 0)} onClear={() => { setShow('open'); setSeverity(''); }}>
        <DropdownSelect aria-label="Show" value={show} onValueChange={setShow} options={[{ value: 'open', label: 'Open alerts' }, { value: 'all', label: 'All alerts' }]} className="md:w-44" />
        <DropdownSelect aria-label="Severity" value={severity} onValueChange={setSeverity} options={SEVERITIES} placeholder="Any severity" className="md:w-44" />
      </FilterBar>
      <DataTable<OperationalAlert>
        caption="Alerts"
        rows={list.isError ? undefined : list.data?.data}
        loading={list.isLoading || list.isUninitialized}
        error={list.isError ? toApiError(list.error).message : undefined}
        onRetry={list.refetch}
        empty={{ title: show === 'open' ? 'No open alerts' : 'No alerts', description: 'Alerts appear when tracking finds a problem on one of your shipments.' }}
        getRowId={(r) => r.id}
        onRowClick={setSelected}
        selectedId={selected?.id}
        columns={[
          { key: 'title', header: 'Alert', mobile: 'title', cell: (r) => (<div><p className="font-medium text-ink">{r.title}</p><p className="text-sm text-steel line-clamp-1">{r.message}</p></div>) },
          { key: 'severity', header: 'Severity', mobile: 'subtitle', cell: (r) => <StatusBadge tone={severityTone(r.severity)}>{SEVERITY_TEXT[r.severity]}</StatusBadge> },
          { key: 'when', header: 'Last seen', cell: (r) => formatDateTime(r.lastOccurrenceAt) },
          { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={OPEN_ALERT.includes(r.status) ? 'PENDING' : 'RESOLVED'}>{ALERT_STATUS_TEXT[r.status]}</StatusBadge> },
        ]}
      />
      <PaginationBar meta={list.data?.meta} page={page} onPage={setPage} limit={limit} onLimit={(n) => { setLimit(n); setPage(1); }} />
      {selected && <AlertSheet alert={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default function Page() {
  return (
    <RequireAccess role={['buyer', 'supplier', 'buyer_supplier']} teamKey="shipments">
      <AlertsPage />
    </RequireAccess>
  );
}
