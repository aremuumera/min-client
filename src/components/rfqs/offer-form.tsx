'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Alert, Button, DropdownSelect, FileDropZone, FormField, Input, SelectWithCustom, SideSheet, Textarea, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { compressImages } from '@/lib/images/compress';
import { rfqFileError, type RfqOffer } from '@/lib/rfqs';
import { PACKAGING_OPTIONS } from '@/lib/trade-terms';
import { useGetUnitChoicesQuery } from '@/redux/features/batches/batches_api';
import { useGetRfqOffersQuery, useSubmitRfqOfferMutation } from '@/redux/features/trade/trade_api';

const PACKAGING_LIST = PACKAGING_OPTIONS.filter((o) => o.value !== 'Custom');
const INFO = {
  price: 'Your price for one unit, before MINMEG fees.',
  quantity: 'How much you can supply.',
  unit: 'Any unit. If it differs from what the buyer asked for, you can settle it in the chat.',
  grade: 'The purity or grade you can supply.',
  moisture: 'The most moisture your material holds, in percent.',
  packaging: 'How you would pack it.',
  origin: 'Where the material would be loaded from.',
  files: 'Assay reports, pictures or a short video. Pictures are compressed; PDFs and videos go up unchanged.',
  description: 'Anything else the buyer and MINMEG should know.',
};

export interface OfferFormRfq {
  rfqId: string;
  name: string;
  quantityRequired?: string | number | null;
  quantityMeasure?: string | null;
  purity_grade?: string | null;
  moisture_max?: string | number | null;
  packaging?: string | null;
  productDestination?: string | null;
}

/** A supplier's offer on an RFQ (step 2.6b). Sending again makes a new version until the offer is accepted */
export function OfferForm({ open, onClose, rfq }: { open: boolean; onClose: () => void; rfq: OfferFormRfq }) {
  const router = useRouter();
  const units = useGetUnitChoicesQuery(undefined, { skip: !open });
  const mine = useGetRfqOffersQuery(rfq.rfqId, { skip: !open, refetchOnMountOrArgChange: true });
  const [send, sending] = useSubmitRfqOfferMutation();
  const { confirm, dialog } = useConfirm();
  const existing = ((mine.data?.data ?? []) as RfqOffer[])[0];

  const [step, setStep] = React.useState<'form' | 'review' | 'sent'>('form');
  const [price, setPrice] = React.useState('');
  const [quantity, setQuantity] = React.useState('');
  const [unitId, setUnitId] = React.useState('');
  const [grade, setGrade] = React.useState('');
  const [moisture, setMoisture] = React.useState('');
  const [packaging, setPackaging] = React.useState('');
  const [country, setCountry] = React.useState('Nigeria');
  const [state, setState] = React.useState('');
  const [city, setCity] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [files, setFiles] = React.useState<File[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string>();

  // Revising starts from the current offer
  React.useEffect(() => {
    if (!open || !existing) return;
    setPrice(String(existing.unit_price ?? ''));
    setQuantity(String(existing.quantity ?? ''));
    setUnitId(existing.unitId ?? '');
    setGrade(existing.purity_grade ?? '');
    setMoisture(existing.moisture_max == null ? '' : String(existing.moisture_max));
    setPackaging(existing.packaging ?? '');
    setCountry(existing.delivery_country ?? 'Nigeria');
    setState(existing.delivery_state ?? '');
    setCity(existing.delivery_location ?? '');
    setAddress(existing.delivery_address ?? '');
    setDescription(existing.description ?? '');
  }, [open, existing]);

  const unit = units.data?.data.find((u) => u.id === unitId);
  const decided = existing && !['pending', 'shortlisted'].includes(existing.status);
  const close = () => {
    setStep('form');
    setFormError(undefined);
    onClose();
  };

  const review = () => {
    const next: Record<string, string> = {};
    if (!(Number(price) > 0)) next.price = 'Enter your price';
    if (!(Number(quantity) > 0)) next.quantity = 'Enter how much you can supply';
    if (!unitId) next.unitId = 'Choose the unit';
    if (moisture !== '' && (Number(moisture) < 0 || Number(moisture) > 100)) next.moisture = 'Moisture is between 0 and 100';
    setErrors(next);
    if (!Object.keys(next).length) setStep('review');
  };

  const submit = async () => {
    const ok = await confirm({ title: existing ? `Send a new version of your offer on ${rfq.name}?` : `Send your offer on ${rfq.name}?`, description: existing ? 'It replaces your current offer. The old one stays in its history.' : 'The buyer and MINMEG can see it. You can revise it until it is accepted.', confirmLabel: 'Send offer' });
    if (!ok) return;
    setFormError(undefined);
    const form = new FormData();
    const values: Record<string, string> = { quantity, unitId, measure_type: unit?.symbol ?? unit?.code ?? '', unit_price: price, currency: 'NGN', purity_grade: grade.trim(), moisture_max: moisture, packaging: packaging.trim(), delivery_location: city.trim(), delivery_state: state.trim(), delivery_country: country.trim(), delivery_address: address.trim(), timeline_type: 'immediate', description: description.trim() };
    for (const [key, value] of Object.entries(values)) if (value) form.append(key, value);
    for (const f of files) form.append('offerAttachment', f);
    try {
      await send({ rfqId: rfq.rfqId, body: form }).unwrap();
      toast.success('Offer sent');
      setStep('sent');
    } catch (err) {
      setFormError(toApiError(err).message);
    }
  };

  const reviewRows: [string, string][] = [
    ['Price', `₦${Number(price).toLocaleString()} per ${unit?.symbol ?? 'unit'}`],
    ['Quantity', `${quantity} ${unit?.symbol ?? ''}`],
    ['Purity or grade', grade],
    ['Moisture', moisture ? `${moisture}%` : ''],
    ['Packaging', packaging],
    ['Origin', [address, city, state, country].filter(Boolean).join(', ')],
    ['Description', description],
    ['Attachments', files.map((f) => f.name).join(', ')],
  ];

  return (
    <SideSheet
      open={open}
      onClose={close}
      size="lg"
      title={existing ? 'Revise your offer' : 'Submit an offer'}
      subtitle={`for ${rfq.name}`}
      footer={
        step === 'sent' ? (
          <Button type="button" onClick={() => router.push('/dashboard/my-submitted-offers')}>Go to my offers</Button>
        ) : step === 'review' ? (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outlined" color="secondary" onClick={() => setStep('form')} disabled={sending.isLoading}>Back</Button>
            <Button type="button" onClick={submit} loading={sending.isLoading}>Send offer</Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outlined" color="secondary" onClick={close}>Cancel</Button>
            <Button type="button" onClick={review} disabled={!!decided}>Review offer</Button>
          </div>
        )
      }
    >
      {step === 'sent' ? (
        <div className="py-8 text-center">
          <h3 className="text-lg font-medium text-ink">Your offer was sent</h3>
          <p className="mt-2 text-sm text-steel">The buyer and the MINMEG Trade Desk can see it now. You can follow it under My Submitted Offers.</p>
        </div>
      ) : step === 'review' ? (
        <div className="flex flex-col gap-4">
          {formError && <Alert severity="error">{formError}</Alert>}
          <dl aria-label="Your offer" className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {reviewRows.filter(([, value]) => value).map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs font-medium uppercase text-steel">{label}</dt>
                <dd className="break-words text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {formError && <Alert severity="error">{formError}</Alert>}
          {decided && <Alert severity="info">This offer was already decided, so it can't be revised.</Alert>}
          {existing && !decided && <Alert severity="info">You already sent version {existing.version_number ?? 1}. Sending again replaces it, and the old one stays in its history.</Alert>}
          <div className="rounded-lg bg-surface p-3 text-sm">
            <p className="text-xs font-medium uppercase text-steel">The buyer asked for</p>
            <p className="mt-1 text-ink">{[rfq.quantityRequired && `${rfq.quantityRequired} ${rfq.quantityMeasure ?? ''}`, rfq.purity_grade && `Grade ${rfq.purity_grade}`, rfq.moisture_max != null && rfq.moisture_max !== '' && `Moisture up to ${rfq.moisture_max}%`, rfq.packaging, rfq.productDestination && `To ${rfq.productDestination}`].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField className="sm:col-span-2" label="Unit price (NGN)" htmlFor="offer-price" required info={INFO.price} error={errors.price}>
              <Input id="offer-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} autoComplete="off" />
            </FormField>
            <FormField label="Quantity available" htmlFor="offer-quantity" required info={INFO.quantity} error={errors.quantity}>
              <Input id="offer-quantity" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} autoComplete="off" />
            </FormField>
          </div>
          <FormField label="Unit" htmlFor="offer-unit" required info={INFO.unit} error={errors.unitId}>
            <DropdownSelect id="offer-unit" searchable value={unitId} onValueChange={setUnitId} options={(units.data?.data ?? []).map((u) => ({ value: u.id, label: `${u.name ?? u.code} (${u.symbol})` }))} placeholder="Choose a unit" />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Your purity or grade" htmlFor="offer-grade" optional info={INFO.grade}>
              <Input id="offer-grade" value={grade} onChange={(e) => setGrade(e.target.value)} autoComplete="off" />
            </FormField>
            <FormField label="Your moisture (%)" htmlFor="offer-moisture" optional info={INFO.moisture} error={errors.moisture}>
              <Input id="offer-moisture" inputMode="decimal" value={moisture} onChange={(e) => setMoisture(e.target.value)} autoComplete="off" />
            </FormField>
          </div>
          <FormField label="Packaging" htmlFor="offer-packaging" optional info={INFO.packaging}>
            <SelectWithCustom id="offer-packaging" value={packaging} onChange={setPackaging} options={PACKAGING_LIST} customLabel="Your packaging" customPlaceholder="e.g. 25 kg woven bags" />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Origin country" htmlFor="offer-country" optional info={INFO.origin}>
              <Input id="offer-country" value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="off" />
            </FormField>
            <FormField label="Origin state" htmlFor="offer-state" optional>
              <Input id="offer-state" value={state} onChange={(e) => setState(e.target.value)} autoComplete="off" />
            </FormField>
            <FormField label="City or LGA" htmlFor="offer-city" optional>
              <Input id="offer-city" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="off" />
            </FormField>
            <FormField label="Address" htmlFor="offer-address" optional>
              <Input id="offer-address" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="off" />
            </FormField>
          </div>
          <div>
            <FileDropZone
              label="Add attachments"
              hint="PNG, JPEG, WEBP or PDF up to 5 MB, MP4 up to 15 MB. Up to 5 files."
              accept="image/png,image/jpeg,image/webp,application/pdf,video/mp4"
              multiple
              onFiles={async (list) => {
                const picked = await compressImages(list);
                const problem = rfqFileError([...files, ...picked]);
                setErrors(problem ? { files: problem } : {});
                if (!problem) setFiles((all) => [...all, ...picked]);
              }}
            />
            {errors.files && <p className="mt-1 text-sm text-semantic-error-text">{errors.files}</p>}
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
          <FormField label="Additional description" htmlFor="offer-description" optional info={INFO.description}>
            <Textarea id="offer-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000} />
          </FormField>
        </div>
      )}
      {dialog}
    </SideSheet>
  );
}
