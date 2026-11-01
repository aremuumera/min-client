'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Alert, Button, FormField, Input, DropdownSelect, QuantityInput, SideSheet, Textarea, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { ADJUSTMENT_TYPES, MEASUREMENT_SOURCES, batchLabel, batchOptions, formatQuantity, isPositive, type Batch } from '@/lib/batches';
import { useAdjustBatchMutation, useGetBatchAttachmentsQuery, useGetUnitChoicesQuery, useReconcileBatchMutation } from '@/redux/features/batches/batches_api';
import { nowForInput } from './batch-form-sheet';

type SheetProps = { open: boolean; batch: Batch; onClose: () => void };

/** POST /batches/:id/ledger/adjustments: a loss, gain or correction, always with a reason */
export function AdjustSheet({ open, batch, onClose }: SheetProps) {
  const attachments = useGetBatchAttachmentsQuery(batch.id, { skip: !open });
  const [adjust, state] = useAdjustBatchMutation();
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();
  const [entryType, setEntryType] = React.useState('LOSS');
  const [direction, setDirection] = React.useState('OUT');
  const [quantity, setQuantity] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [evidence, setEvidence] = React.useState('');
  const [occurredAt, setOccurredAt] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string>();

  React.useEffect(() => {
    if (!open) return;
    setEntryType('LOSS');
    setDirection('OUT');
    setQuantity('');
    setReason('');
    setEvidence('');
    setOccurredAt('');
    setErrors({});
    setFormError(undefined);
  }, [open]);

  const unit = batch.unit?.symbol;
  const goesOut = entryType === 'LOSS' || (entryType === 'ADJUSTMENT' && direction === 'OUT');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(undefined);
    const next: Record<string, string> = {};
    if (!isPositive(quantity)) next.quantity = 'Enter the amount';
    if (reason.trim().length < 3) next.reason = 'Explain why, in at least 3 characters';
    setErrors(next);
    if (Object.keys(next).length) return;
    const ok = await confirm({
      title: `Record ${goesOut ? 'a reduction' : 'an increase'} of ${formatQuantity(quantity, unit)}?`,
      description: `On ${batch.batchCode}, which now has ${formatQuantity(batch.currentQuantity, unit)}. It stays in the ledger permanently.`,
      confirmLabel: 'Record change',
    });
    if (!ok) return;
    try {
      const res = await adjust({
        id: batch.id,
        entryType,
        ...(entryType === 'ADJUSTMENT' ? { direction } : {}),
        quantity,
        reason: reason.trim(),
        ...(evidence ? { evidenceAttachmentId: evidence } : {}),
        ...(occurredAt ? { occurredAt: new Date(occurredAt).toISOString() } : {}),
        idempotencyKey: key,
      }).unwrap();
      done();
      if (res.data.approvalRequired) toast.info('Recorded: waiting for MINMEG approval. The quantity moves once approved.');
      else toast.success('Quantity changed');
      onClose();
    } catch (err) {
      const apiError = toApiError(err);
      if (Object.keys(apiError.fields).length) setErrors(apiError.fields);
      setFormError(apiError.message);
    }
  };

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title={`Change quantity of ${batch.batchCode}`}
      subtitle={`Now ${formatQuantity(batch.currentQuantity, unit)}. For spillage, theft, or a mistake in an earlier figure.`}
      footer={
        <>
          <Button type="button" variant="outlined" color="secondary" onClick={onClose} disabled={state.isLoading}>
            Cancel
          </Button>
          <Button type="submit" form="adjust-form" loading={state.isLoading} disabled={state.isLoading}>
            Record change
          </Button>
        </>
      }
    >
      <form id="adjust-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        {formError && <Alert severity="error">{formError}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="What happened" htmlFor="adjust-type">
            <DropdownSelect id="adjust-type" value={entryType} onValueChange={setEntryType} options={batchOptions(ADJUSTMENT_TYPES)} />
          </FormField>
          {entryType === 'ADJUSTMENT' && (
            <FormField label="Direction" htmlFor="adjust-direction">
              <DropdownSelect
                id="adjust-direction"
                value={direction}
                onValueChange={setDirection}
                options={[
                  { value: 'OUT', label: 'Less than recorded' },
                  { value: 'IN', label: 'More than recorded' },
                ]}
              />
            </FormField>
          )}
        </div>
        <FormField label={`Amount${unit ? ` (${unit})` : ''}`} htmlFor="adjust-quantity" required error={errors.quantity} help="The difference, not the new total">
          <QuantityInput id="adjust-quantity" value={quantity} onChange={(v) => setQuantity(v)} />
        </FormField>
        <FormField label="Reason" htmlFor="adjust-reason" required error={errors.reason}>
          <Textarea id="adjust-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={1000} placeholder="e.g. Spillage while loading at the yard" />
        </FormField>
        <FormField label="Supporting document" htmlFor="adjust-evidence" help="Attach it to the batch first">
          <DropdownSelect id="adjust-evidence" value={evidence} onValueChange={setEvidence} options={(attachments.data?.data ?? []).map((a) => ({ value: a.id, label: a.title ?? a.file?.displayName ?? batchLabel(a.attachmentType) }))} placeholder="None" />
        </FormField>
        <FormField label="When it happened" htmlFor="adjust-when" help="Empty: now">
          <Input id="adjust-when" type="datetime-local" value={occurredAt} max={nowForInput()} onChange={(e) => setOccurredAt(e.target.value)} />
        </FormField>
      </form>
      {dialog}
    </SideSheet>
  );
}

/** POST /batches/:id/reconcile: compare a physical measurement with the record */
export function ReconcileSheet({ open, batch, onClose }: SheetProps) {
  const units = useGetUnitChoicesQuery(undefined, { skip: !open });
  const [reconcile, state] = useReconcileBatchMutation();
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();
  const [measured, setMeasured] = React.useState('');
  const [unitId, setUnitId] = React.useState(batch.quantityUnitId);
  const [source, setSource] = React.useState('WEIGHBRIDGE');
  const [note, setNote] = React.useState('');
  const [occurredAt, setOccurredAt] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string>();

  React.useEffect(() => {
    if (!open) return;
    setMeasured('');
    setUnitId(batch.quantityUnitId);
    setSource('WEIGHBRIDGE');
    setNote('');
    setOccurredAt('');
    setErrors({});
    setFormError(undefined);
  }, [open, batch.quantityUnitId]);

  const symbol = units.data?.data.find((u) => u.id === unitId)?.symbol;
  const recorded = formatQuantity(batch.currentQuantity, batch.unit?.symbol);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(undefined);
    if (measured.trim() === '') return setErrors({ measuredQuantity: 'Enter what was measured' });
    setErrors({});
    const ok = await confirm({
      title: `Record a measurement of ${formatQuantity(measured, symbol)}?`,
      description: `${batch.batchCode} is recorded at ${recorded}. If they differ, the difference goes into the ledger; the earlier figures stay.`,
      confirmLabel: 'Record measurement',
    });
    if (!ok) return;
    try {
      const res = await reconcile({ id: batch.id, measuredQuantity: measured, unitId, measurementSource: source, ...(note.trim() ? { note: note.trim() } : {}), ...(occurredAt ? { occurredAt: new Date(occurredAt).toISOString() } : {}), idempotencyKey: key }).unwrap();
      done();
      if (res.data.status === 'MATCHED') toast.success('The measurement matches the record');
      else if (res.data.status === 'PENDING_APPROVAL') toast.info('Recorded: the difference is waiting for MINMEG approval');
      else toast.success('Quantity updated to the measurement');
      onClose();
    } catch (err) {
      const apiError = toApiError(err);
      if (Object.keys(apiError.fields).length) setErrors(apiError.fields);
      setFormError(apiError.message);
    }
  };

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title={`Check ${batch.batchCode} against a measurement`}
      subtitle={`Recorded: ${recorded}.`}
      footer={
        <>
          <Button type="button" variant="outlined" color="secondary" onClick={onClose} disabled={state.isLoading}>
            Cancel
          </Button>
          <Button type="submit" form="reconcile-form" loading={state.isLoading} disabled={state.isLoading}>
            Record measurement
          </Button>
        </>
      }
    >
      <form id="reconcile-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        {formError && <Alert severity="error">{formError}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Measured quantity" htmlFor="reconcile-quantity" required error={errors.measuredQuantity}>
            <QuantityInput id="reconcile-quantity" value={measured} onChange={(v) => setMeasured(v)} />
          </FormField>
          <FormField label="Unit" htmlFor="reconcile-unit" error={errors.unitId} help="Converted if it differs from the batch's unit">
            <DropdownSelect id="reconcile-unit" value={unitId} onValueChange={setUnitId} options={(units.data?.data ?? []).map((u) => ({ value: u.id, label: `${u.name ?? u.code} (${u.symbol})` }))} />
          </FormField>
        </div>
        <FormField label="How it was measured" htmlFor="reconcile-source">
          <DropdownSelect id="reconcile-source" value={source} onValueChange={setSource} options={batchOptions(MEASUREMENT_SOURCES)} />
        </FormField>
        <FormField label="Note" htmlFor="reconcile-note">
          <Textarea id="reconcile-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} />
        </FormField>
        <FormField label="When it was measured" htmlFor="reconcile-when" help="Empty: now">
          <Input id="reconcile-when" type="datetime-local" value={occurredAt} max={nowForInput()} onChange={(e) => setOccurredAt(e.target.value)} />
        </FormField>
      </form>
      {dialog}
    </SideSheet>
  );
}
