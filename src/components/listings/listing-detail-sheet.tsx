'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Alert, Button, ConfirmDialog, CopyableId, FormField, KeyValueList, NativeSelect, SideSheet, Skeleton, StatusBadge, Tab, TabList, TabPanel, Tabs } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { formatQuantity } from '@/lib/batches';
import { formatDateTime } from '@/lib/format';
import { actionsFor, asList, canBackListing, formatMoney, listingStatusLabel, listingStatusTone, type Listing, type ListingAction, type ListingBatchRow } from '@/lib/listings';
import { useGetBatchesQuery } from '@/redux/features/batches/batches_api';
import { useAddListingBatchMutation, useChangeListingStatusMutation, useGetListingAvailabilityQuery, useGetListingBatchesQuery, useGetListingQuery, useRemoveListingBatchMutation, useSetListingBatchStatusMutation } from '@/redux/features/listings/listings_api';

const ACTION_WORDS: Record<ListingAction, { button: string; title: string; description: string; tone?: 'error' }> = {
  publish: { button: 'Publish', title: 'Publish', description: 'Buyers will be able to see it and send inquiries. It needs stock behind it.' },
  pause: { button: 'Pause', title: 'Pause', description: "Buyers won't see it for now. Its batches stay linked." },
  close: { button: 'Close', title: 'Close', description: 'Buyers stop seeing it and its batches are freed for another listing. The stock itself is untouched, and you can relist it later.', tone: 'error' },
  relist: { button: 'Relist', title: 'Relist', description: 'It goes live again with its earlier batches that are still free and eligible. With none, it goes back to draft.' },
  archive: { button: 'Archive', title: 'Archive', description: "It leaves your active listings and stays as history. Its batches are freed. This can't be undone.", tone: 'error' },
};

export interface ListingPermissions {
  edit: boolean;
  status: boolean;
  batches: boolean;
}

function StockPanel({ listing, can, ownerFilter }: { listing: Listing; can: ListingPermissions; ownerFilter?: boolean }) {
  const rows = useGetListingBatchesQuery(listing.id);
  const availability = useGetListingAvailabilityQuery(listing.id);
  const [adding, setAdding] = React.useState(false);
  const [batchId, setBatchId] = React.useState('');
  const candidates = useGetBatchesQuery({ materialId: listing.materialId, limit: 100, ...(ownerFilter ? { ownerOrganizationId: listing.supplierId } : {}) }, { skip: !adding || !listing.materialId });
  const [addBatch, addState] = useAddListingBatchMutation();
  const [setStatus, statusState] = useSetListingBatchStatusMutation();
  const [removeBatch, removeState] = useRemoveListingBatchMutation();
  const [dialog, setDialog] = React.useState<{ kind: 'suspend' | 'resume' | 'remove'; row: ListingBatchRow } | null>(null);
  const unit = listing.unit?.symbol ?? listing.measure ?? '';
  const usable = (candidates.data?.data ?? []).filter((b) => listing.unitId && canBackListing(b, listing.unitId));
  const closed = ['closed', 'archived'].includes(listing.status);
  const why = (id: string) => availability.data?.data.batches.find((b) => b.batchId === id);
  const all = rows.data?.data ?? [];
  const open = all.filter((r) => r.status !== 'REMOVED' && r.status !== 'CLOSED');
  const past = all.filter((r) => r.status === 'REMOVED' || r.status === 'CLOSED');

  const act = async () => {
    if (!dialog) return;
    try {
      if (dialog.kind === 'remove') await removeBatch({ id: listing.id, batchId: dialog.row.batchId }).unwrap();
      else await setStatus({ id: dialog.row.id, status: dialog.kind === 'suspend' ? 'SUSPENDED' : 'ACTIVE' }).unwrap();
      toast.success('Stock updated');
      setDialog(null);
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  const add = async () => {
    try {
      await addBatch({ id: listing.id, batchId }).unwrap();
      toast.success('Batch added');
      setAdding(false);
      setBatchId('');
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  if (rows.isError) return <Alert severity="error">{toApiError(rows.error).message}</Alert>;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-ink">Available to buyers now: {formatQuantity(availability.data?.data.availableQuantity, unit)}</p>
      {open.length === 0 ? (
        <p className="text-sm text-steel">{rows.isLoading ? 'Loading…' : 'No stock yet. Add a batch to publish this listing.'}</p>
      ) : (
        <ul aria-label="Stock behind this listing" className="flex flex-col divide-y divide-hairline rounded-xl border border-hairline">
          {open.map((r) => {
            const counted = why(r.batchId);
            return (
              <li key={r.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium text-ink">{r.batch.batchCode}</p>
                  <p className="text-xs text-steel">Adds {formatQuantity(counted?.contributes ?? r.availableQuantity, unit)}</p>
                  {counted?.reason && <p className="mt-1 text-xs text-semantic-warning-text">Counts 0: {counted.reason}</p>}
                </div>
                <StatusBadge status={r.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING'}>{r.status === 'ACTIVE' ? 'Counting' : r.status === 'SUSPENDED' ? 'Suspended' : 'Empty'}</StatusBadge>
                {can.batches && !closed && (
                  <span className="flex gap-1">
                    <Button size="sm" variant="text" color="secondary" onClick={() => setDialog({ kind: r.status === 'SUSPENDED' ? 'resume' : 'suspend', row: r })} aria-label={`${r.status === 'SUSPENDED' ? 'Resume' : 'Suspend'} ${r.batch.batchCode}`}>{r.status === 'SUSPENDED' ? 'Resume' : 'Suspend'}</Button>
                    <Button size="sm" variant="text" color="secondary" onClick={() => setDialog({ kind: 'remove', row: r })} aria-label={`Remove ${r.batch.batchCode}`}>Remove</Button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {can.batches && !closed && listing.materialId && (
        adding ? (
          <div className="flex flex-col gap-3 rounded-xl border border-hairline p-4">
            <FormField label="Batch to add" htmlFor="listing-add-batch" help={candidates.isSuccess && !usable.length ? 'No matching batch is free. Register or split one in Inventory.' : 'Same material and unit, listed whole'}>
              <NativeSelect id="listing-add-batch" value={batchId} onValueChange={setBatchId} options={usable.map((b) => ({ value: b.id, label: `${b.batchCode} · ${formatQuantity(b.availableQuantity, b.unit?.symbol)}` }))} placeholder="Choose a batch" />
            </FormField>
            <div className="flex gap-2">
              <Button variant="outlined" color="secondary" onClick={() => setAdding(false)}>Cancel</Button>
              <Button onClick={add} disabled={!batchId} loading={addState.isLoading}>Add batch</Button>
            </div>
          </div>
        ) : (
          <Button variant="outlined" className="self-start" onClick={() => setAdding(true)}>Add a batch</Button>
        )
      )}
      {!listing.materialId && <Alert severity="info">Edit this listing and choose its material and unit before adding stock.</Alert>}

      {past.length > 0 && (
        <section>
          <h3 className="mb-1 text-sm font-semibold text-ink">Earlier batches</h3>
          <ul className="flex flex-col gap-1 text-sm text-steel">
            {past.map((r) => (
              <li key={r.id}>
                {r.batch.batchCode}
                {r.removedAt ? ` · removed ${formatDateTime(r.removedAt)}` : ''}
                {r.removalReason ? ` · ${r.removalReason}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      <ConfirmDialog
        open={!!dialog}
        tone={dialog?.kind === 'resume' ? 'primary' : 'error'}
        title={dialog ? `${dialog.kind === 'remove' ? 'Remove' : dialog.kind === 'suspend' ? 'Suspend' : 'Resume'} ${dialog.row.batch.batchCode}?` : ''}
        description={dialog?.kind === 'remove' ? 'It leaves this listing and can back another one. The batch itself is untouched.' : dialog?.kind === 'suspend' ? 'It stays linked but stops counting towards what buyers see.' : 'It counts towards what buyers see again.'}
        confirmLabel={dialog?.kind === 'remove' ? 'Remove' : dialog?.kind === 'suspend' ? 'Suspend' : 'Resume'}
        loading={statusState.isLoading || removeState.isLoading}
        onConfirm={act}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}

/** One listing: what it says, and the stock behind it */
export function ListingDetailSheet({
  listingId,
  can,
  editHref,
  ownerNode,
  ownerFilter,
  extra,
  onClose,
}: {
  listingId: string | null;
  can: ListingPermissions;
  editHref: (listing: Listing) => string;
  ownerNode?: (listing: Listing) => React.ReactNode;
  /** Staff: choose batches from the listing's company */
  ownerFilter?: boolean;
  extra?: (listing: Listing) => React.ReactNode;
  onClose: () => void;
}) {
  const detail = useGetListingQuery(listingId ?? '', { skip: !listingId });
  const [change, changeState] = useChangeListingStatusMutation();
  const [tab, setTab] = React.useState('details');
  const [action, setAction] = React.useState<ListingAction | null>(null);
  React.useEffect(() => setTab('details'), [listingId]);
  if (!listingId) return null;
  const l = detail.data?.data;
  const unit = l?.unit?.symbol ?? l?.measure ?? '';
  const words = action ? ACTION_WORDS[action] : null;

  const run = async () => {
    if (!l || !action) return;
    try {
      await change({ id: l.id, action }).unwrap();
      toast.success(`${l.product_name}: ${ACTION_WORDS[action].button.toLowerCase()} done`);
      setAction(null);
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  return (
    <SideSheet open onClose={onClose} size="lg" title={l?.product_name ?? 'Listing'} subtitle={l ? `${l.listingCode ?? ''} · ${formatMoney(l.real_price, l.unitCurrency)} per ${unit}` : undefined}>
      {detail.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : detail.isError || !l ? (
        <Alert severity="error">{toApiError(detail.error).message}</Alert>
      ) : (
        <Tabs value={tab} onChange={setTab}>
          <TabList className="mb-4 overflow-x-auto" aria-label="Listing">
            <Tab value="details" label="Details" />
            <Tab value="stock" label="Stock" />
          </TabList>
          <TabPanel value="details">
            <div className="flex flex-col gap-5">
              {l.status === 'draft' && !(l.batches ?? []).length && <Alert severity="info">Add stock to publish. {l.metadata?.statusNote ?? ''}</Alert>}
              {l.images && l.images.length > 0 && (
                <ul aria-label="Pictures" className="flex flex-wrap gap-2">
                  {l.images.map((m) => (
                    <li key={m.imageUuid ?? m.url}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.url} alt="" className="h-20 w-20 rounded-lg border border-hairline object-cover" />
                    </li>
                  ))}
                </ul>
              )}
              <KeyValueList
                columns={2}
                items={[
                  { label: 'Listing ID', value: <CopyableId value={l.id} />, wide: true },
                  ...(ownerNode ? [{ label: 'Company', value: ownerNode(l), wide: true }] : []),
                  { label: 'Status', value: <StatusBadge tone={listingStatusTone(l.status)}>{listingStatusLabel(l.status)}</StatusBadge> },
                  { label: 'Available to buyers', value: formatQuantity(l.availableQuantity, unit) },
                  { label: 'Minimum order', value: l.minimum_order_quantity ? formatQuantity(l.minimum_order_quantity, unit) : 'None' },
                  { label: 'Your price', value: formatMoney(l.real_price, l.unitCurrency) },
                  { label: 'Buyers pay', value: formatMoney(l.display_price, l.unitCurrency) },
                  { label: 'Purity or grade', value: l.purity_grade },
                  { label: 'Payment terms', value: asList(l.selected_payments).join(', ') },
                  { label: 'Shipping terms', value: asList(l.selected_shipping).join(', ') },
                  { label: 'Delivery period', value: l.delivery_period },
                  { label: 'Offered from', value: [l.selected_state, l.selected_country_name].filter(Boolean).join(', ') },
                  { label: 'Last changed', value: formatDateTime(l.updatedAt) },
                ]}
              />
              <p className="text-sm text-slate">{l.productHeaderDescription}</p>
              {extra?.(l)}
              {(can.edit || can.status) && (
                <section aria-label="Actions" className="flex flex-wrap gap-2 border-t border-hairline pt-4">
                  {can.edit && l.status !== 'archived' && (
                    <Link href={editHref(l)}><Button variant="outlined">Edit</Button></Link>
                  )}
                  {can.status && actionsFor(l.status).map((a) => (
                    <Button key={a} variant={a === 'publish' || a === 'relist' ? 'contained' : 'outlined'} color={ACTION_WORDS[a].tone === 'error' ? 'error' : undefined} onClick={() => setAction(a)}>{ACTION_WORDS[a].button}</Button>
                  ))}
                </section>
              )}
            </div>
          </TabPanel>
          <TabPanel value="stock">
            <StockPanel listing={l} can={can} ownerFilter={ownerFilter} />
          </TabPanel>
        </Tabs>
      )}
      <ConfirmDialog
        open={!!action}
        tone={words?.tone ?? 'primary'}
        title={`${words?.title ?? ''} ${l?.product_name ?? ''}?`}
        description={words?.description}
        confirmLabel={words?.button}
        loading={changeState.isLoading}
        onConfirm={run}
        onClose={() => setAction(null)}
      />
    </SideSheet>
  );
}
