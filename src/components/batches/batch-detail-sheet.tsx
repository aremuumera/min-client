'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Alert, Button, ConfirmDialog, CopyableId, KeyValueList, PaginationBar, SideSheet, Skeleton, StatusBadge, Tab, TabList, TabPanel, Tabs, Timeline, type TimelineEntry } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';
import { ENDED_STATUSES, OPERABLE_STATUSES, approvalRule, batchLabel, entryStatusLabel, formatQuantity, signedQuantity, toMicro, type Batch, type HistoryItem, type LedgerEntry, type TreeNode } from '@/lib/batches';
import { useGetBatchHistoryQuery, useGetBatchQuery, useGetBatchTreeQuery, useGetLedgerQuery, useGetUnitChoicesQuery, useQuarantineBatchMutation, useReleaseBatchMutation, useRetireBatchMutation } from '@/redux/features/batches/batches_api';
import { BatchFormSheet } from './batch-form-sheet';
import { MergeSheet, SplitSheet, TransformSheet } from './batch-operation-sheets';
import { AdjustSheet, ReconcileSheet } from './quantity-sheets';

export interface BatchPermissions {
  edit: boolean;
  operate: boolean;
  adjust: boolean;
  quarantine: boolean;
  /** Only staff can lift a hold that staff raised */
  releaseStaffHold: boolean;
}

type SubSheet = 'edit' | 'split' | 'merge' | 'transform' | 'adjust' | 'reconcile' | null;

function LedgerPanel({ batch, entryActions }: { batch: Batch; entryActions?: (entry: LedgerEntry, batch: Batch) => React.ReactNode }) {
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const ledger = useGetLedgerQuery({ id: batch.id, page, limit });
  const rows = ledger.data?.data ?? [];
  const unit = batch.unit?.symbol;

  if (ledger.isError) return <Alert severity="error">{toApiError(ledger.error).message}</Alert>;
  if (!rows.length) return <p className="text-sm text-steel">{ledger.isLoading ? 'Loading…' : 'No movements yet.'}</p>;
  return (
    <div>
      <ul aria-label="Quantity ledger" className="flex flex-col divide-y divide-hairline rounded-xl border border-hairline">
        {rows.map((e) => (
          <li key={e.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium text-ink">
                {batchLabel(e.entryType)}: {signedQuantity(e, unit)}
              </p>
              <p className="text-xs text-steel">
                {formatDateTime(e.occurredAt)}
                {e.balanceAfter !== null ? ` · balance ${formatQuantity(e.balanceAfter, unit)}` : ''}
              </p>
              {e.reason && <p className="mt-1 text-xs text-slate">{e.reason}</p>}
              {e.reviewNote && <p className="mt-1 text-xs text-slate">MINMEG: {e.reviewNote}</p>}
            </div>
            <StatusBadge status={e.status === 'POSTED' ? 'ACTIVE' : e.status === 'INVALIDATED' ? 'REJECTED' : e.status}>{entryStatusLabel(e.status)}</StatusBadge>
            {entryActions?.(e, batch)}
          </li>
        ))}
      </ul>
      <PaginationBar
        meta={ledger.data?.meta}
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

function FamilyPanel({ batchId, onOpen }: { batchId: string; onOpen: (id: string) => void }) {
  const tree = useGetBatchTreeQuery(batchId);
  const units = useGetUnitChoicesQuery();
  const symbol = (id?: string) => units.data?.data.find((u) => u.id === id)?.symbol;

  const row = (n: TreeNode, kids: TreeNode[], direction: 'parents' | 'children'): React.ReactNode => (
    <li key={n.id}>
      {n.restricted ? (
        <p className="py-2 text-sm text-steel">
          Restricted: <span className="break-all font-mono text-xs">{n.id}</span>
        </p>
      ) : (
        <button type="button" onClick={() => onOpen(n.id)} className="flex min-h-11 w-full flex-wrap items-center gap-x-2 rounded-lg px-2 py-1 text-left text-sm hover:bg-surface">
          <span className="font-medium text-ink">{n.batchCode}</span>
          <span className="text-steel">
            {batchLabel(n.relationshipType)} · {formatQuantity(n.quantityContributed ?? n.initialQuantity, symbol(n.quantityUnitId))}
          </span>
          <StatusBadge status={n.batchStatus}>{batchLabel(n.batchStatus)}</StatusBadge>
        </button>
      )}
      {kids.length > 0 && <ul className="ml-3 border-l border-hairline pl-3">{kids.map((k) => row(k, (k[direction] ?? []) as TreeNode[], direction))}</ul>}
    </li>
  );

  if (tree.isError) return <Alert severity="error">{toApiError(tree.error).message}</Alert>;
  if (!tree.data) return <p className="text-sm text-steel">Loading…</p>;
  const { upstream, downstream } = tree.data.data;
  if (!upstream.length && !downstream.length) return <p className="text-sm text-steel">This batch has no parents or children. It was registered directly and hasn&apos;t been split, merged or processed.</p>;
  return (
    <div className="flex flex-col gap-5">
      <section>
        <h3 className="mb-1 text-sm font-semibold text-ink">Came from</h3>
        {upstream.length ? <ul>{upstream.map((n) => row(n, n.parents ?? [], 'parents'))}</ul> : <p className="text-sm text-steel">Nothing: this is where its history starts.</p>}
      </section>
      <section>
        <h3 className="mb-1 text-sm font-semibold text-ink">Became</h3>
        {downstream.length ? <ul>{downstream.map((n) => row(n, n.children ?? [], 'children'))}</ul> : <p className="text-sm text-steel">Nothing yet.</p>}
      </section>
    </div>
  );
}

function historyEntry(item: HistoryItem, i: number, unit?: string): TimelineEntry {
  const r = item.record;
  const base = { id: `${item.kind}-${String(r.id ?? i)}`, at: item.at };
  if (item.kind === 'LEDGER') {
    return { ...base, title: `${batchLabel(String(r.entryType))}: ${signedQuantity(r as unknown as LedgerEntry, unit)}`, description: (r.reason as string) ?? undefined, tone: r.status === 'PENDING' ? 'warning' : r.status === 'INVALIDATED' ? 'error' : 'neutral' };
  }
  if (item.kind === 'LINEAGE') return { ...base, title: `${batchLabel(String(r.relationshipType))}: ${r.role === 'PARENT' ? 'became a new batch' : 'came from another batch'}`, tone: 'dark' };
  const type = r.eventType as { name?: string; code?: string } | undefined;
  return { ...base, title: type?.name ?? batchLabel(type?.code), tone: 'success' };
}

function HistoryPanel({ batch }: { batch: Batch }) {
  const history = useGetBatchHistoryQuery(batch.id);
  if (history.isError) return <Alert severity="error">{toApiError(history.error).message}</Alert>;
  if (!history.data) return <p className="text-sm text-steel">Loading…</p>;
  return <Timeline entries={history.data.data.items.map((item, i) => historyEntry(item, i, batch.unit?.symbol))} />;
}

/** One batch: what it is, its quantity movements, its family and its history. What can be done comes from `can`; the backend decides in the end. */
export function BatchDetailSheet({
  batchId,
  can,
  ownerNode,
  entryActions,
  documents,
  staffFormProps,
  onClose,
  onOpenBatch,
}: {
  batchId: string | null;
  can: BatchPermissions;
  ownerNode?: (batch: Batch) => React.ReactNode;
  /** Staff: reverse, approve or reject an entry */
  entryActions?: (entry: LedgerEntry, batch: Batch) => React.ReactNode;
  documents?: (batch: Batch) => React.ReactNode;
  staffFormProps?: (batch: Batch) => { staffFields: React.ReactNode; staffBody: Record<string, unknown> };
  onClose: () => void;
  onOpenBatch: (id: string) => void;
}) {
  const detail = useGetBatchQuery(batchId ?? '', { skip: !batchId });
  const [quarantine, quarantineState] = useQuarantineBatchMutation();
  const [release, releaseState] = useReleaseBatchMutation();
  const [retire, retireState] = useRetireBatchMutation();
  const [tab, setTab] = React.useState('details');
  const [sub, setSub] = React.useState<SubSheet>(null);
  const [dialog, setDialog] = React.useState<'quarantine' | 'release' | 'retire' | null>(null);
  React.useEffect(() => {
    setTab('details');
    setSub(null);
    setDialog(null);
  }, [batchId]);

  if (!batchId) return null;
  const b = detail.data?.data;
  const unit = b?.unit?.symbol;
  const operable = !!b && OPERABLE_STATUSES.includes(b.batchStatus);
  const ended = !!b && ENDED_STATUSES.includes(b.batchStatus);
  const quarantined = b?.batchStatus === 'QUARANTINED';
  const staffHold = !!b?.quarantinedByStaff && !can.releaseStaffHold;
  const empty = !!b && toMicro(b.currentQuantity) === BigInt(0);

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      toast.success(message);
      setDialog(null);
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  const openAfter = (id: string) => {
    setSub(null);
    onOpenBatch(id);
  };

  return (
    <>
      <SideSheet open={!sub} onClose={onClose} size="lg" title={b?.batchCode ?? 'Batch'} subtitle={b ? `${b.material?.name ?? ''} · ${formatQuantity(b.currentQuantity, unit)}` : undefined}>
        {detail.isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : detail.isError || !b ? (
          <Alert severity="error">{toApiError(detail.error).message}</Alert>
        ) : (
          <Tabs value={tab} onChange={setTab}>
            <TabList className="mb-4 overflow-x-auto" aria-label="Batch">
              <Tab value="details" label="Details" />
              <Tab value="ledger" label={`Ledger${b.pendingLedgerEntries ? ` (${b.pendingLedgerEntries} waiting)` : ''}`} />
              <Tab value="family" label="Family" />
              <Tab value="history" label="History" />
              {documents && <Tab value="documents" label="Documents" />}
            </TabList>

            <TabPanel value="details">
              <div className="flex flex-col gap-5">
                {quarantined && <Alert severity="warning">On hold{b.statusReason ? `: ${b.statusReason}` : ''}. It can&apos;t be sold, allocated or changed until released.{staffHold ? ' MINMEG placed this hold, so only MINMEG can lift it.' : ''}</Alert>}
                {ended && <Alert severity="info">This batch has ended ({batchLabel(b.retirementReason ?? b.batchStatus).toLowerCase()}). Its history stays readable.</Alert>}
                {!!b.pendingLedgerEntries && <Alert severity="info">{b.pendingLedgerEntries === 1 ? 'A quantity change is' : `${b.pendingLedgerEntries} quantity changes are`} waiting for MINMEG approval. The quantity hasn&apos;t moved yet.</Alert>}
                {!!b.activeDisqualifications?.length && <Alert severity="error">This batch has an active disqualification, so it can&apos;t be released or used.</Alert>}
                <KeyValueList
                  columns={2}
                  items={[
                    { label: 'Batch ID', value: <CopyableId value={b.id} />, wide: true },
                    ...(ownerNode ? [{ label: 'Company', value: ownerNode(b), wide: true }] : []),
                    { label: 'Status', value: <StatusBadge status={b.batchStatus}>{batchLabel(b.batchStatus)}</StatusBadge> },
                    { label: 'Material', value: b.material?.name },
                    { label: 'Current quantity', value: formatQuantity(b.currentQuantity, unit) },
                    { label: 'Available', value: formatQuantity(b.availableQuantity, unit) },
                    { label: 'Reserved', value: formatQuantity(b.reservedQuantity, unit) },
                    { label: 'First registered', value: formatQuantity(b.initialQuantity, unit) },
                    { label: 'How it was created', value: batchLabel(b.batchType) },
                    { label: 'Source', value: batchLabel(b.sourceType) },
                    { label: 'Origin site', value: b.sourceLocation?.name },
                    { label: 'Where it is now', value: b.currentLocation?.name },
                    { label: 'Physical form', value: b.physicalForm ? batchLabel(b.physicalForm) : null },
                    { label: 'Grade', value: b.grade ? formatQuantity(b.grade) : null },
                    { label: 'Purity', value: b.purity ? `${formatQuantity(b.purity)}%` : null },
                    { label: 'Origin evidence', value: batchLabel(b.provenanceStatus) },
                    { label: 'Verification', value: batchLabel(b.verificationStatus) },
                    { label: 'Can be listed', value: batchLabel(b.listingEligibilityStatus) },
                    { label: 'Quantity approval', value: approvalRule(b.quantityApproval) },
                    { label: 'Last changed', value: formatDateTime(b.updatedAt) },
                  ]}
                />

                {!ended && (
                  <section aria-label="Actions" className="flex flex-col gap-3 border-t border-hairline pt-4">
                    <div className="flex flex-wrap gap-2">
                      {can.edit && !quarantined && <Button variant="outlined" onClick={() => setSub('edit')}>Edit</Button>}
                      {can.adjust && operable && <Button variant="outlined" onClick={() => setSub('adjust')}>Change quantity</Button>}
                      {can.adjust && operable && <Button variant="outlined" onClick={() => setSub('reconcile')}>Check against a measurement</Button>}
                    </div>
                    {can.operate && operable && (
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outlined" color="secondary" onClick={() => setSub('split')}>Split</Button>
                        <Button variant="outlined" color="secondary" onClick={() => setSub('merge')}>Merge</Button>
                        <Button variant="outlined" color="secondary" onClick={() => setSub('transform')}>Process</Button>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {can.quarantine && !quarantined && operable && <Button variant="outlined" color="secondary" onClick={() => setDialog('quarantine')}>Place on hold</Button>}
                      {can.quarantine && quarantined && !staffHold && <Button variant="outlined" onClick={() => setDialog('release')}>Release hold</Button>}
                      {can.operate && operable && <Button variant="outlined" color="error" onClick={() => setDialog('retire')}>Retire</Button>}
                    </div>
                  </section>
                )}
              </div>
            </TabPanel>
            <TabPanel value="ledger">
              <LedgerPanel batch={b} entryActions={entryActions} />
            </TabPanel>
            <TabPanel value="family">
              <FamilyPanel batchId={b.id} onOpen={onOpenBatch} />
            </TabPanel>
            <TabPanel value="history">
              <HistoryPanel batch={b} />
            </TabPanel>
            {documents && <TabPanel value="documents">{documents(b)}</TabPanel>}
          </Tabs>
        )}
      </SideSheet>

      {b && (
        <>
          <BatchFormSheet open={sub === 'edit'} batch={b} onClose={() => setSub(null)} {...(staffFormProps?.(b) ?? {})} />
          <SplitSheet open={sub === 'split'} batch={b} onClose={() => setSub(null)} onDone={openAfter} />
          <MergeSheet open={sub === 'merge'} batch={b} onClose={() => setSub(null)} onDone={openAfter} />
          <TransformSheet open={sub === 'transform'} batch={b} onClose={() => setSub(null)} onDone={openAfter} />
          <AdjustSheet open={sub === 'adjust'} batch={b} onClose={() => setSub(null)} />
          <ReconcileSheet open={sub === 'reconcile'} batch={b} onClose={() => setSub(null)} />
          <ConfirmDialog
            open={dialog === 'quarantine'}
            tone="error"
            title={`Place ${b.batchCode} on hold?`}
            description="It can't be sold, allocated or changed until the hold is released. Use this when something about the material needs checking."
            reason={{ label: 'Reason', placeholder: 'e.g. Assay result being disputed', minLength: 3 }}
            confirmLabel="Place on hold"
            loading={quarantineState.isLoading}
            onConfirm={(reason) => run(() => quarantine({ id: b.id, reason: reason ?? '' }).unwrap(), `${b.batchCode} is on hold`)}
            onClose={() => setDialog(null)}
          />
          <ConfirmDialog
            open={dialog === 'release'}
            title={`Release ${b.batchCode}?`}
            description="It returns to the status it had before the hold."
            reason={{ label: 'What was resolved', minLength: 3 }}
            confirmLabel="Release hold"
            loading={releaseState.isLoading}
            onConfirm={(note) => run(() => release({ id: b.id, note: note ?? '' }).unwrap(), `${b.batchCode} released`)}
            onClose={() => setDialog(null)}
          />
          <ConfirmDialog
            open={dialog === 'retire'}
            tone="error"
            title={`Retire ${b.batchCode}?`}
            description={empty ? "It has nothing left, so it ends as depleted. It stays readable, but can't be used again. This can't be undone." : `It still has ${formatQuantity(b.currentQuantity, unit)}, which will be written off as a loss. It stays readable, but can't be used again. This can't be undone.`}
            reason={{ label: 'Why', minLength: 3 }}
            confirmLabel="Retire batch"
            loading={retireState.isLoading}
            onConfirm={(note) => run(() => retire({ id: b.id, reason: empty ? 'DEPLETED' : 'OTHER', note: note ?? '' }).unwrap(), `${b.batchCode} retired`)}
            onClose={() => setDialog(null)}
          />
        </>
      )}
    </>
  );
}
