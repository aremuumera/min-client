'use client';

import * as React from 'react';
import { Alert, Button, CopyableId, DropdownSelect, FormField, Input, Modal, QuantityInput, StatusBadge, Textarea } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { CODE_STATUS_LABELS, LIVE_UNIT, UNIT_STATUS_LABELS, UNIT_TYPES, unitTypeLabel, type Code, type HandlingUnit } from '@/lib/traceability';
import { formatQuantity } from '@/lib/batches';
import { useGetShipmentsQuery } from '@/redux/features/shipments/shipments_api';
import { useCodeActionMutation, useCreateUnitMutation, useGetBatchUnitsQuery, useUnitActionMutation } from '@/redux/features/traceability/traceability_api';

type UnitForm = { mode: 'new' | 'inside'; parent?: HandlingUnit } | null;
type Reasoned = { kind: 'open' | 'retire' | 'lost' | 'damaged'; unit?: HandlingUnit; code?: Code } | null;

function NewUnitModal({ batchId, form, unitSymbol, onClose }: { batchId: string; form: NonNullable<UnitForm>; unitSymbol?: string; onClose: () => void }) {
  const [type, setType] = React.useState('BAG');
  const [quantity, setQuantity] = React.useState('');
  const [serial, setSerial] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const { key, done } = useIdempotencyKey();
  const [create, { isLoading: creating }] = useCreateUnitMutation();
  const [act, { isLoading: nesting }] = useUnitActionMutation();
  const submit = async () => {
    setError(null);
    const body = { unitType: type, quantity, ...(serial.trim() ? { serialNumber: serial.trim() } : {}) };
    try {
      if (form.mode === 'inside' && form.parent) await act({ id: form.parent.id, action: 'children', body }).unwrap();
      else await create({ batchId, ...body, idempotencyKey: key }).unwrap();
      done();
      onClose();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };
  return (
    <Modal open onClose={onClose} size="sm">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{form.mode === 'inside' ? `Add a unit inside ${unitTypeLabel(form.parent!.unitType).toLowerCase()} ${form.parent!.serialNumber ?? ''}` : 'Add a unit'}</h3>
          <p className="mt-1 text-sm text-gray-500">A bag, drum, pallet or container holding part of this batch. Units together cannot hold more than the batch.</p>
        </div>
        <FormField htmlFor="unit-type" label="Type" required>
          <DropdownSelect id="unit-type" aria-label="Type" value={type} onValueChange={setType} options={UNIT_TYPES.map((t) => ({ value: t, label: unitTypeLabel(t) }))} />
        </FormField>
        <FormField htmlFor="unit-quantity" label="Quantity" required>
          <QuantityInput id="unit-quantity" value={quantity} onChange={setQuantity} unit={unitSymbol} />
        </FormField>
        <FormField htmlFor="unit-serial" label="Your own number" optional info="A number already written on the bag or drum, if it has one.">
          <Input id="unit-serial" value={serial} maxLength={64} onChange={(e) => setSerial(e.target.value)} />
        </FormField>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!Number(quantity) || creating || nesting} onClick={submit}>Add unit</Button>
        </div>
      </div>
    </Modal>
  );
}

function LoadModal({ unit, onClose }: { unit: HandlingUnit; onClose: () => void }) {
  const shipments = useGetShipmentsQuery({ status: 'READY_FOR_DISPATCH', limit: 100 });
  const [shipmentId, setShipmentId] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [act, { isLoading }] = useUnitActionMutation();
  const options = (shipments.data?.data ?? []).filter((s) => s.viewerRole === 'seller').map((s) => ({ value: s.id, label: `${s.shipmentNumber} · ${s.trade?.tradeCode ?? ''}` }));
  const submit = async () => {
    setError(null);
    try {
      await act({ id: unit.id, action: 'pack', body: { shipmentId } }).unwrap();
      onClose();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };
  return (
    <Modal open onClose={onClose} size="sm">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Load onto a shipment</h3>
          <p className="mt-1 text-sm text-gray-500">The unit travels with the shipment. Only shipments ready to leave, for a trade this batch supplies, can take it.</p>
        </div>
        <FormField htmlFor="load-shipment" label="Shipment" required>
          <DropdownSelect id="load-shipment" aria-label="Shipment" value={shipmentId} onValueChange={setShipmentId} placeholder={shipments.isLoading ? 'Loading shipments…' : options.length ? 'Choose a shipment' : 'No shipment is ready to leave'} options={options} />
        </FormField>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!shipmentId || isLoading} onClick={submit}>Load</Button>
        </div>
      </div>
    </Modal>
  );
}

const REASONED_TEXT = {
  open: { title: 'Open this unit?', body: 'Opening a sealed unit away from its destination raises an alert for MINMEG.', button: 'Open' },
  retire: { title: 'Retire this unit?', body: 'It stops counting towards the batch. Its codes are retired with it.', button: 'Retire' },
  lost: { title: 'Report this code lost?', body: 'The code stops working. The inspector replaces it with a new one.', button: 'Report lost' },
  damaged: { title: 'Report this code damaged?', body: 'The code stops working. The inspector replaces it with a new one.', button: 'Report damaged' },
} as const;

function ReasonModal({ action, onClose }: { action: NonNullable<Reasoned>; onClose: () => void }) {
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [unitAct, { isLoading: a }] = useUnitActionMutation();
  const [codeAct, { isLoading: b }] = useCodeActionMutation();
  const text = REASONED_TEXT[action.kind];
  const submit = async () => {
    setError(null);
    try {
      if (action.kind === 'open' || action.kind === 'retire') await unitAct({ id: action.unit!.id, action: action.kind, body: { reason: reason.trim() } }).unwrap();
      else await codeAct({ id: action.code!.id, action: action.kind === 'lost' ? 'report-lost' : 'report-damaged', body: { reason: reason.trim() } }).unwrap();
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
        <FormField htmlFor="reason-text" label="Reason" required>
          <Textarea id="reason-text" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={1000} />
        </FormField>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Back</Button>
          <Button disabled={reason.trim().length < 3 || a || b} onClick={submit}>{text.button}</Button>
        </div>
      </div>
    </Modal>
  );
}

function CodeChips({ codes, canReport, onReport }: { codes: Code[]; canReport: boolean; onReport: (code: Code, kind: 'lost' | 'damaged') => void }) {
  if (!codes.length) return <p className="text-xs text-steel">No MINMEG code yet</p>;
  return (
    <ul className="space-y-1">
      {codes.map((c) => (
        <li key={c.id} className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-ink">{c.identifierType === 'SEAL' ? 'Seal' : c.identifierType}</span>
          {c.publicReference ? <CopyableId value={c.publicReference} mono /> : null}
          <StatusBadge status={c.status}>{CODE_STATUS_LABELS[c.status] ?? c.status}</StatusBadge>
          {canReport && c.status === 'ACTIVE' && (
            <>
              <button type="button" className="min-h-11 px-2 text-steel underline" onClick={() => onReport(c, 'lost')}>Lost</button>
              <button type="button" className="min-h-11 px-2 text-steel underline" onClick={() => onReport(c, 'damaged')}>Damaged</button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * A batch's handling units and MINMEG codes. The owner (and staff) pack units, nest them, load them on a
 * shipment, open, empty and retire them. Codes are made and applied by the inspector (decision #69):
 * `codeTools` adds those buttons where the viewer may use them.
 */
export function BatchUnitsPanel({ batchId, unitSymbol, canManage, codeTools, unitTools }: {
  batchId: string;
  unitSymbol?: string;
  canManage: boolean;
  codeTools?: (data: { units: HandlingUnit[]; batchCodes: Code[] }) => React.ReactNode;
  unitTools?: (unit: HandlingUnit) => React.ReactNode;
}) {
  const [showRetired, setShowRetired] = React.useState(false);
  const query = useGetBatchUnitsQuery({ batchId, includeRetired: showRetired }, { refetchOnMountOrArgChange: true });
  const [form, setForm] = React.useState<UnitForm>(null);
  const [loading, setLoading] = React.useState<HandlingUnit | null>(null);
  const [reasoned, setReasoned] = React.useState<Reasoned>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [act] = useUnitActionMutation();
  const data = query.data?.data;

  if (query.isError) return <Alert severity="error">{toApiError(query.error).message}</Alert>;
  if (!data) return <p className="text-sm text-steel">Loading units…</p>;

  const empty = async (unit: HandlingUnit) => {
    setError(null);
    try {
      await act({ id: unit.id, action: 'empty', body: {} }).unwrap();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };
  const topUnits = data.units.filter((u) => !u.parentHandlingUnitId);
  const childrenOf = (id: string) => data.units.filter((u) => u.parentHandlingUnitId === id);

  const row = (u: HandlingUnit, depth: number): React.ReactNode => (
    <React.Fragment key={u.id}>
      <li className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between" style={{ paddingLeft: 12 + depth * 20 }}>
        <div className="min-w-0 space-y-1 text-sm">
          <p className="font-medium text-ink">
            {unitTypeLabel(u.unitType)}
            {u.serialNumber ? ` ${u.serialNumber}` : ''} · {formatQuantity(u.quantity, unitSymbol)}
          </p>
          {u.sealed && u.sealReference && <p className="text-xs text-steel">Sealed: {u.sealReference}</p>}
          <CodeChips codes={u.identifiers} canReport={canManage || data.seesPrintable} onReport={(code, kind) => setReasoned({ kind, code })} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={u.status}>{UNIT_STATUS_LABELS[u.status] ?? u.status}</StatusBadge>
          {unitTools?.(u)}
          {canManage && ['ACTIVE', 'PACKED'].includes(u.status) && !u.parentHandlingUnitId && <Button size="sm" variant="outlined" onClick={() => setLoading(u)}>Load on shipment</Button>}
          {canManage && ['ACTIVE', 'PACKED'].includes(u.status) && !u.sealed && <Button size="sm" variant="outlined" onClick={() => setForm({ mode: 'inside', parent: u })}>Add inside</Button>}
          {canManage && ['PACKED', 'LOADED'].includes(u.status) && u.sealed && <Button size="sm" variant="outlined" onClick={() => setReasoned({ kind: 'open', unit: u })}>Open</Button>}
          {canManage && ['ACTIVE', 'OPENED'].includes(u.status) && <Button size="sm" variant="outlined" onClick={() => empty(u)}>Empty</Button>}
          {canManage && u.status !== 'RETIRED' && !['LOADED', 'IN_TRANSIT'].includes(u.status) && <Button size="sm" variant="outlined" color="error" onClick={() => setReasoned({ kind: 'retire', unit: u })}>Retire</Button>}
        </div>
      </li>
      {childrenOf(u.id).map((c) => row(c, depth + 1))}
    </React.Fragment>
  );

  const live = data.units.filter((u) => LIVE_UNIT.includes(u.status));
  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-ink">Codes on the batch</h3>
        <CodeChips codes={data.identifiers} canReport={canManage || data.seesPrintable} onReport={(code, kind) => setReasoned({ kind, code })} />
      </section>
      {codeTools?.({ units: data.units, batchCodes: data.identifiers })}
      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-ink">Units ({live.length} holding goods)</h3>
          <div className="flex items-center gap-3">
            <label className="flex min-h-11 items-center gap-2 text-sm text-steel">
              <input type="checkbox" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} /> Show retired
            </label>
            {canManage && <Button size="sm" onClick={() => setForm({ mode: 'new' })}>Add a unit</Button>}
          </div>
        </div>
        {error && <Alert severity="error">{error}</Alert>}
        {!topUnits.length ? (
          <p className="text-sm text-steel">No units yet. {canManage ? 'Add the bags, drums or pallets this batch is packed in.' : ''}</p>
        ) : (
          <ul className="divide-y divide-hairline rounded-xl border border-hairline">{topUnits.map((u) => row(u, 0))}</ul>
        )}
        {canManage && <p className="text-xs text-steel">MINMEG codes are made, printed and put on the units by the inspector assigned to the trade, at your site.</p>}
      </section>
      {form && <NewUnitModal batchId={batchId} form={form} unitSymbol={unitSymbol} onClose={() => setForm(null)} />}
      {loading && <LoadModal unit={loading} onClose={() => setLoading(null)} />}
      {reasoned && <ReasonModal action={reasoned} onClose={() => setReasoned(null)} />}
    </div>
  );
}
