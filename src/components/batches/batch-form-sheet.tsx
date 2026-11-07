'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Alert, Button, FormField, Input, DropdownSelect, QuantityInput, SideSheet, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { BATCH_CODE_PATTERN, PHYSICAL_FORMS, REGISTER_SOURCES, REGISTER_TYPES, batchOptions, formatQuantity, isPositive, type Batch } from '@/lib/batches';
import { useCreateBatchMutation, useGetMaterialChoicesQuery, useGetUnitChoicesQuery, useUpdateBatchMutation } from '@/redux/features/batches/batches_api';
import { useGetLocationsQuery } from '@/redux/features/locations/locations_api';

export interface BatchFormSheetProps {
  open: boolean;
  /** Edit this batch; null to register a new one */
  batch: Batch | null;
  onClose: () => void;
  onSaved?: (batch: Batch) => void;
  /** Staff only: which company owns the new batch */
  ownerField?: React.ReactNode;
  ownerBody?: { ownerOrganizationId: string };
  ownerError?: string;
  /** Staff only: trust and eligibility statuses, sent with an edit */
  staffFields?: React.ReactNode;
  staffBody?: Record<string, unknown>;
}

/** The latest moment a physical event can be recorded for, in the format of a datetime-local input */
export const nowForInput = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

/** POST /batches, PATCH /batches/:id. Code, owner, material, unit and quantities are fixed once registered. */
export function BatchFormSheet({ open, batch, onClose, onSaved, ownerField, ownerBody, ownerError, staffFields, staffBody }: BatchFormSheetProps) {
  const editing = !!batch;
  const materials = useGetMaterialChoicesQuery(undefined, { skip: !open || editing });
  const units = useGetUnitChoicesQuery(undefined, { skip: !open || editing });
  const locations = useGetLocationsQuery({ active: true, limit: 100 }, { skip: !open });
  const [create, createState] = useCreateBatchMutation();
  const [update, updateState] = useUpdateBatchMutation();
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();
  const saving = createState.isLoading || updateState.isLoading;

  const [materialId, setMaterialId] = React.useState('');
  const [quantity, setQuantity] = React.useState('');
  const [unitId, setUnitId] = React.useState('');
  const [batchType, setBatchType] = React.useState('INITIAL');
  const [sourceType, setSourceType] = React.useState('');
  const [sourceLocationId, setSourceLocationId] = React.useState('');
  const [currentLocationId, setCurrentLocationId] = React.useState('');
  const [batchCode, setBatchCode] = React.useState('');
  const [physicalForm, setPhysicalForm] = React.useState('');
  const [grade, setGrade] = React.useState('');
  const [purity, setPurity] = React.useState('');
  const [occurredAt, setOccurredAt] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string>();

  React.useEffect(() => {
    if (!open) return;
    setMaterialId('');
    setQuantity('');
    setUnitId('');
    setBatchType('INITIAL');
    setSourceType('');
    setSourceLocationId('');
    setCurrentLocationId(batch?.currentLocationId ?? '');
    setBatchCode('');
    setPhysicalForm(batch?.physicalForm ?? '');
    setGrade(batch?.grade ?? '');
    setPurity(batch?.purity ?? '');
    setOccurredAt('');
    setErrors({});
    setFormError(undefined);
  }, [open, batch]);

  const siteOptions = (locations.data?.data ?? []).map((l) => ({ value: l.id, label: l.name }));
  const unitOptions = (units.data?.data ?? []).map((u) => ({ value: u.id, label: `${u.name ?? u.code} (${u.symbol})` }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!editing) {
      if (ownerError) next.ownerOrganizationId = ownerError;
      if (!materialId) next.materialId = 'Choose the material';
      if (!isPositive(quantity)) next.initialQuantity = 'Enter the quantity you physically have';
      if (!unitId) next.quantityUnitId = 'Choose the unit';
      if (!sourceType) next.sourceType = 'Say where it came from';
      if (batchCode && !BATCH_CODE_PATTERN.test(batchCode)) next.batchCode = 'Use 2–64 capital letters, numbers, - and _';
    }
    if (purity && (Number(purity) < 0 || Number(purity) > 100)) next.purity = 'Purity is 0 to 100';
    if (grade && Number(grade) < 0) next.grade = "Grade can't be negative";
    return next;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(undefined);
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    const material = materials.data?.data.find((m) => m.id === materialId);
    const unit = units.data?.data.find((u) => u.id === unitId);
    const ok = await confirm(
      batch
        ? { title: `Save changes to ${batch.batchCode}?`, confirmLabel: 'Save changes' }
        : { title: `Register ${formatQuantity(quantity, unit?.symbol)} of ${material?.name ?? 'this material'}?`, description: "The quantity becomes the batch's first ledger entry. After this it only changes through recorded movements, and material and unit can't be changed.", confirmLabel: 'Register batch' },
    );
    if (!ok) return;

    const shared = { currentLocationId: currentLocationId || null, physicalForm: physicalForm || null, grade: grade || null, purity: purity || null };
    try {
      if (batch) {
        const res = await update({ id: batch.id, ...shared, ...staffBody, expectedVersion: batch.version }).unwrap();
        toast.success('Batch updated');
        onSaved?.(res.data);
      } else {
        const res = await create({
          ...ownerBody,
          ...shared,
          materialId,
          batchType,
          initialQuantity: quantity,
          quantityUnitId: unitId,
          sourceType,
          sourceLocationId: sourceLocationId || null,
          ...(batchCode ? { batchCode } : {}),
          ...(occurredAt ? { occurredAt: new Date(occurredAt).toISOString() } : {}),
          idempotencyKey: key,
        }).unwrap();
        done();
        toast.success(`Batch ${res.data.batchCode} registered`);
        onSaved?.(res.data);
      }
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
      title={batch ? `Edit ${batch.batchCode}` : 'Register a batch'}
      subtitle={batch ? "Where it is and what it's like now. Quantities change through the ledger." : 'One physical lot you really have, with its own origin.'}
      footer={
        <>
          <Button type="button" variant="outlined" color="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="batch-form" loading={saving} disabled={saving}>
            {batch ? 'Save changes' : 'Register batch'}
          </Button>
        </>
      }
    >
      <form id="batch-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        {formError && <Alert severity="error">{formError}</Alert>}
        {!editing && (
          <>
            {ownerField}
            {errors.ownerOrganizationId && <p className="text-sm text-semantic-error-text">{errors.ownerOrganizationId}</p>}
            <FormField label="Material" htmlFor="batch-material" required error={errors.materialId}>
              <DropdownSelect id="batch-material" value={materialId} onValueChange={setMaterialId} options={(materials.data?.data ?? []).map((m) => ({ value: m.id, label: m.name }))} placeholder="Choose a material" />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Quantity" htmlFor="batch-quantity" required error={errors.initialQuantity} help="What you physically have today">
                <QuantityInput id="batch-quantity" value={quantity} onChange={(v) => setQuantity(v)} />
              </FormField>
              <FormField label="Unit" htmlFor="batch-unit" required error={errors.quantityUnitId}>
                <DropdownSelect id="batch-unit" value={unitId} onValueChange={setUnitId} options={unitOptions} placeholder="Choose a unit" />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Where it came from" htmlFor="batch-source" required error={errors.sourceType}>
                <DropdownSelect id="batch-source" value={sourceType} onValueChange={setSourceType} options={batchOptions(REGISTER_SOURCES)} placeholder="Choose one" />
              </FormField>
              <FormField label="Registering" htmlFor="batch-type" help="New stock is always its own batch, never added to an old one">
                <DropdownSelect id="batch-type" value={batchType} onValueChange={setBatchType} options={batchOptions(REGISTER_TYPES)} />
              </FormField>
            </div>
            <FormField label="Origin site" htmlFor="batch-origin" error={errors.sourceLocationId} help="Without one, the batch's origin shows as not recorded">
              <DropdownSelect id="batch-origin" value={sourceLocationId} onValueChange={setSourceLocationId} options={siteOptions} placeholder="Not recorded" />
            </FormField>
          </>
        )}
        <FormField label="Where it is now" htmlFor="batch-current" error={errors.currentLocationId} help={editing ? undefined : 'Empty: at the origin site'}>
          <DropdownSelect id="batch-current" value={currentLocationId} onValueChange={setCurrentLocationId} options={siteOptions} placeholder="Not recorded" />
        </FormField>
        <FormField label="Physical form" htmlFor="batch-form-kind" error={errors.physicalForm}>
          <DropdownSelect id="batch-form-kind" value={physicalForm} onValueChange={setPhysicalForm} options={batchOptions(PHYSICAL_FORMS)} placeholder="Not recorded" />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Grade" htmlFor="batch-grade" error={errors.grade} help="As your material is usually graded">
            <QuantityInput id="batch-grade" value={grade} onChange={(v) => setGrade(v)} />
          </FormField>
          <FormField label="Purity (%)" htmlFor="batch-purity" error={errors.purity}>
            <QuantityInput id="batch-purity" value={purity} onChange={(v) => setPurity(v)} />
          </FormField>
        </div>
        {!editing && (
          <>
            <FormField label="Batch code" htmlFor="batch-code" error={errors.batchCode} help="Empty: MINMEG makes one. It can't be changed later">
              <Input id="batch-code" value={batchCode} onChange={(e) => setBatchCode(e.target.value.toUpperCase())} maxLength={64} autoComplete="off" />
            </FormField>
            <FormField label="When it was mined or received" htmlFor="batch-when" help="Empty: now">
              <Input id="batch-when" type="datetime-local" value={occurredAt} max={nowForInput()} onChange={(e) => setOccurredAt(e.target.value)} />
            </FormField>
          </>
        )}
        {editing && staffFields}
      </form>
      {dialog}
    </SideSheet>
  );
}
