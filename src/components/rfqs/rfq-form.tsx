'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Alert, Button, DropdownSelect, FieldInfo, FileDropZone, FormField, Input, MultiCheckboxSelect, SelectWithCustom, Skeleton, Switch, Textarea, useConfirm } from '@/components/ui';
import { CategoryPicker } from '@/components/listings/category-picker';
import { toApiError } from '@/lib/api/errors';
import { compressImages } from '@/lib/images/compress';
import { categoryByTag, categoryChain, mineralRoot, nonMineralRoots, type CategoryNode } from '@/lib/listings';
import { COUNTRY_OPTIONS, FULFILMENT_OPTIONS, LOCATION_TYPE_OPTIONS, NIGERIA, countryName, fromDateInput, optionLabel, rfqFileError, stateOptions, toDateInput, todayInput, type Rfq, type RfqKind } from '@/lib/rfqs';
import { PACKAGING_OPTIONS, SAMPLING_OPTIONS, paymentTerms, shippingTerms } from '@/lib/trade-terms';
import { useGetUnitChoicesQuery } from '@/redux/features/batches/batches_api';
import { useCreateRFQMutation, useDeleteRfqMediaMutation, useEditRFQMutation, useUpdateRfqMediaMutation } from '@/redux/features/buyer-rfq/rfq-api';
import { useGetCategoryTreeQuery, useGetMarketplaceMaterialsQuery } from '@/redux/features/listings/listings_api';

const STEPS = ['What you need', 'Details and terms', 'Destination and deadline', 'Review'] as const;
const NO_CATEGORIES: readonly CategoryNode[] = [];
const PACKAGING_LIST = PACKAGING_OPTIONS.filter((o) => o.value !== 'Custom');
const INFO = {
  kind: 'A mineral, or something else such as tools, equipment or a service. It decides which categories you choose from.',
  name: 'What suppliers and MINMEG will see. Type what you need, even if it is not on any list.',
  material: 'If what you need is on MINMEG\'s list, choose it and the name and categories fill in. If it isn\'t, leave this empty and just type the name.',
  unit: 'Any unit you want to buy in.',
  quantity: 'How much you need, in the unit you chose.',
  duration: 'How long the supply should last, such as 3 months.',
  delivery: 'How soon after the deal you need it, such as 2 weeks.',
  grade: 'The purity or grade you need, such as 95%+ or Grade A.',
  moisture: 'The most moisture you will accept, in percent.',
  packaging: 'How you want it packed.',
  sampling: 'Who should test the quality.',
  supply: 'One order, or a supply that repeats.',
  frequency: 'How often it repeats.',
  months: 'How many months it repeats for.',
  urgency: 'Urgent RFQs are marked for suppliers.',
  services: 'What you want included in the offers.',
  fulfilment: 'How you want to receive it.',
  location: 'The kind of place you want it to come from.',
  deadline: 'The last day suppliers can send offers. The RFQ then closes by itself.',
  country: 'Where it must end up. Within Nigeria, state and full address are needed.',
  state: 'The state or region it is going to.',
  address: 'Only MINMEG and the supplier whose offer is accepted see this.',
  description: 'Anything else suppliers should know.',
  files: 'Pictures, a specification sheet or a short video. Pictures are compressed; PDFs and videos go up unchanged.',
};

export interface RfqFormProps {
  buyerId: string;
  /** Edit this RFQ; null to create */
  rfq: Rfq | null;
  onDone: (rfqId: string, published: boolean, name: string) => void;
  onCancel: () => void;
}

/** Create and edit an RFQ (step 2.6b). The typed name is always there; a material from the list is optional (decision #100). */
export function RfqForm({ buyerId, rfq, onDone, onCancel }: RfqFormProps) {
  const editing = !!rfq;
  const published = editing && rfq.status !== 'draft';
  const [step, setStep] = React.useState(0);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string>();

  const [kind, setKind] = React.useState<RfqKind>(rfq?.rfqKind ?? 'MINERAL');
  const [materialId, setMaterialId] = React.useState(rfq?.materialId ?? '');
  const [name, setName] = React.useState(rfq?.rfqProductName ?? '');
  const [categoryId, setCategoryId] = React.useState('');
  const [unitId, setUnitId] = React.useState(rfq?.unitId ?? '');
  const [quantity, setQuantity] = React.useState(rfq?.quantityRequired ?? '');
  const [duration, setDuration] = React.useState(rfq?.durationOfSupply ?? '');
  const [delivery, setDelivery] = React.useState(rfq?.deliveryPeriod ?? '');
  const [grade, setGrade] = React.useState(rfq?.purity_grade ?? '');
  const [moisture, setMoisture] = React.useState(rfq?.moisture_max == null ? '' : String(rfq.moisture_max));
  const [packaging, setPackaging] = React.useState(rfq?.packaging ?? '');
  const [sampling, setSampling] = React.useState(rfq?.sampling_method ?? '');
  const [payments, setPayments] = React.useState<string[]>(rfq?.selectedPayments ?? []);
  const [shipping, setShipping] = React.useState<string[]>(rfq?.selectedShippings ?? []);
  const [paymentText, setPaymentText] = React.useState(rfq?.paymentsTermsDescribed ?? '');
  const [shippingText, setShippingText] = React.useState(rfq?.shippingTermsDescribed ?? '');
  const [supplyType, setSupplyType] = React.useState(rfq?.inquiry_type ?? 'immediate');
  const [frequency, setFrequency] = React.useState(rfq?.recurring_frequency ?? '');
  const [months, setMonths] = React.useState(rfq?.recurring_duration == null ? '' : String(rfq.recurring_duration));
  const [urgency, setUrgency] = React.useState(rfq?.urgency_level ?? 'standard');
  const [inspection, setInspection] = React.useState(!!rfq?.is_inspection_required);
  const [shipment, setShipment] = React.useState(!!rfq?.is_shipment_included);
  const [fulfilment, setFulfilment] = React.useState(rfq?.fulfillment_type ?? '');
  const [locationType, setLocationType] = React.useState(rfq?.location_type ?? '');
  const [country, setCountry] = React.useState(rfq?.countryCode ?? COUNTRY_OPTIONS.find((c) => c.label === rfq?.productDestination)?.value ?? NIGERIA);
  const [region, setRegion] = React.useState(rfq?.selectedState ?? '');
  const [address, setAddress] = React.useState(rfq?.fullAddress ?? '');
  const [deadline, setDeadline] = React.useState(toDateInput(rfq?.bidding_deadline));
  const [description, setDescription] = React.useState(rfq?.rfqDescription ?? '');
  const [files, setFiles] = React.useState<File[]>([]);
  const [saving, setSaving] = React.useState(false);

  const materials = useGetMarketplaceMaterialsQuery();
  const tree = useGetCategoryTreeQuery();
  const units = useGetUnitChoicesQuery();
  const [create] = useCreateRFQMutation();
  const [edit] = useEditRFQMutation();
  const [addMedia] = useUpdateRfqMediaMutation();
  const [removeMedia] = useDeleteRfqMediaMutation();
  const { confirm, dialog } = useConfirm();

  const treeData = tree.data?.data ?? NO_CATEGORIES;
  const material = materials.data?.data.find((m) => m.id === materialId);
  const unit = units.data?.data.find((u) => u.id === unitId);
  const roots = React.useMemo(() => {
    if (kind === 'NON_MINERAL') return nonMineralRoots(treeData);
    // Already a mineral, so the choice starts one level below Minerals
    return mineralRoot(treeData)?.children ?? NO_CATEGORIES;
  }, [kind, treeData]);
  const chosenCategoryId = material?.categoryId ?? categoryId;
  const categoryNames = material?.categoryPath ?? [];
  const local = country === NIGERIA;

  // An old RFQ stores only the category's tag
  React.useEffect(() => {
    if (!rfq?.category_tag || categoryId || !treeData.length) return;
    const found = categoryByTag(treeData, rfq.category_tag);
    if (found && !found.children.length) setCategoryId(found.id);
  }, [rfq?.category_tag, categoryId, treeData]);

  const chooseMaterial = (id: string) => {
    setMaterialId(id);
    const picked = materials.data?.data.find((m) => m.id === id);
    // The name follows the list until the buyer has typed their own
    if (picked && (!name.trim() || materials.data?.data.some((m) => m.name === name))) setName(picked.name);
  };

  const stepErrors = (i: number, publishing = false): Record<string, string> => {
    const next: Record<string, string> = {};
    if (i === 0) {
      if (name.trim().length < 2) next.name = 'Type what you are looking for';
      if (!chosenCategoryId && !(editing && rfq?.category_tag && !categoryByTag(treeData, rfq.category_tag)?.children.length)) next.categoryId = 'Choose the category';
      if (!unitId && !rfq?.quantityMeasure) next.unitId = 'Choose the unit';
      if (!/^\d+(\.\d+)?$/.test(String(quantity)) || Number(quantity) <= 0) next.quantity = 'Enter how much you need';
    }
    if (i === 1) {
      if (!duration.trim()) next.duration = 'Say how long the supply should last';
      if (!delivery.trim()) next.delivery = 'Say how soon you need it';
      if (moisture !== '' && (Number(moisture) < 0 || Number(moisture) > 100)) next.moisture = 'Moisture is between 0 and 100';
      if (supplyType === 'recurring' && !frequency) next.frequency = 'Choose how often';
      if (supplyType === 'recurring' && !(Number(months) > 0)) next.months = 'Enter how many months';
      if (description.trim().length < 10) next.description = 'Describe what you need in at least 10 characters';
    }
    if (i === 2) {
      if (!country) next.country = 'Choose the country';
      if (publishing || published) {
        if (local && !region) next.region = 'Within Nigeria, choose the state';
        if (local && !address.trim()) next.address = 'Within Nigeria, enter the full address';
        if (!deadline && !(published && !rfq?.bidding_deadline)) next.deadline = 'Choose the last day for offers';
      }
      if (deadline && deadline < todayInput()) next.deadline = 'The deadline must be today or later';
    }
    return next;
  };

  const goTo = (target: number) => {
    if (target > step) {
      for (let i = step; i < target; i++) {
        const next = stepErrors(i);
        setErrors(next);
        if (Object.keys(next).length) return setStep(i);
      }
    }
    setErrors({});
    setFormError(undefined);
    setStep(target);
  };

  const fields = (): Record<string, unknown> => ({
    rfqKind: kind,
    materialId: materialId || null,
    unitId: unitId || null,
    ...(chosenCategoryId ? { categoryId: chosenCategoryId } : {}),
    rfqProductName: name.trim(),
    quantityRequired: String(quantity),
    quantityMeasure: unit?.symbol ?? unit?.code ?? rfq?.quantityMeasure ?? '',
    durationOfSupply: duration.trim(),
    deliveryPeriod: delivery.trim(),
    purity_grade: grade.trim() || null,
    moisture_max: moisture === '' ? null : Number(moisture),
    packaging: packaging.trim() || null,
    sampling_method: sampling.trim() || null,
    selectedPayments: payments,
    selectedShippings: shipping,
    paymentsTermsDescribed: paymentText.trim() || null,
    shippingTermsDescribed: shippingText.trim() || null,
    inquiry_type: supplyType,
    recurring_frequency: supplyType === 'recurring' ? frequency : null,
    recurring_duration: supplyType === 'recurring' ? Number(months) : null,
    urgency_level: urgency,
    is_inspection_required: inspection,
    is_shipment_included: shipment,
    fulfillment_type: fulfilment || null,
    location_type: locationType || null,
    productDestination: countryName(country),
    selectedCountryName: countryName(country),
    countryCode: country,
    selectedState: region || null,
    fullAddress: address.trim() || null,
    bidding_deadline: fromDateInput(deadline),
    rfqDescription: description.trim(),
  });

  const save = async (publish: boolean) => {
    for (let i = 0; i < 3; i++) {
      const next = stepErrors(i, publish);
      if (Object.keys(next).length) {
        setErrors(next);
        return setStep(i);
      }
    }
    setErrors({});
    setFormError(undefined);
    const ok = await confirm(
      editing
        ? { title: `Save ${name.trim()}?`, description: published ? 'Suppliers see the changes straight away.' : 'It stays a draft until you publish it.', confirmLabel: 'Save changes' }
        : publish
          ? { title: `Publish ${name.trim()}?`, description: 'Suppliers and MINMEG can see it and send offers until the deadline.', confirmLabel: 'Publish' }
          : { title: `Save ${name.trim()} as a draft?`, description: 'Only your company can see it until you publish it.', confirmLabel: 'Save draft' },
    );
    if (!ok) return;
    setSaving(true);
    try {
      if (editing) {
        await edit({ buyerId, rfqId: rfq.rfqId, rfqData: fields() }).unwrap();
        if (files.length) {
          const form = new FormData();
          for (const f of files) form.append('rfqAttachment', f);
          await addMedia({ buyerId, rfqId: rfq.rfqId, rfqData: form }).unwrap();
        }
        toast.success('RFQ updated');
        onDone(rfq.rfqId, published, name.trim());
        return;
      }
      const form = new FormData();
      for (const [key, value] of Object.entries({ ...fields(), status: publish ? 'published' : 'draft' })) {
        if (value === null || value === undefined) continue;
        form.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value));
      }
      for (const f of files) form.append('rfqAttachment', f);
      const res = await create({ buyerId, rfqData: form }).unwrap();
      const saved = (res as { data?: { rfqId?: string } }).data;
      if (!publish) toast.success('Draft saved');
      onDone(saved?.rfqId ?? '', publish, name.trim());
    } catch (err) {
      setFormError(toApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const pickFiles = async (list: FileList) => {
    const picked = await compressImages(list);
    const problem = rfqFileError([...files, ...picked], rfq?.attachments?.length ?? 0);
    if (problem) return setErrors({ files: problem });
    setFiles((all) => [...all, ...picked]);
    setErrors({});
  };

  const removeSaved = async (publicId?: string) => {
    if (!rfq || !publicId) return;
    const ok = await confirm({ title: 'Remove this file?', description: 'It is removed straight away.', confirmLabel: 'Remove', tone: 'error' });
    if (!ok) return;
    try {
      await removeMedia({ buyerId, rfqId: rfq.rfqId, publicId }).unwrap();
      toast.success('File removed');
    } catch (err) {
      setFormError(toApiError(err).message);
    }
  };

  if (materials.isLoading || units.isLoading || tree.isLoading) return <Skeleton className="h-96 w-full" />;

  const reviewRows: [string, string][] = [
    ['Name', name],
    ['Material', material?.name ?? 'Not from the list'],
    ['Quantity', `${quantity} ${unit?.symbol ?? rfq?.quantityMeasure ?? ''}`],
    ['Duration of supply', duration],
    ['Delivery period', delivery],
    ['Purity or grade', grade],
    ['Max moisture', moisture ? `${moisture}%` : ''],
    ['Packaging', packaging],
    ['Sampling method', sampling],
    ['Payment terms', payments.join(', ')],
    ['Shipping terms', shipping.join(', ')],
    ['Supply', supplyType === 'recurring' ? `Recurring, ${frequency}, ${months} months` : 'One time'],
    ['Urgency', urgency === 'urgent' ? 'Urgent' : 'Standard'],
    ['Inspection', inspection ? 'Requested' : 'Not requested'],
    ['Shipment', shipment ? 'Included' : 'Not included'],
    ['Fulfilment', optionLabel(FULFILMENT_OPTIONS, fulfilment)],
    ['Location type', optionLabel(LOCATION_TYPE_OPTIONS, locationType)],
    ['Destination', [address, region, countryName(country)].filter(Boolean).join(', ')],
    ['Bidding deadline', deadline],
    ['Description', description],
    ['New files', files.map((f) => f.name).join(', ')],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <ol aria-label="Steps" className="mb-6 flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => goTo(i)}
              aria-current={i === step ? 'step' : undefined}
              className={`min-h-10 rounded-full border px-3 text-sm font-medium ${i === step ? 'border-brand-green bg-brand-green-soft text-brand-green-dark' : 'border-hairline text-steel hover:text-ink'}`}
            >
              {i + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-5 rounded-xl border border-hairline bg-canvas p-4 md:p-6">
        {formError && <Alert severity="error">{formError}</Alert>}

        {step === 0 && (
          <>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 flex items-center gap-1 text-sm font-medium text-ink">
                What are you looking for?
                <FieldInfo label="what you are looking for">{INFO.kind}</FieldInfo>
              </legend>
              {(
                [
                  ['MINERAL', 'A mineral', 'Ore, concentrate, stone and so on'],
                  ['NON_MINERAL', 'Something else', 'Tools, protective equipment or a service'],
                ] as const
              ).map(([value, title, hint]) => (
                <label key={value} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-hairline px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="rfq-kind"
                    className="mt-1 h-4 w-4"
                    checked={kind === value}
                    onChange={() => {
                      setKind(value);
                      setMaterialId('');
                      setCategoryId('');
                    }}
                  />
                  <span>
                    <span className="block font-medium text-ink">{title}</span>
                    <span className="block text-xs text-steel">{hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            {kind === 'MINERAL' && (
              <FormField label="Material from our list" htmlFor="rfq-material" optional info={INFO.material}>
                <DropdownSelect id="rfq-material" searchable value={materialId} onValueChange={chooseMaterial} options={(materials.data?.data ?? []).map((m) => ({ value: m.id, label: m.categoryPath?.length ? `${m.name} — ${m.categoryPath.join(' › ')}` : m.name }))} placeholder="Not on the list" />
              </FormField>
            )}
            <FormField label="RFQ name" htmlFor="rfq-name" required info={INFO.name} error={errors.name}>
              <Input id="rfq-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={255} autoComplete="off" placeholder="e.g. Lithium ore, 200 t" />
            </FormField>
            {material ? (
              <dl aria-label="Categories" className="rounded-lg bg-surface p-3 text-sm">
                <dt className="text-xs font-medium uppercase text-steel">Suppliers find it under</dt>
                <dd className="text-ink">{categoryNames.join(' › ')}</dd>
              </dl>
            ) : (
              <CategoryPicker key={`${kind}-${roots.length}-${categoryChain(treeData, categoryId).length > 0}`} roots={roots} value={categoryId} error={errors.categoryId} onChange={setCategoryId} />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Unit" htmlFor="rfq-unit" required info={INFO.unit} error={errors.unitId} help={!unitId && rfq?.quantityMeasure ? `Now: ${rfq.quantityMeasure}` : undefined}>
                <DropdownSelect id="rfq-unit" searchable value={unitId} onValueChange={setUnitId} options={(units.data?.data ?? []).map((u) => ({ value: u.id, label: `${u.name ?? u.code} (${u.symbol})` }))} placeholder="Choose a unit" />
              </FormField>
              <FormField label={`Quantity required${unit ? ` (${unit.symbol})` : ''}`} htmlFor="rfq-quantity" required info={INFO.quantity} error={errors.quantity}>
                <Input id="rfq-quantity" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} autoComplete="off" />
              </FormField>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Duration of supply" htmlFor="rfq-duration" required info={INFO.duration} error={errors.duration}>
                <Input id="rfq-duration" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 2 months" autoComplete="off" />
              </FormField>
              <FormField label="Delivery period" htmlFor="rfq-delivery" required info={INFO.delivery} error={errors.delivery}>
                <Input id="rfq-delivery" value={delivery} onChange={(e) => setDelivery(e.target.value)} placeholder="e.g. 3 weeks" autoComplete="off" />
              </FormField>
              <FormField label="Purity or grade" htmlFor="rfq-grade" optional info={INFO.grade}>
                <Input id="rfq-grade" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. 95%+, Grade A" autoComplete="off" />
              </FormField>
              <FormField label="Max moisture (%)" htmlFor="rfq-moisture" optional info={INFO.moisture} error={errors.moisture}>
                <Input id="rfq-moisture" inputMode="decimal" value={moisture} onChange={(e) => setMoisture(e.target.value)} autoComplete="off" />
              </FormField>
              <FormField label="Packaging" htmlFor="rfq-packaging" optional info={INFO.packaging}>
                <SelectWithCustom id="rfq-packaging" value={packaging} onChange={setPackaging} options={PACKAGING_LIST} customLabel="Your packaging" customPlaceholder="e.g. 25 kg woven bags" />
              </FormField>
              <FormField label="Sampling method" htmlFor="rfq-sampling" optional info={INFO.sampling}>
                <SelectWithCustom id="rfq-sampling" value={sampling} onChange={setSampling} options={SAMPLING_OPTIONS} customLabel="Your sampling method" customPlaceholder="e.g. Independent lab" />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <MultiCheckboxSelect label="Payment terms (Optional)" options={paymentTerms.map((t) => ({ value: t.code, label: `${t.code} - ${t.name}` }))} value={payments} onChange={setPayments} placeholder="Choose" />
              <MultiCheckboxSelect label="Shipping terms (Optional)" options={shippingTerms.map((t) => ({ value: t.code, label: `${t.code} - ${t.name}` }))} value={shipping} onChange={setShipping} placeholder="Choose" />
              <FormField label="Describe payment terms" htmlFor="rfq-payment-text" optional>
                <Textarea id="rfq-payment-text" value={paymentText} onChange={(e) => setPaymentText(e.target.value)} rows={2} />
              </FormField>
              <FormField label="Describe shipping terms" htmlFor="rfq-shipping-text" optional>
                <Textarea id="rfq-shipping-text" value={shippingText} onChange={(e) => setShippingText(e.target.value)} rows={2} />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Supply" htmlFor="rfq-supply" info={INFO.supply}>
                <DropdownSelect id="rfq-supply" searchable={false} value={supplyType} onValueChange={(v) => setSupplyType(v as 'immediate' | 'recurring')} options={[{ value: 'immediate', label: 'One time' }, { value: 'recurring', label: 'Recurring' }]} />
              </FormField>
              <FormField label="Urgency" htmlFor="rfq-urgency" info={INFO.urgency}>
                <DropdownSelect id="rfq-urgency" searchable={false} value={urgency} onValueChange={(v) => setUrgency(v as 'standard' | 'urgent')} options={[{ value: 'standard', label: 'Standard' }, { value: 'urgent', label: 'Urgent' }]} />
              </FormField>
              {supplyType === 'recurring' && (
                <>
                  <FormField label="How often" htmlFor="rfq-frequency" required info={INFO.frequency} error={errors.frequency}>
                    <DropdownSelect id="rfq-frequency" searchable={false} value={frequency} onValueChange={setFrequency} options={[{ value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]} placeholder="Choose" />
                  </FormField>
                  <FormField label="Duration (months)" htmlFor="rfq-months" required info={INFO.months} error={errors.months}>
                    <Input id="rfq-months" inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value.replace(/\D/g, ''))} autoComplete="off" />
                  </FormField>
                </>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <p className="flex items-center gap-1 text-sm font-medium text-ink">Services (Optional)<FieldInfo label="services">{INFO.services}</FieldInfo></p>
              <label className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-hairline px-3 py-2 text-sm"><span>Request inspection</span><Switch aria-label="Request inspection" checked={inspection} onChange={(e) => setInspection(e.target.checked)} /></label>
              <label className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-hairline px-3 py-2 text-sm"><span>Include shipment</span><Switch aria-label="Include shipment" checked={shipment} onChange={(e) => setShipment(e.target.checked)} /></label>
            </div>
            <FormField label="RFQ description" htmlFor="rfq-description" required info={INFO.description} error={errors.description}>
              <Textarea id="rfq-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </FormField>
            <div>
              <p className="mb-2 flex items-center gap-1 text-sm font-medium text-ink">Attachments (Optional)<FieldInfo label="attachments">{INFO.files}</FieldInfo></p>
              <FileDropZone label="Add attachments" hint="PNG, JPEG, WEBP or PDF up to 5 MB, MP4 up to 15 MB. Up to 5 files." accept="image/png,image/jpeg,image/webp,application/pdf,video/mp4" multiple onFiles={pickFiles} />
              {errors.files && <p className="mt-1 text-sm text-semantic-error-text">{errors.files}</p>}
              {(rfq?.attachments?.length ?? 0) > 0 && (
                <ul aria-label="Current attachments" className="mt-2 flex flex-col gap-1 text-sm">
                  {rfq?.attachments?.map((a) => (
                    <li key={a.url} className="flex items-center justify-between gap-2 rounded-lg border border-hairline px-3 py-2">
                      <a className="truncate text-brand-green-dark underline" href={a.url} target="_blank" rel="noopener noreferrer">{a.url.split('/').pop()}</a>
                      <Button type="button" variant="text" size="sm" onClick={() => removeSaved(a.publicId)}>Remove</Button>
                    </li>
                  ))}
                </ul>
              )}
              {files.length > 0 && (
                <ul aria-label="Attachments to add" className="mt-2 flex flex-col gap-1 text-sm">
                  {files.map((f, i) => (
                    <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-lg border border-hairline px-3 py-2">
                      <span className="truncate">{f.name}</span>
                      <Button type="button" variant="text" size="sm" onClick={() => setFiles((all) => all.filter((_, x) => x !== i))}>Remove</Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Destination country" htmlFor="rfq-country" required info={INFO.country} error={errors.country}>
                <DropdownSelect
                  id="rfq-country"
                  searchable
                  value={country}
                  onValueChange={(v) => {
                    setCountry(v);
                    setRegion('');
                  }}
                  options={COUNTRY_OPTIONS}
                  placeholder="Choose the country"
                />
              </FormField>
              <FormField label="State" htmlFor="rfq-state" required={local} optional={!local} info={INFO.state} error={errors.region}>
                <DropdownSelect id="rfq-state" searchable value={region} onValueChange={setRegion} options={stateOptions(country)} placeholder="Choose the state" />
              </FormField>
            </div>
            <FormField label="Full address" htmlFor="rfq-address" required={local} optional={!local} info={INFO.address} error={errors.address}>
              <Textarea id="rfq-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Bidding deadline" htmlFor="rfq-deadline" required info={INFO.deadline} error={errors.deadline} help={published ? undefined : 'A draft can be saved without one'}>
                <Input id="rfq-deadline" type="date" min={todayInput()} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </FormField>
              <FormField label="Fulfilment" htmlFor="rfq-fulfilment" optional info={INFO.fulfilment}>
                <DropdownSelect id="rfq-fulfilment" searchable={false} value={fulfilment} onValueChange={setFulfilment} options={FULFILMENT_OPTIONS} placeholder="Not set" />
              </FormField>
              <FormField label="Location type" htmlFor="rfq-location-type" optional info={INFO.location}>
                <DropdownSelect id="rfq-location-type" searchable={false} value={locationType} onValueChange={setLocationType} options={LOCATION_TYPE_OPTIONS} placeholder="Not set" />
              </FormField>
            </div>
          </>
        )}

        {step === 3 && (
          <dl aria-label="Review" className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {reviewRows.filter(([, value]) => value).map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs font-medium uppercase text-steel">{label}</dt>
                <dd className="break-words text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-hairline pt-4 sm:flex-row sm:justify-between">
          <Button type="button" variant="outlined" color="secondary" onClick={step === 0 ? onCancel : () => goTo(step - 1)} disabled={saving}>{step === 0 ? 'Cancel' : 'Back'}</Button>
          {step < 3 ? (
            <Button type="button" onClick={() => goTo(step + 1)}>Next</Button>
          ) : editing ? (
            <Button type="button" onClick={() => save(false)} loading={saving}>Save changes</Button>
          ) : (
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outlined" onClick={() => save(false)} disabled={saving}>Save draft</Button>
              <Button type="button" onClick={() => save(true)} loading={saving}>Publish</Button>
            </div>
          )}
        </div>
      </div>
      {dialog}
    </div>
  );
}
