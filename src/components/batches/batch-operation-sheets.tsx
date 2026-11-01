'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, Button, FormField, Input, DropdownSelect, QuantityInput, SideSheet, Textarea, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { BATCH_CODE_PATTERN, MAX_MERGE_SOURCES, MAX_SPLIT_CHILDREN, MAX_TRANSFORM_OUTPUTS, OPERABLE_STATUSES, PHYSICAL_FORMS, batchOptions, formatQuantity, fromMicro, isPositive, leftToAssign, type Batch } from '@/lib/batches';
import { useGetBatchesQuery, useGetMaterialChoicesQuery, useGetUnitChoicesQuery, useMergeBatchesMutation, useSplitBatchMutation, useTransformBatchMutation } from '@/redux/features/batches/batches_api';
import { useGetLocationsQuery } from '@/redux/features/locations/locations_api';
import { nowForInput } from './batch-form-sheet';

type SheetProps = { open: boolean; batch: Batch; onClose: () => void; onDone: (batchId: string) => void };

function useSites(open: boolean) {
  const locations = useGetLocationsQuery({ active: true, limit: 100 }, { skip: !open });
  return (locations.data?.data ?? []).map((l) => ({ value: l.id, label: l.name }));
}

const codeError = (code: string) => (code && !BATCH_CODE_PATTERN.test(code) ? 'Use 2–64 capital letters, numbers, - and _' : undefined);
const optional = <T,>(key: string, value: T | '') => (value === '' ? {} : { [key]: value });
const when = (v: string) => (v ? { occurredAt: new Date(v).toISOString() } : {});

function Footer({ formId, label, saving, onClose }: { formId: string; label: string; saving: boolean; onClose: () => void }) {
  return (
    <>
      <Button type="button" variant="outlined" color="secondary" onClick={onClose} disabled={saving}>
        Cancel
      </Button>
      <Button type="submit" form={formId} loading={saving} disabled={saving}>
        {label}
      </Button>
    </>
  );
}

function CommonFields({ prefix, reason, setReason, occurredAt, setOccurredAt }: { prefix: string; reason: string; setReason: (v: string) => void; occurredAt: string; setOccurredAt: (v: string) => void }) {
  return (
    <>
      <FormField label="When it physically happened" htmlFor={`${prefix}-when`} help="Empty: now">
        <Input id={`${prefix}-when`} type="datetime-local" value={occurredAt} max={nowForInput()} onChange={(e) => setOccurredAt(e.target.value)} />
      </FormField>
      <FormField label="Reason" htmlFor={`${prefix}-reason`} help="Optional; at least 3 characters. It stays in the batch's history">
        <Textarea id={`${prefix}-reason`} value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={1000} />
      </FormField>
    </>
  );
}

interface ChildRow {
  key: number;
  quantity: string;
  batchCode: string;
  currentLocationId: string;
  physicalForm: string;
}

/** POST /batches/:id/split: the parent is retired and its whole quantity moves to the new batches */
export function SplitSheet({ open, batch, onClose, onDone }: SheetProps) {
  const sites = useSites(open);
  const [split, state] = useSplitBatchMutation();
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();
  const counter = React.useRef(0);
  const blank = (): ChildRow => ({ key: ++counter.current, quantity: '', batchCode: '', currentLocationId: batch.currentLocationId ?? '', physicalForm: batch.physicalForm ?? '' });
  const [rows, setRows] = React.useState<ChildRow[]>([]);
  const [reason, setReason] = React.useState('');
  const [occurredAt, setOccurredAt] = React.useState('');
  const [formError, setFormError] = React.useState<string>();

  React.useEffect(() => {
    if (!open) return;
    setRows([blank(), blank()]);
    setReason('');
    setOccurredAt('');
    setFormError(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, batch.id]);

  const unit = batch.unit?.symbol;
  const left = leftToAssign(batch.currentQuantity, rows.map((r) => r.quantity));
  const change = (k: number, patch: Partial<ChildRow>) => setRows((all) => all.map((r) => (r.key === k ? { ...r, ...patch } : r)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rows.some((r) => !isPositive(r.quantity))) return setFormError('Enter a quantity for every new batch');
    if (left !== BigInt(0)) return setFormError(`The new batches must add up exactly to ${formatQuantity(batch.currentQuantity, unit)}`);
    const badCode = rows.map((r) => codeError(r.batchCode)).find(Boolean);
    if (badCode) return setFormError(`Batch code: ${badCode}`);
    if (reason.trim() && reason.trim().length < 3) return setFormError('Write a reason of at least 3 characters, or leave it empty');
    setFormError(undefined);
    const ok = await confirm({
      title: `Split ${batch.batchCode}?`,
      description: (
        <>
          <span className="block">
            {batch.batchCode} will be retired and {rows.length} new batches created: {rows.map((r) => formatQuantity(r.quantity, unit)).join(', ')}.
          </span>
          <span className="mt-2 block font-medium">This can&apos;t be undone.</span>
        </>
      ),
      confirmLabel: 'Split batch',
      tone: 'error',
    });
    if (!ok) return;
    try {
      const res = await split({
        id: batch.id,
        children: rows.map((r) => ({ quantity: r.quantity, ...optional('batchCode', r.batchCode), ...optional('currentLocationId', r.currentLocationId), ...optional('physicalForm', r.physicalForm) })),
        ...optional('reason', reason.trim()),
        ...when(occurredAt),
        expectedVersion: batch.version,
        idempotencyKey: key,
      }).unwrap();
      done();
      toast.success(`${batch.batchCode} split into ${rows.length} batches`);
      onDone(res.data.children?.[0]?.id ?? batch.id);
    } catch (err) {
      setFormError(toApiError(err).message);
    }
  };

  return (
    <SideSheet open={open} onClose={onClose} size="lg" title={`Split ${batch.batchCode}`} subtitle={`${formatQuantity(batch.currentQuantity, unit)} divided into new batches. To leave part of it unchanged, make that part one of the new batches.`} footer={<Footer formId="split-form" label="Split batch" saving={state.isLoading} onClose={onClose} />}>
      <form id="split-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        {formError && <Alert severity="error">{formError}</Alert>}
        {rows.map((r, i) => (
          <fieldset key={r.key} className="flex flex-col gap-3 rounded-xl border border-hairline p-4">
            <div className="flex items-center justify-between">
              <legend className="text-sm font-semibold text-ink">New batch {i + 1}</legend>
              {rows.length > 2 && (
                <Button type="button" size="sm" variant="text" color="secondary" onClick={() => setRows((all) => all.filter((x) => x.key !== r.key))} aria-label={`Remove new batch ${i + 1}`} startIcon={<Trash2 className="h-4 w-4" aria-hidden />}>
                  Remove
                </Button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label={`Quantity${unit ? ` (${unit})` : ''}`} htmlFor={`split-qty-${r.key}`} required>
                <QuantityInput id={`split-qty-${r.key}`} value={r.quantity} onChange={(v) => change(r.key, { quantity: v })} />
              </FormField>
              <FormField label="Batch code" htmlFor={`split-code-${r.key}`} help="Empty: MINMEG makes one">
                <Input id={`split-code-${r.key}`} value={r.batchCode} onChange={(e) => change(r.key, { batchCode: e.target.value.toUpperCase() })} maxLength={64} autoComplete="off" />
              </FormField>
              <FormField label="Where it is now" htmlFor={`split-site-${r.key}`}>
                <DropdownSelect id={`split-site-${r.key}`} value={r.currentLocationId} onValueChange={(v) => change(r.key, { currentLocationId: v })} options={sites} placeholder="Not recorded" />
              </FormField>
              <FormField label="Physical form" htmlFor={`split-form-${r.key}`}>
                <DropdownSelect id={`split-form-${r.key}`} value={r.physicalForm} onValueChange={(v) => change(r.key, { physicalForm: v })} options={batchOptions(PHYSICAL_FORMS)} placeholder="Not recorded" />
              </FormField>
            </div>
          </fieldset>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button type="button" size="sm" variant="outlined" disabled={rows.length >= MAX_SPLIT_CHILDREN} onClick={() => setRows((all) => [...all, blank()])} startIcon={<Plus className="h-4 w-4" aria-hidden />}>
            Add another
          </Button>
          <p data-testid="split-left" role="status" className={left === BigInt(0) ? 'text-sm font-medium text-brand-green-dark' : 'text-sm font-medium text-semantic-error-text'}>
            {left === BigInt(0) ? 'Adds up exactly' : left > BigInt(0) ? `Left to assign: ${formatQuantity(fromMicro(left), unit)}` : `Too much by ${formatQuantity(fromMicro(-left), unit)}`}
          </p>
        </div>
        <CommonFields prefix="split" reason={reason} setReason={setReason} occurredAt={occurredAt} setOccurredAt={setOccurredAt} />
      </form>
      {dialog}
    </SideSheet>
  );
}

/** POST /batches/merge: whole batches of the same owner, material and unit become one new batch */
export function MergeSheet({ open, batch, onClose, onDone }: SheetProps) {
  const sites = useSites(open);
  const candidates = useGetBatchesQuery({ materialId: batch.materialId, ownerOrganizationId: batch.ownerOrganizationId, limit: 100 }, { skip: !open });
  const [merge, state] = useMergeBatchesMutation();
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [batchCode, setBatchCode] = React.useState('');
  const [currentLocationId, setCurrentLocationId] = React.useState('');
  const [physicalForm, setPhysicalForm] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [occurredAt, setOccurredAt] = React.useState('');
  const [formError, setFormError] = React.useState<string>();

  React.useEffect(() => {
    if (!open) return;
    setPicked(new Set());
    setBatchCode('');
    setCurrentLocationId(batch.currentLocationId ?? '');
    setPhysicalForm(batch.physicalForm ?? '');
    setReason('');
    setOccurredAt('');
    setFormError(undefined);
  }, [open, batch]);

  const others = (candidates.data?.data ?? []).filter((b) => b.id !== batch.id && b.quantityUnitId === batch.quantityUnitId && OPERABLE_STATUSES.includes(b.batchStatus));
  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!picked.size) return setFormError('Choose at least one other batch');
    if (picked.size + 1 > MAX_MERGE_SOURCES) return setFormError(`A merge takes up to ${MAX_MERGE_SOURCES} batches`);
    const badCode = codeError(batchCode);
    if (badCode) return setFormError(`Batch code: ${badCode}`);
    if (reason.trim() && reason.trim().length < 3) return setFormError('Write a reason of at least 3 characters, or leave it empty');
    setFormError(undefined);
    const codes = [batch.batchCode, ...others.filter((b) => picked.has(b.id)).map((b) => b.batchCode)];
    const ok = await confirm({
      title: `Merge ${codes.length} batches?`,
      description: (
        <>
          <span className="block">
            {codes.join(', ')} will be retired and one new batch created. Only do this if the material was physically mixed.
          </span>
          <span className="mt-2 block font-medium">This can&apos;t be undone.</span>
        </>
      ),
      confirmLabel: 'Merge batches',
      tone: 'error',
    });
    if (!ok) return;
    try {
      const res = await merge({
        sourceBatchIds: [batch.id, ...picked],
        ...optional('batchCode', batchCode),
        ...optional('currentLocationId', currentLocationId),
        ...optional('physicalForm', physicalForm),
        ...optional('reason', reason.trim()),
        ...when(occurredAt),
        idempotencyKey: key,
      }).unwrap();
      done();
      toast.success(`${codes.length} batches merged`);
      onDone(res.data.merged?.id ?? batch.id);
    } catch (err) {
      setFormError(toApiError(err).message);
    }
  };

  return (
    <SideSheet open={open} onClose={onClose} size="lg" title={`Merge ${batch.batchCode}`} subtitle="For material that was physically combined. Sharing a supplier, listing, trade or shipment is not a merge." footer={<Footer formId="merge-form" label="Merge batches" saving={state.isLoading} onClose={onClose} />}>
      <form id="merge-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        {formError && <Alert severity="error">{formError}</Alert>}
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-ink">Combine with</legend>
          {candidates.isLoading ? (
            <p className="text-sm text-steel">Loading…</p>
          ) : others.length === 0 ? (
            <p className="text-sm text-steel">No other active batch of {batch.material?.name ?? 'this material'} in the same unit.</p>
          ) : (
            others.map((b) => (
              <label key={b.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-hairline px-3 py-2 text-sm text-ink">
                <input type="checkbox" checked={picked.has(b.id)} onChange={() => toggle(b.id)} className="h-4 w-4" />
                <span className="min-w-0 flex-1 truncate">{b.batchCode}</span>
                <span className="text-steel">{formatQuantity(b.currentQuantity, b.unit?.symbol)}</span>
              </label>
            ))
          )}
        </fieldset>
        <FormField label="New batch code" htmlFor="merge-code" help="Empty: MINMEG makes one">
          <Input id="merge-code" value={batchCode} onChange={(e) => setBatchCode(e.target.value.toUpperCase())} maxLength={64} autoComplete="off" />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Where it is now" htmlFor="merge-site">
            <DropdownSelect id="merge-site" value={currentLocationId} onValueChange={setCurrentLocationId} options={sites} placeholder="Not recorded" />
          </FormField>
          <FormField label="Physical form" htmlFor="merge-form-kind">
            <DropdownSelect id="merge-form-kind" value={physicalForm} onValueChange={setPhysicalForm} options={batchOptions(PHYSICAL_FORMS)} placeholder="Not recorded" />
          </FormField>
        </div>
        <CommonFields prefix="merge" reason={reason} setReason={setReason} occurredAt={occurredAt} setOccurredAt={setOccurredAt} />
      </form>
      {dialog}
    </SideSheet>
  );
}

interface OutputRow {
  key: number;
  materialId: string;
  quantity: string;
  quantityUnitId: string;
  batchCode: string;
  physicalForm: string;
}

/** POST /batches/:id/transform: the whole batch is processed into new material states */
export function TransformSheet({ open, batch, onClose, onDone }: SheetProps) {
  const sites = useSites(open);
  const materials = useGetMaterialChoicesQuery(undefined, { skip: !open });
  const units = useGetUnitChoicesQuery(undefined, { skip: !open });
  const [transform, state] = useTransformBatchMutation();
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();
  const counter = React.useRef(0);
  const blank = (): OutputRow => ({ key: ++counter.current, materialId: '', quantity: '', quantityUnitId: batch.quantityUnitId, batchCode: '', physicalForm: '' });
  const [rows, setRows] = React.useState<OutputRow[]>([]);
  const [processLocationId, setProcessLocationId] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [occurredAt, setOccurredAt] = React.useState('');
  const [formError, setFormError] = React.useState<string>();

  React.useEffect(() => {
    if (!open) return;
    setRows([blank()]);
    setProcessLocationId(batch.currentLocationId ?? '');
    setReason('');
    setOccurredAt('');
    setFormError(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, batch.id]);

  const change = (k: number, patch: Partial<OutputRow>) => setRows((all) => all.map((r) => (r.key === k ? { ...r, ...patch } : r)));
  const materialOptions = (materials.data?.data ?? []).map((m) => ({ value: m.id, label: m.name }));
  const unitOptions = (units.data?.data ?? []).map((u) => ({ value: u.id, label: `${u.name ?? u.code} (${u.symbol})` }));
  const unitSymbol = (id: string) => units.data?.data.find((u) => u.id === id)?.symbol;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rows.some((r) => !r.materialId || !isPositive(r.quantity) || !r.quantityUnitId)) return setFormError('Every output needs a material, a quantity and a unit');
    const badCode = rows.map((r) => codeError(r.batchCode)).find(Boolean);
    if (badCode) return setFormError(`Batch code: ${badCode}`);
    if (reason.trim() && reason.trim().length < 3) return setFormError('Write a reason of at least 3 characters, or leave it empty');
    setFormError(undefined);
    const ok = await confirm({
      title: `Process all of ${batch.batchCode}?`,
      description: (
        <>
          <span className="block">
            All {formatQuantity(batch.currentQuantity, batch.unit?.symbol)} will be used up and {batch.batchCode} retired. New: {rows.map((r) => formatQuantity(r.quantity, unitSymbol(r.quantityUnitId))).join(', ')}. New batches start unverified.
          </span>
          <span className="mt-2 block font-medium">This can&apos;t be undone.</span>
        </>
      ),
      confirmLabel: 'Record processing',
      tone: 'error',
    });
    if (!ok) return;
    try {
      const res = await transform({
        id: batch.id,
        outputs: rows.map((r) => ({ materialId: r.materialId, quantity: r.quantity, quantityUnitId: r.quantityUnitId, ...optional('batchCode', r.batchCode), ...optional('physicalForm', r.physicalForm), ...optional('currentLocationId', processLocationId) })),
        ...optional('processLocationId', processLocationId),
        ...optional('reason', reason.trim()),
        ...when(occurredAt),
        expectedVersion: batch.version,
        idempotencyKey: key,
      }).unwrap();
      done();
      toast.success(`${batch.batchCode} processed`);
      onDone(res.data.outputs?.[0]?.id ?? batch.id);
    } catch (err) {
      setFormError(toApiError(err).message);
    }
  };

  return (
    <SideSheet open={open} onClose={onClose} size="lg" title={`Process ${batch.batchCode}`} subtitle="The whole batch becomes the outputs below. To process only part of it, split it first." footer={<Footer formId="transform-form" label="Record processing" saving={state.isLoading} onClose={onClose} />}>
      <form id="transform-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        {formError && <Alert severity="error">{formError}</Alert>}
        {rows.map((r, i) => (
          <fieldset key={r.key} className="flex flex-col gap-3 rounded-xl border border-hairline p-4">
            <div className="flex items-center justify-between">
              <legend className="text-sm font-semibold text-ink">Output {i + 1}</legend>
              {rows.length > 1 && (
                <Button type="button" size="sm" variant="text" color="secondary" onClick={() => setRows((all) => all.filter((x) => x.key !== r.key))} aria-label={`Remove output ${i + 1}`} startIcon={<Trash2 className="h-4 w-4" aria-hidden />}>
                  Remove
                </Button>
              )}
            </div>
            <FormField label="Material" htmlFor={`output-material-${r.key}`} required>
              <DropdownSelect id={`output-material-${r.key}`} value={r.materialId} onValueChange={(v) => change(r.key, { materialId: v })} options={materialOptions} placeholder="Choose a material" />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Quantity" htmlFor={`output-qty-${r.key}`} required help="Can differ from the input: processing loses or gains weight">
                <QuantityInput id={`output-qty-${r.key}`} value={r.quantity} onChange={(v) => change(r.key, { quantity: v })} />
              </FormField>
              <FormField label="Unit" htmlFor={`output-unit-${r.key}`} required>
                <DropdownSelect id={`output-unit-${r.key}`} value={r.quantityUnitId} onValueChange={(v) => change(r.key, { quantityUnitId: v })} options={unitOptions} placeholder="Choose a unit" />
              </FormField>
              <FormField label="Batch code" htmlFor={`output-code-${r.key}`} help="Empty: MINMEG makes one">
                <Input id={`output-code-${r.key}`} value={r.batchCode} onChange={(e) => change(r.key, { batchCode: e.target.value.toUpperCase() })} maxLength={64} autoComplete="off" />
              </FormField>
              <FormField label="Physical form" htmlFor={`output-form-${r.key}`}>
                <DropdownSelect id={`output-form-${r.key}`} value={r.physicalForm} onValueChange={(v) => change(r.key, { physicalForm: v })} options={batchOptions(PHYSICAL_FORMS)} placeholder="Not recorded" />
              </FormField>
            </div>
          </fieldset>
        ))}
        <Button type="button" size="sm" variant="outlined" className="self-start" disabled={rows.length >= MAX_TRANSFORM_OUTPUTS} onClick={() => setRows((all) => [...all, blank()])} startIcon={<Plus className="h-4 w-4" aria-hidden />}>
          Add another output
        </Button>
        <FormField label="Where it was processed" htmlFor="transform-site">
          <DropdownSelect id="transform-site" value={processLocationId} onValueChange={setProcessLocationId} options={sites} placeholder="Not recorded" />
        </FormField>
        <CommonFields prefix="transform" reason={reason} setReason={setReason} occurredAt={occurredAt} setOccurredAt={setOccurredAt} />
      </form>
      {dialog}
    </SideSheet>
  );
}
