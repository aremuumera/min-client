'use client';

import * as React from 'react';
import { Eye, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, Button, DropdownSelect, FileDropZone, FormField, Input, MultiCheckboxSelect, FieldInfo, QuantityInput, RichText, SelectWithCustom, SideSheet, Skeleton, Textarea, useConfirm } from '@/components/ui';
import { TextEditor } from '@/components/core/text-editor/text-editor';
import { CategoryPicker } from '@/components/listings/category-picker';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { BATCH_CODE_PATTERN, PHYSICAL_FORMS, REGISTER_SOURCES, batchOptions, formatQuantity, fromMicro, isPositive, toMicro } from '@/lib/batches';
import { FIELD_INFO } from '@/lib/help/listing-fields';
import { MIN_IMAGES, MONEY_PATTERN, UNITS_NOT_FOR_SALE, asList, attachmentError, canBackListing, categoryChain, categoryPathOf, formatMoney, isBlankText, isNonMineral, mediaError, nonMineralRoots, withCommas, type CategoryNode, type DescriptionSection, type Listing, type ListingKind, type ListingMedia } from '@/lib/listings';
import { PACKAGING_OPTIONS, SAMPLING_OPTIONS, paymentTerms, shippingTerms } from '@/lib/trade-terms';
import { useCreateBatchMutation, useGetBatchesQuery, useGetUnitChoicesQuery } from '@/redux/features/batches/batches_api';
import { useGetLocationsQuery } from '@/redux/features/locations/locations_api';
import { useAddListingBatchMutation, useAddListingMediaMutation, useChangeListingStatusMutation, useCreateListingMutation, useGetCategoryTreeQuery, useGetMarketplaceMaterialsQuery, useGetMaterialMeasureQuery, useRemoveListingMediaMutation, useUpdateListingMutation } from '@/redux/features/listings/listings_api';
import { compressImages } from '@/lib/images/compress';

const STEPS = ["What you're selling", 'Details', 'Price and terms', 'Review'] as const;
const SUMMARY_LIMIT = 500;
const NO_CATEGORIES: readonly CategoryNode[] = [];
const PACKAGING_LIST = PACKAGING_OPTIONS.filter((o) => o.value !== 'Custom');
type StockMode = 'existing' | 'new' | 'later';
type Section = DescriptionSection & { key: number };

export interface ListingFormProps {
  /** Edit this listing; null to create */
  listing: Listing | null;
  /** Staff only: the company the listing belongs to. Merchants act for their own */
  ownerId?: string;
  ownerField?: React.ReactNode;
  ownerError?: string;
  /** Under the material list: what to do when a material is missing */
  materialHelp?: React.ReactNode;
  /** Where sites are added */
  sitesHref: string;
  onDone: (id: string, published: boolean, name: string) => void;
  onCancel: () => void;
}

const mediaId = (m: ListingMedia) => String(m.imageUuid ?? m.id ?? m.url);
const sizeOf = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;
const startingSections = (v: unknown): Section[] => {
  const saved = Array.isArray(v) ? (v as DescriptionSection[]).filter((s) => s && typeof s.header === 'string') : [];
  return (saved.length ? saved : [{ header: '', description: '' }]).map((s, key) => ({ ...s, key }));
};

/**
 * The 4-step listing form (step 2.6 D2, decision #98). A mineral takes its categories from its material
 * and its stock from batches. A non-mineral picks its categories and types its quantity. Saving creates
 * a draft, adds its files, then publishes if asked, so a listing is never live without its pictures.
 */
export function ListingForm({ listing, ownerId, ownerField, ownerError, materialHelp, sitesHref, onDone, onCancel }: ListingFormProps) {
  const editing = !!listing;
  const openBatches = (listing?.batches ?? []).length;
  const materialFixed = editing && openBatches > 0;

  const [step, setStep] = React.useState(0);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string>();
  const [saving, setSaving] = React.useState(false);
  const [previewing, setPreviewing] = React.useState(false);
  const savedId = React.useRef<string | null>(listing?.id ?? null);
  const ownerOf = React.useRef<string | null>(listing?.supplierId ?? ownerId ?? null);
  const nextSection = React.useRef(100);

  // Step 1
  const [kind, setKind] = React.useState<ListingKind>(listing?.listingKind ?? 'MINERAL');
  const nonMineral = kind === 'NON_MINERAL';
  const [materialId, setMaterialId] = React.useState(listing?.materialId ?? '');
  const [categoryId, setCategoryId] = React.useState(isNonMineral(listing) ? (listing?.categoryId ?? '') : '');
  const [quantity, setQuantity] = React.useState(isNonMineral(listing) ? String(listing?.quantity ?? '') : '');
  const [unitId, setUnitId] = React.useState(listing?.unitId ?? '');
  const [mode, setMode] = React.useState<StockMode>(editing ? 'later' : 'existing');
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [newQuantity, setNewQuantity] = React.useState('');
  const [sourceType, setSourceType] = React.useState('');
  const [originId, setOriginId] = React.useState('');
  const [newCode, setNewCode] = React.useState('');
  const [newForm, setNewForm] = React.useState('');
  const [newPurity, setNewPurity] = React.useState('');

  // Step 2
  const [name, setName] = React.useState(listing?.product_name ?? '');
  const [summary, setSummary] = React.useState(listing?.productHeaderDescription ?? '');
  const [sections, setSections] = React.useState<Section[]>(() => startingSections(listing?.productDetailDescription));
  const [images, setImages] = React.useState<File[]>([]);
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [removedMedia, setRemovedMedia] = React.useState<{ kind: 'images' | 'attachments'; id: string }[]>([]);
  const [color, setColor] = React.useState(listing?.color ?? '');
  const [composition, setComposition] = React.useState(listing?.composition ?? '');
  const [density, setDensity] = React.useState(listing?.density ?? '');
  const [hardness, setHardness] = React.useState(listing?.hardness ?? '');
  const [moisture, setMoisture] = React.useState(listing?.moisture_max != null ? String(listing.moisture_max) : '');
  const [packaging, setPackaging] = React.useState(listing?.packaging ?? '');
  const [sampling, setSampling] = React.useState(listing?.sampling_method ?? '');

  // Step 3
  const [price, setPrice] = React.useState(listing ? String(listing.real_price ?? '') : '');
  const [prevPrice, setPrevPrice] = React.useState(listing?.prev_price ? String(listing.prev_price) : '');
  const [minimum, setMinimum] = React.useState(listing?.minimum_order_quantity ? String(Number(listing.minimum_order_quantity)) : '');
  const [payments, setPayments] = React.useState<string[]>(asList(listing?.selected_payments));
  const [shipping, setShipping] = React.useState<string[]>(asList(listing?.selected_shipping));
  const [paymentText, setPaymentText] = React.useState(listing?.paymentsTermsDescribed ?? '');
  const [shippingText, setShippingText] = React.useState(listing?.shippingTermsDescribed ?? '');
  const [delivery, setDelivery] = React.useState(listing?.delivery_period ?? '');
  const [siteId, setSiteId] = React.useState(listing?.locationId ?? '');
  const [supplyType, setSupplyType] = React.useState(listing?.supply_type ?? 'immediate');
  const [frequency, setFrequency] = React.useState(listing?.frequency ?? '');
  const [duration, setDuration] = React.useState(listing?.duration ?? '');
  const [tradeScope, setTradeScope] = React.useState(listing?.trade_scope ?? 'local');
  const [fulfillment, setFulfillment] = React.useState(listing?.fulfillment_type ?? '');

  const materials = useGetMarketplaceMaterialsQuery(undefined, { refetchOnMountOrArgChange: true });
  const units = useGetUnitChoicesQuery();
  const tree = useGetCategoryTreeQuery();
  const measure = useGetMaterialMeasureQuery(materialId, { skip: nonMineral || !materialId });
  const locations = useGetLocationsQuery({ active: true, limit: 100, ...(ownerId ? { organizationId: ownerId } : {}) });
  const batches = useGetBatchesQuery({ materialId, limit: 100, ...(ownerId ? { ownerOrganizationId: ownerId } : {}) }, { skip: nonMineral || !materialId || !unitId || mode !== 'existing' });
  const [create] = useCreateListingMutation();
  const [update] = useUpdateListingMutation();
  const [changeStatus] = useChangeListingStatusMutation();
  const [addBatch] = useAddListingBatchMutation();
  const [createBatch] = useCreateBatchMutation();
  const [addMedia] = useAddListingMediaMutation();
  const [removeMedia] = useRemoveListingMediaMutation();
  const listingKey = useIdempotencyKey();
  const batchKey = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();

  const effective = nonMineral ? null : measure.data?.data.effectiveMaterialType;
  const measures = effective ? [effective.measurementTypeId, ...(effective.additionalMeasurementTypeIds ?? [])] : [];
  const unitChoices = (units.data?.data ?? []).filter((u) => (nonMineral ? !u.measurementType || !UNITS_NOT_FOR_SALE.includes(u.measurementType.code) : !measures.length || !u.measurementTypeId || measures.includes(u.measurementTypeId)));
  const unit = units.data?.data.find((u) => u.id === unitId);
  const symbol = unit?.symbol ?? listing?.measure ?? '';
  const material = materials.data?.data.find((m) => m.id === materialId);
  const categoryRoots = tree.data?.data ? nonMineralRoots(tree.data.data) : NO_CATEGORIES;
  const usable = (batches.data?.data ?? []).filter((b) => canBackListing(b, unitId));
  const pickedTotal = usable.filter((b) => picked.has(b.id)).reduce((sum, b) => sum + toMicro(b.availableQuantity), BigInt(0));
  const siteOptions = (locations.data?.data ?? []).map((l) => ({ value: l.id, label: l.name }));

  // A unit that doesn't measure the chosen material can't be saved
  React.useEffect(() => {
    if (unitId && units.data && !materialFixed && !unitChoices.some((u) => u.id === unitId)) setUnitId('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measures.join(), kind, units.data]);

  const existingImages = (listing?.images ?? []).filter((m) => !removedMedia.some((r) => r.kind === 'images' && r.id === mediaId(m)));
  const existingAttachments = (listing?.attachments ?? []).filter((m) => !removedMedia.some((r) => r.kind === 'attachments' && r.id === mediaId(m)));
  const pictureCount = existingImages.length + images.length;
  const stockText = nonMineral
    ? quantity !== '' && Number(quantity) > 0 ? formatQuantity(quantity, symbol) : null
    : mode === 'existing' && picked.size ? formatQuantity(fromMicro(pickedTotal), symbol) : mode === 'new' && isPositive(newQuantity) ? formatQuantity(newQuantity, symbol) : editing && openBatches ? formatQuantity(listing?.availableQuantity, symbol) : null;
  const filledSections = sections.filter((s) => s.header.trim() || !isBlankText(s.description));
  const categoryNames = nonMineral ? chainNames(categoryRoots, categoryId) : (material?.categoryPath ?? (listing ? categoryPathOf(listing) : []));

  const stepErrors = (index: number): Record<string, string> => {
    const next: Record<string, string> = {};
    if (index === 0) {
      if (!editing && ownerError) next.owner = ownerError;
      if (!unitId) next.unitId = 'Choose the unit';
      if (nonMineral) {
        if (!categoryId) next.categoryId = 'Choose down to the most specific category';
        if (!/^\d+(\.\d{1,6})?$/.test(quantity)) next.quantity = 'Enter a number, with up to 6 decimal places';
      } else {
        if (!materialId) next.materialId = 'Choose the material';
        if (mode === 'existing' && !picked.size && !editing) next.stock = 'Tick at least one batch, or choose another option';
        if (mode === 'new') {
          if (!isPositive(newQuantity)) next.newQuantity = 'Enter the quantity you physically have';
          if (!sourceType) next.sourceType = 'Say where it came from';
          if (newCode && !BATCH_CODE_PATTERN.test(newCode)) next.newCode = 'Use 2–64 capital letters, numbers, - and _';
          if (newPurity && (Number(newPurity) < 0 || Number(newPurity) > 100)) next.newPurity = 'Purity is 0 to 100';
        }
      }
    }
    if (index === 1) {
      if (!name.trim()) next.name = 'Enter a name';
      if (!summary.trim()) next.summary = 'Write a short description';
      if (moisture && (Number(moisture) < 0 || Number(moisture) > 100)) next.moisture = 'Moisture is 0 to 100';
      if (filledSections.some((s) => !s.header.trim() || isBlankText(s.description))) next.sections = 'Give each section a heading and text, or remove it';
    }
    if (index === 2) {
      if (!MONEY_PATTERN.test(price) || Number(price) <= 0) next.price = 'Enter a price with up to 2 decimals';
      if (prevPrice && !MONEY_PATTERN.test(prevPrice)) next.prevPrice = 'Enter a price with up to 2 decimals';
      if (minimum && !isPositive(minimum)) next.minimum = 'Enter a number above 0, or leave it empty';
      if (!payments.length) next.payments = 'Choose at least one';
      if (!shipping.length) next.shipping = 'Choose at least one';
      if (!delivery.trim()) next.delivery = 'Say how long delivery takes';
      if (supplyType === 'recurring' && !frequency) next.frequency = 'Choose how often';
    }
    return next;
  };

  // A message goes as soon as its field is fixed
  React.useEffect(() => {
    setErrors((prev) => {
      if (!Object.keys(prev).length) return prev;
      const now = stepErrors(step);
      const kept = Object.fromEntries(Object.entries(prev).filter(([k]) => k in now || k === 'images' || k === 'attachments'));
      return Object.keys(kept).length === Object.keys(prev).length ? prev : kept;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, materialId, categoryId, quantity, unitId, mode, picked, newQuantity, sourceType, newCode, newPurity, name, summary, moisture, sections, price, prevPrice, minimum, payments, shipping, delivery, frequency, ownerError]);

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

  const fields = () => ({
    productName: name.trim(),
    productHeaderDescription: summary.trim(),
    productDetailDescription: filledSections.length ? filledSections.map((s) => ({ header: s.header.trim(), description: s.description.trim() })) : null,
    realPrice: price,
    prevPrice: prevPrice || null,
    unitCurrency: 'NGN',
    minimumOrderQuantity: minimum || null,
    deliveryPeriod: delivery.trim() || null,
    paymentsTermsDescribed: paymentText.trim() || null,
    shippingTermsDescribed: shippingText.trim() || null,
    selectedPayments: payments,
    selectedShipping: shipping,
    packaging: packaging.trim() || null,
    samplingMethod: sampling.trim() || null,
    moistureMax: moisture === '' ? null : Number(moisture),
    color: color.trim() || null,
    composition: composition.trim() || null,
    density: density.trim() || null,
    hardness: hardness.trim() || null,
    supplyType,
    frequency: supplyType === 'recurring' ? frequency || null : null,
    duration: supplyType === 'recurring' ? duration.trim() || null : null,
    tradeScope,
    fulfillmentType: fulfillment || null,
    locationId: siteId || null,
  });

  const newBatch = () => ({
    initialQuantity: newQuantity,
    quantityUnitId: unitId,
    sourceType,
    sourceLocationId: originId || null,
    ...(newCode ? { batchCode: newCode } : {}),
    ...(newForm ? { physicalForm: newForm } : {}),
    ...(newPurity ? { purity: newPurity } : {}),
  });

  const save = async (publish: boolean) => {
    for (let i = 0; i < 3; i++) {
      const next = stepErrors(i);
      if (Object.keys(next).length) {
        setErrors(next);
        return setStep(i);
      }
    }
    if (publish && pictureCount < MIN_IMAGES) return setFormError(`Add at least ${MIN_IMAGES} pictures to publish. You have ${pictureCount}. You can save it as a draft for now.`);
    if (publish && !siteId) return setFormError('Choose where this is offered from to publish. You can save it as a draft for now.');
    if (publish && nonMineral && Number(quantity) <= 0) return setFormError('Enter the quantity available to publish. You can save it as a draft for now.');
    if (publish && !nonMineral && !picked.size && mode !== 'new' && !openBatches) return setFormError('Add stock to publish. You can save it as a draft for now.');
    setFormError(undefined);

    const ok = await confirm(
      publish
        ? { title: `Publish ${name.trim()}?`, description: `Buyers will see it${stockText ? `, with ${stockText} available` : ''}, at ${formatMoney(price)} per ${symbol} plus platform fees.`, confirmLabel: 'Publish' }
        : { title: `Save ${name.trim()} as a draft?`, description: "Buyers won't see it until you publish.", confirmLabel: 'Save draft' },
    );
    if (!ok) return;

    setSaving(true);
    let id = savedId.current;
    try {
      if (!id) {
        const res = await create({
          ...fields(),
          listingKind: kind,
          unitId,
          ...(ownerId ? { ownerOrganizationId: ownerId } : {}),
          ...(nonMineral
            ? { categoryId, quantity: Number(quantity) }
            : { materialId, ...(mode === 'existing' ? { batchIds: [...picked] } : {}), ...(mode === 'new' ? { newBatch: newBatch() } : {}) }),
          idempotencyKey: listingKey.key,
        }).unwrap();
        listingKey.done();
        id = res.data.id;
        savedId.current = id;
        ownerOf.current = res.data.supplierId;
      } else if (nonMineral) {
        await update({ id, ...fields(), unitId, categoryId, quantity: Number(quantity) }).unwrap();
      } else {
        await update({ id, ...fields(), ...(materialFixed ? {} : { materialId, unitId }) }).unwrap();
        if (mode === 'existing') for (const batchId of picked) await addBatch({ id, batchId }).unwrap();
        if (mode === 'new') {
          const batch = await createBatch({ ...newBatch(), materialId, ...(ownerId ? { ownerOrganizationId: ownerId } : {}), batchType: 'INITIAL', idempotencyKey: batchKey.key }).unwrap();
          batchKey.done();
          await addBatch({ id, batchId: batch.data.id }).unwrap();
        }
      }
      const supplierId = ownerOf.current!;
      for (const r of removedMedia) await removeMedia({ supplierId, id, kind: r.kind, mediaId: r.id }).unwrap();
      setRemovedMedia([]);
      if (images.length) await addMedia({ supplierId, id, kind: 'images', files: images }).unwrap();
      setImages([]);
      if (attachments.length) await addMedia({ supplierId, id, kind: 'attachments', files: attachments }).unwrap();
      setAttachments([]);
      if (publish && listing?.status !== 'published') await changeStatus({ id, action: 'publish' }).unwrap();
      toast.success(publish ? `${name.trim()} is published` : 'Saved');
      onDone(id, publish || listing?.status === 'published', name.trim());
    } catch (err) {
      const apiError = toApiError(err);
      if (Object.keys(apiError.fields).length) setErrors(apiError.fields);
      setFormError(savedId.current && !editing ? `Your listing was saved as a draft, but this step failed: ${apiError.message}` : apiError.message);
    } finally {
      setSaving(false);
    }
  };

  const pickFiles = async (which: 'images' | 'attachments', list: FileList) => {
    const files = which === 'images' ? await compressImages(list) : Array.from(list); // attachments are documents: never changed
    if (which === 'images') {
      const problem = mediaError([...images, ...files], existingImages.some((m) => m.type === 'video'));
      if (problem) return setErrors({ images: problem });
      setImages((all) => [...all, ...files]);
    } else {
      const problem = attachmentError(files);
      if (problem) return setErrors({ attachments: problem });
      setAttachments((all) => [...all, ...files]);
    }
    setErrors({});
  };

  if (materials.isLoading || units.isLoading || tree.isLoading) return <Skeleton className="h-96 w-full" />;

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
            {!editing && ownerField}
            {errors.owner && <p className="text-sm text-semantic-error-text">{errors.owner}</p>}

            {!editing && (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 flex items-center gap-1 text-sm font-medium text-ink">
                  What are you selling?
                  <FieldInfo label="what you are selling">{FIELD_INFO.kind}</FieldInfo>
                </legend>
                {(
                  [
                    ['MINERAL', 'A mineral', 'Ore, concentrate, stone and so on, traced through batches'],
                    ['NON_MINERAL', 'Something else', 'Tools, protective equipment or a service. No batch needed'],
                  ] as const
                ).map(([value, title, hint]) => (
                  <label key={value} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-hairline px-3 py-2 text-sm">
                    <input type="radio" name="listing-kind" className="mt-1 h-4 w-4" checked={kind === value} onChange={() => { setKind(value); setUnitId(''); }} />
                    <span>
                      <span className="block font-medium text-ink">{title}</span>
                      <span className="block text-xs text-steel">{hint}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}

            {nonMineral ? (
              <>
                <CategoryPicker key={categoryRoots.length} roots={categoryRoots} value={categoryId} error={errors.categoryId} onChange={setCategoryId} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Unit" htmlFor="listing-unit" required info={FIELD_INFO.unit} error={errors.unitId}>
                    <DropdownSelect id="listing-unit" searchable value={unitId} onValueChange={setUnitId} options={unitChoices.map((u) => ({ value: u.id, label: `${u.name ?? u.code} (${u.symbol})` }))} placeholder="Choose a unit" />
                  </FormField>
                  <FormField label={`Quantity available${symbol ? ` (${symbol})` : ''}`} htmlFor="listing-quantity" required info={FIELD_INFO.typedQuantity} error={errors.quantity}>
                    <Input id="listing-quantity" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/[^\d.]/g, ''))} autoComplete="off" />
                  </FormField>
                </div>
              </>
            ) : (
              <>
                <FormField label="Material" htmlFor="listing-material" required error={errors.materialId} info={FIELD_INFO.material} help={materialFixed ? 'Fixed while batches are linked' : undefined}>
                  <DropdownSelect id="listing-material" searchable value={materialId} disabled={materialFixed} onValueChange={(v) => { setMaterialId(v); setPicked(new Set()); }} options={(materials.data?.data ?? []).map((m) => ({ value: m.id, label: m.categoryPath?.length ? `${m.name} — ${m.categoryPath.join(' › ')}` : m.name }))} placeholder="Search for a material" />
                </FormField>
                {materialHelp}
                {categoryNames.length > 0 && (
                  <dl aria-label="Categories" className="rounded-lg bg-surface p-3 text-sm">
                    <dt className="flex items-center gap-1 text-xs font-medium uppercase text-steel">
                      Buyers find it under
                      <FieldInfo label="categories">{FIELD_INFO.categories}</FieldInfo>
                    </dt>
                    <dd className="text-ink" data-testid="listing-categories">{categoryNames.join(' › ')}</dd>
                  </dl>
                )}
                <FormField label="Unit" htmlFor="listing-unit" required error={errors.unitId} info={FIELD_INFO.unit}>
                  <DropdownSelect id="listing-unit" searchable value={unitId} disabled={materialFixed} onValueChange={(v) => { setUnitId(v); setPicked(new Set()); }} options={unitChoices.map((u) => ({ value: u.id, label: `${u.name ?? u.code} (${u.symbol})` }))} placeholder="Choose a unit" />
                </FormField>
                {editing && openBatches > 0 && <p className="text-sm text-steel">{openBatches === 1 ? 'One batch is' : `${openBatches} batches are`} linked, with {formatQuantity(listing?.availableQuantity, symbol)} available. Manage them from the listing&apos;s Stock tab, or add more below.</p>}

                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1 flex items-center gap-1 text-sm font-medium text-ink">
                    Where the stock comes from
                    <FieldInfo label="where the stock comes from">{FIELD_INFO.stock}</FieldInfo>
                  </legend>
                  {(
                    [
                      ['existing', 'Choose from my inventory', 'Batches you have already registered'],
                      ['new', 'Add new stock', 'MINMEG registers it as a batch in your inventory'],
                      ['later', editing ? 'No change' : 'Add stock later', editing ? 'Keep the stock as it is' : "Save a draft. It can't be published without stock"],
                    ] as const
                  ).map(([value, title, hint]) => (
                    <label key={value} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-hairline px-3 py-2 text-sm">
                      <input type="radio" name="stock-mode" className="mt-1 h-4 w-4" checked={mode === value} onChange={() => setMode(value)} />
                      <span>
                        <span className="block font-medium text-ink">{title}</span>
                        <span className="block text-xs text-steel">{hint}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
                {errors.stock && <p className="text-sm text-semantic-error-text">{errors.stock}</p>}

                {mode === 'existing' &&
                  (!materialId || !unitId ? (
                    <p className="text-sm text-steel">Choose the material and unit to see your batches.</p>
                  ) : batches.isLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : usable.length === 0 ? (
                    <Alert severity="info">No batch of {material?.name ?? 'this material'} in {symbol} is free to list. Batches on hold, ended, empty, or on another active listing aren&apos;t shown. Use &quot;Add new stock&quot; instead.</Alert>
                  ) : (
                    <fieldset className="flex flex-col gap-2">
                      <legend className="mb-1 text-sm font-medium text-ink">Batches to list (each is listed whole)</legend>
                      {usable.map((b) => (
                        <label key={b.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-hairline px-3 py-2 text-sm text-ink">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={picked.has(b.id)}
                            onChange={() =>
                              setPicked((prev) => {
                                const next = new Set(prev);
                                if (next.has(b.id)) next.delete(b.id);
                                else next.add(b.id);
                                return next;
                              })
                            }
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {b.batchCode}
                            {b.currentLocation?.name ? ` · ${b.currentLocation.name}` : ''}
                          </span>
                          <span className="text-steel">{formatQuantity(b.availableQuantity, b.unit?.symbol)}</span>
                        </label>
                      ))}
                      <p className="text-sm font-medium text-ink" data-testid="listing-stock-total">Buyers will see: {formatQuantity(fromMicro(pickedTotal), symbol)}</p>
                      <p className="text-xs text-steel">To list only part of a batch, split it in Inventory first.</p>
                    </fieldset>
                  ))}

                {mode === 'new' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label={`Quantity${symbol ? ` (${symbol})` : ''}`} htmlFor="listing-new-quantity" required error={errors.newQuantity} info={FIELD_INFO.newQuantity}>
                      <QuantityInput id="listing-new-quantity" value={newQuantity} onChange={setNewQuantity} />
                    </FormField>
                    <FormField label="Where it came from" htmlFor="listing-new-source" required error={errors.sourceType} info={FIELD_INFO.source}>
                      <DropdownSelect id="listing-new-source" value={sourceType} onValueChange={setSourceType} options={batchOptions(REGISTER_SOURCES)} placeholder="Choose one" />
                    </FormField>
                    <FormField label="Origin site" htmlFor="listing-new-origin" optional info={FIELD_INFO.origin}>
                      <DropdownSelect id="listing-new-origin" value={originId} onValueChange={setOriginId} options={siteOptions} placeholder="Not recorded" />
                    </FormField>
                    <FormField label="Physical form" htmlFor="listing-new-form" optional info={FIELD_INFO.physicalForm}>
                      <DropdownSelect id="listing-new-form" value={newForm} onValueChange={setNewForm} options={batchOptions(PHYSICAL_FORMS)} placeholder="Not recorded" />
                    </FormField>
                    <FormField label="Purity (%)" htmlFor="listing-new-purity" optional error={errors.newPurity} info={FIELD_INFO.purity}>
                      <QuantityInput id="listing-new-purity" value={newPurity} onChange={setNewPurity} />
                    </FormField>
                    <FormField label="Batch code" htmlFor="listing-new-code" optional error={errors.newCode} info={FIELD_INFO.batchCode}>
                      <Input id="listing-new-code" value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} maxLength={64} autoComplete="off" />
                    </FormField>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <FormField label="Name" htmlFor="listing-name" required error={errors.name} info={FIELD_INFO.name}>
              <Input id="listing-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={255} autoComplete="off" />
            </FormField>
            <FormField label="Short description" htmlFor="listing-summary" required error={errors.summary} info={FIELD_INFO.summary} help={`${SUMMARY_LIMIT - summary.length} characters remaining`}>
              <Textarea id="listing-summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} maxLength={SUMMARY_LIMIT} />
            </FormField>

            <section className="flex flex-col gap-2">
              <h3 className="flex items-center gap-1 text-sm font-medium text-ink">
                Pictures and video
                <FieldInfo label="pictures">{FIELD_INFO.pictures}</FieldInfo>
              </h3>
              <p className="text-xs text-steel">At least {MIN_IMAGES} to publish. You have {pictureCount}.</p>
              <FileDropZone label="Add pictures" multiple accept="image/png,image/jpeg,image/webp,video/mp4" hint="Pictures up to 5 MB, one video up to 15 MB. JPG, PNG, WEBP, MP4" onFiles={(f) => pickFiles('images', f)} />
              {errors.images && <p className="text-sm text-semantic-error-text">{errors.images}</p>}
              {existingImages.length > 0 && (
                <ul aria-label="Current pictures" className="flex flex-wrap gap-2">
                  {existingImages.map((m) => (
                    <li key={mediaId(m)} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.url} alt="" className="h-20 w-20 rounded-lg border border-hairline object-cover" />
                      <button type="button" aria-label="Remove this picture" onClick={() => setRemovedMedia((all) => [...all, { kind: 'images', id: mediaId(m) }])} className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-hairline bg-canvas text-steel">
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {images.length > 0 && <FileList label="Pictures to add" files={images} onRemove={(i) => setImages((all) => all.filter((_, x) => x !== i))} />}
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="flex items-center gap-1 text-sm font-medium text-ink">
                Attachments <span className="font-normal text-steel">(Optional)</span>
                <FieldInfo label="attachments">{FIELD_INFO.attachments}</FieldInfo>
              </h3>
              <FileDropZone label="Add attachments" multiple accept="image/png,image/jpeg,application/pdf" hint="Spec sheets and similar, up to 5 MB each. PDF, PNG, JPEG" onFiles={(f) => pickFiles('attachments', f)} />
              {errors.attachments && <p className="text-sm text-semantic-error-text">{errors.attachments}</p>}
              {existingAttachments.length > 0 && (
                <ul aria-label="Current attachments" className="flex flex-col gap-1 text-sm">
                  {existingAttachments.map((m, i) => (
                    <li key={mediaId(m)} className="flex items-center justify-between gap-2">
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="truncate text-brand-green-dark underline">Attachment {i + 1}</a>
                      <Button type="button" size="sm" variant="text" color="secondary" onClick={() => setRemovedMedia((all) => [...all, { kind: 'attachments', id: mediaId(m) }])}>Remove</Button>
                    </li>
                  ))}
                </ul>
              )}
              {attachments.length > 0 && <FileList label="Attachments to add" files={attachments} onRemove={(i) => setAttachments((all) => all.filter((_, x) => x !== i))} />}
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Color" htmlFor="listing-color" optional info={FIELD_INFO.color}><Input id="listing-color" value={color} onChange={(e) => setColor(e.target.value)} maxLength={255} /></FormField>
              <FormField label="Composition" htmlFor="listing-composition" optional info={FIELD_INFO.composition}><Input id="listing-composition" value={composition} onChange={(e) => setComposition(e.target.value)} maxLength={255} /></FormField>
              <FormField label="Density" htmlFor="listing-density" optional info={FIELD_INFO.density}><Input id="listing-density" value={density} onChange={(e) => setDensity(e.target.value)} maxLength={255} /></FormField>
              <FormField label="Hardness" htmlFor="listing-hardness" optional info={FIELD_INFO.hardness}><Input id="listing-hardness" value={hardness} onChange={(e) => setHardness(e.target.value)} maxLength={255} /></FormField>
              <FormField label="Maximum moisture (%)" htmlFor="listing-moisture" optional error={errors.moisture} info={FIELD_INFO.moisture}><QuantityInput id="listing-moisture" value={moisture} onChange={setMoisture} /></FormField>
              <FormField label="Packaging" htmlFor="listing-packaging" optional info={FIELD_INFO.packaging}>
                <SelectWithCustom id="listing-packaging" value={packaging} onChange={setPackaging} options={PACKAGING_LIST} customLabel="Your packaging" customPlaceholder="e.g. 25 kg woven bags" />
              </FormField>
              <FormField label="Sampling method" htmlFor="listing-sampling" optional info={FIELD_INFO.sampling}>
                <SelectWithCustom id="listing-sampling" value={sampling} onChange={setSampling} options={SAMPLING_OPTIONS} customLabel="Your sampling method" customPlaceholder="e.g. Independent lab in Kaduna" />
              </FormField>
            </div>
            {!nonMineral && <p className="text-xs text-steel">Purity and grade come from your batches, so buyers always see what the stock really is.</p>}

            <section className="flex flex-col gap-3">
              <h3 className="flex items-center gap-1 text-sm font-medium text-ink">
                More description <span className="font-normal text-steel">(Optional)</span>
                <FieldInfo label="more description">{FIELD_INFO.sections}</FieldInfo>
              </h3>
              {errors.sections && <p className="text-sm text-semantic-error-text">{errors.sections}</p>}
              {sections.map((s, i) => (
                <fieldset key={s.key} className="flex flex-col gap-2 rounded-xl border border-hairline p-3">
                  <legend className="sr-only">Section {i + 1}</legend>
                  <FormField label="Heading" htmlFor={`section-header-${s.key}`}>
                    <Input id={`section-header-${s.key}`} value={s.header} onChange={(e) => setSections((all) => all.map((x) => (x.key === s.key ? { ...x, header: e.target.value } : x)))} maxLength={255} />
                  </FormField>
                  <div className="flex flex-col gap-1.5" data-testid={`section-text-${i}`}>
                    <span className="text-sm font-medium text-ink">Text</span>
                    <TextEditor content={s.description} placeholder="Describe your product here…" onUpdate={({ editor }) => setSections((all) => all.map((x) => (x.key === s.key ? { ...x, description: editor.getHTML() } : x)))} />
                  </div>
                  {sections.length > 1 && <Button type="button" size="sm" variant="text" color="secondary" className="self-start" onClick={() => setSections((all) => all.filter((x) => x.key !== s.key))}>Remove section</Button>}
                </fieldset>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outlined" onClick={() => setSections((all) => [...all, { key: nextSection.current++, header: '', description: '' }])} startIcon={<Plus className="h-4 w-4" aria-hidden />}>Add a section</Button>
                <Button type="button" size="sm" variant="outlined" color="secondary" disabled={!filledSections.length} onClick={() => setPreviewing(true)} startIcon={<Eye className="h-4 w-4" aria-hidden />}>Preview</Button>
              </div>
            </section>
          </>
        )}

        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={`Price per ${symbol || 'unit'} (NGN)`} htmlFor="listing-price" required error={errors.price} info={FIELD_INFO.price}>
              <Input id="listing-price" inputMode="decimal" value={withCommas(price)} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ''))} autoComplete="off" />
            </FormField>
            <FormField label="Previous price (NGN)" htmlFor="listing-prev-price" optional error={errors.prevPrice} info={FIELD_INFO.prevPrice}>
              <Input id="listing-prev-price" inputMode="decimal" value={withCommas(prevPrice)} onChange={(e) => setPrevPrice(e.target.value.replace(/[^\d.]/g, ''))} autoComplete="off" />
            </FormField>
            <FormField label={`Minimum order${symbol ? ` (${symbol})` : ''}`} htmlFor="listing-minimum" optional error={errors.minimum} info={FIELD_INFO.minimum}>
              <QuantityInput id="listing-minimum" value={minimum} onChange={setMinimum} />
            </FormField>
            <FormField label="Delivery period" htmlFor="listing-delivery" required error={errors.delivery} info={FIELD_INFO.delivery}>
              <Input id="listing-delivery" value={delivery} onChange={(e) => setDelivery(e.target.value)} maxLength={255} placeholder="e.g. 30 days" />
            </FormField>
            <div>
              <div className="mb-1 flex justify-end"><FieldInfo label="payment terms">{FIELD_INFO.paymentTerms}</FieldInfo></div>
              <MultiCheckboxSelect label="Payment terms" options={paymentTerms.map((t) => ({ value: t.code, label: `${t.code} - ${t.name}` }))} value={payments} onChange={setPayments} />
              {errors.payments && <p className="mt-1 text-sm text-semantic-error-text">{errors.payments}</p>}
            </div>
            <div>
              <div className="mb-1 flex justify-end"><FieldInfo label="shipping terms">{FIELD_INFO.shippingTerms}</FieldInfo></div>
              <MultiCheckboxSelect label="Shipping terms" options={shippingTerms.map((t) => ({ value: t.code, label: `${t.code} - ${t.name}` }))} value={shipping} onChange={setShipping} />
              {errors.shipping && <p className="mt-1 text-sm text-semantic-error-text">{errors.shipping}</p>}
            </div>
            <FormField label="Describe the payment terms" htmlFor="listing-payment-text" optional info={FIELD_INFO.paymentText}><Textarea id="listing-payment-text" value={paymentText} onChange={(e) => setPaymentText(e.target.value)} rows={2} maxLength={2000} /></FormField>
            <FormField label="Describe the shipping terms" htmlFor="listing-shipping-text" optional info={FIELD_INFO.shippingText}><Textarea id="listing-shipping-text" value={shippingText} onChange={(e) => setShippingText(e.target.value)} rows={2} maxLength={2000} /></FormField>
            <FormField label="Offered from" htmlFor="listing-site" info={FIELD_INFO.site} help={<>Needed to publish. Don&apos;t see it? <a href={sitesHref} target="_blank" rel="noopener noreferrer" className="text-brand-green-dark underline">Add a site</a>, then come back.</>}>
              <DropdownSelect id="listing-site" value={siteId} onValueChange={setSiteId} options={siteOptions} placeholder="Not set" />
            </FormField>
            <FormField label="Sold to" htmlFor="listing-scope" info={FIELD_INFO.tradeScope}>
              <DropdownSelect id="listing-scope" value={tradeScope} onValueChange={setTradeScope} options={[{ value: 'local', label: 'Local' }, { value: 'international', label: 'International' }, { value: 'both', label: 'Local and international' }]} />
            </FormField>
            <FormField label="Fulfilment" htmlFor="listing-fulfilment" optional info={FIELD_INFO.fulfilment}>
              <DropdownSelect id="listing-fulfilment" value={fulfillment} onValueChange={setFulfillment} options={[{ value: 'pickup', label: 'Pickup' }, { value: 'delivery', label: 'Delivery' }, { value: 'both', label: 'Pickup and delivery' }]} placeholder="Not set" />
            </FormField>
            <FormField label="Supply" htmlFor="listing-supply" info={FIELD_INFO.supply}>
              <DropdownSelect id="listing-supply" value={supplyType} onValueChange={setSupplyType} options={[{ value: 'immediate', label: 'Immediate' }, { value: 'recurring', label: 'Recurring' }]} />
            </FormField>
            {supplyType === 'recurring' && (
              <>
                <FormField label="How often" htmlFor="listing-frequency" required error={errors.frequency} info={FIELD_INFO.frequency}>
                  <DropdownSelect id="listing-frequency" value={frequency} onValueChange={setFrequency} options={[{ value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]} placeholder="Choose one" />
                </FormField>
                <FormField label="Contract duration" htmlFor="listing-duration" optional info={FIELD_INFO.duration}><Input id="listing-duration" value={duration} onChange={(e) => setDuration(e.target.value)} maxLength={64} placeholder="e.g. 6 months" /></FormField>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            {(existingImages.length > 0 || images.length > 0) && (
              <ul aria-label="Pictures to show" className="flex flex-wrap gap-2">
                {existingImages.map((m) => (
                  <li key={mediaId(m)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt="" className="h-20 w-20 rounded-lg border border-hairline object-cover" />
                  </li>
                ))}
                {images.map((f, i) => <li key={`${f.name}-${i}`}><LocalPreview file={f} /></li>)}
              </ul>
            )}
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {(
                [
                  ['Name', name],
                  ['Type', nonMineral ? 'Not a mineral' : 'Mineral'],
                  ...(nonMineral ? [] : [['Material', material?.name]]),
                  ['Buyers find it under', categoryNames.join(' › ')],
                  ['Available to buyers', stockText ?? 'No stock yet'],
                  ['Price', `${formatMoney(price)} per ${symbol}, plus platform fees`],
                  ['Previous price', prevPrice ? formatMoney(prevPrice) : ''],
                  ['Minimum order', minimum ? formatQuantity(minimum, symbol) : 'None'],
                  ['Pictures', `${pictureCount}`],
                  ['Attachments', `${existingAttachments.length + attachments.length}`],
                  ['Color', color],
                  ['Composition', composition],
                  ['Density', density],
                  ['Hardness', hardness],
                  ['Maximum moisture', moisture ? `${moisture}%` : ''],
                  ['Packaging', packaging],
                  ['Sampling method', sampling],
                  ['Payment terms', payments.join(', ')],
                  ['Shipping terms', shipping.join(', ')],
                  ['Delivery period', delivery],
                  ['Offered from', siteOptions.find((s) => s.value === siteId)?.label ?? 'Not set'],
                  ['Sold to', { local: 'Local', international: 'International', both: 'Local and international' }[tradeScope] ?? tradeScope],
                  ['Fulfilment', { pickup: 'Pickup', delivery: 'Delivery', both: 'Pickup and delivery' }[fulfillment] ?? ''],
                  ['Supply', supplyType === 'recurring' ? `Recurring, ${frequency}${duration ? `, for ${duration}` : ''}` : 'Immediate'],
                ] as [string, string | undefined][]
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-medium uppercase text-steel">{label}</dt>
                  <dd className="break-words text-ink">{value || '—'}</dd>
                </div>
              ))}
            </dl>
            <div>
              <h3 className="text-xs font-medium uppercase text-steel">Short description</h3>
              <p className="text-sm text-ink">{summary}</p>
            </div>
            {filledSections.length > 0 && <Sections sections={filledSections} />}
            {!stockText && <Alert severity="info">{nonMineral ? 'Enter the quantity available to publish.' : 'Add stock to publish.'} You can save this as a draft.</Alert>}
            {!siteId && <Alert severity="info">Choose where this is offered from to publish. You can save this as a draft.</Alert>}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-hairline pt-4 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outlined" color="secondary" onClick={onCancel} disabled={saving}>Cancel</Button>
            {step > 0 && <Button type="button" variant="outlined" onClick={() => goTo(step - 1)} disabled={saving}>Back</Button>}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {step < 3 ? (
              <Button type="button" onClick={() => goTo(step + 1)}>Next</Button>
            ) : (
              <>
                <Button type="button" variant="outlined" onClick={() => save(false)} loading={saving}>{listing?.status === 'published' ? 'Save changes' : 'Save as draft'}</Button>
                {listing?.status !== 'published' && <Button type="button" onClick={() => save(true)} loading={saving}>Publish</Button>}
              </>
            )}
          </div>
        </div>
      </div>
      <SideSheet open={previewing} onClose={() => setPreviewing(false)} title="Preview description" subtitle="How buyers will see it">
        <Sections sections={filledSections} />
      </SideSheet>
      {dialog}
    </div>
  );
}

function chainNames(roots: readonly CategoryNode[], id: string): string[] {
  const chain = categoryChain(roots, id);
  const names: string[] = [];
  let level = roots;
  for (const step of chain) {
    const node = level.find((n) => n.id === step);
    if (!node) break;
    names.push(node.name);
    level = node.children;
  }
  return names;
}

function FileList({ label, files, onRemove }: { label: string; files: File[]; onRemove: (index: number) => void }) {
  return (
    <ul aria-label={label} className="flex flex-col gap-1 text-sm text-ink">
      {files.map((f, i) => (
        <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-1">
          <span className="min-w-0 truncate">{i + 1}. {f.name} ({sizeOf(f.size)})</span>
          <Button type="button" size="sm" variant="text" color="secondary" onClick={() => onRemove(i)} aria-label={`Remove ${f.name}`}>Remove</Button>
        </li>
      ))}
    </ul>
  );
}

function LocalPreview({ file }: { file: File }) {
  const [url, setUrl] = React.useState<string>();
  React.useEffect(() => {
    const made = URL.createObjectURL(file);
    setUrl(made);
    return () => URL.revokeObjectURL(made);
  }, [file]);
  if (!url || file.type.startsWith('video/')) return <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-hairline text-xs text-steel">Video</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-20 w-20 rounded-lg border border-hairline object-cover" />;
}

function Sections({ sections }: { sections: Section[] }) {
  return (
    <div className="flex flex-col gap-4">
      {sections.map((s) => (
        <section key={s.key}>
          <h3 className="mb-1 text-sm font-semibold text-ink">{s.header}</h3>
          <RichText text={s.description} className="text-sm text-slate" />
        </section>
      ))}
    </div>
  );
}
