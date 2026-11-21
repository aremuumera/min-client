'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Alert, Button, CopyableId, DropdownSelect, FormField, Input, KeyValueList, StatusBadge } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { FACILITY_SCHEMES, GRANULARITY_LABEL, MISSING_LABEL, OPERATOR_SCHEMES, type EuHeader, type EuHeaderInput } from '@/lib/eu-header';
import { useGetEuHeaderQuery, useSetEuHeaderMutation } from '@/redux/features/passports/passports_api';

const label = (options: { value: string; label: string }[], v: string | null) => options.find((o) => o.value === v)?.label ?? v ?? '';
const formOf = (h: EuHeader): Record<keyof EuHeaderInput, string> => ({
  economicOperatorName: h.economicOperatorName ?? '',
  economicOperatorIdScheme: h.economicOperatorIdScheme ?? '',
  economicOperatorId: h.economicOperatorId ?? '',
  facilityIdScheme: h.facilityIdScheme ?? '',
  facilityId: h.facilityId ?? '',
  gtin: h.gtin ?? '',
  lot: h.lot ?? '',
  serial: h.serial ?? '',
});

/**
 * Decisions #138 and #139: the EU header of a passport. EU product rules want a passport to say who
 * placed the product on the market, at which facility, and the product's own number. MINMEG never
 * shows a company or a place on its public pages, so the owner types here what they want to publish.
 * With a GTIN, a QR code printed with the GS1 link opens this passport on any scanner.
 */
export function EuHeaderPanel({ passportId, canEdit }: { passportId: string; canEdit: boolean }) {
  const q = useGetEuHeaderQuery(passportId);
  const [save, saveState] = useSetEuHeaderMutation();
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState<Record<keyof EuHeaderInput, string> | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const h = q.data?.data;
  if (!h) return null;
  const set = (k: keyof EuHeaderInput) => (v: string) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const empty = !h.economicOperatorName && !h.economicOperatorId && !h.facilityId && !h.gtin;

  const submit = async () => {
    if (!form) return;
    setError(null);
    if (form.economicOperatorId.trim() && !form.economicOperatorIdScheme) return setError('Choose what kind of number the operator number is');
    if (form.facilityId.trim() && !form.facilityIdScheme) return setError('Choose what kind of number the facility number is');
    if (!form.gtin.trim() && (form.lot.trim() || form.serial.trim())) return setError('A lot or serial number needs the GTIN it belongs to');
    const value = (k: keyof EuHeaderInput) => form[k].trim() || null;
    try {
      await save({ id: passportId, economicOperatorName: value('economicOperatorName'), economicOperatorIdScheme: value('economicOperatorId') ? value('economicOperatorIdScheme') : null, economicOperatorId: value('economicOperatorId'), facilityIdScheme: value('facilityId') ? value('facilityIdScheme') : null, facilityId: value('facilityId'), gtin: value('gtin'), lot: value('lot'), serial: value('serial') }).unwrap();
      toast.success('Saved');
      setEditing(false);
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  return (
    <section className="space-y-3 border-t border-gray-200 pt-4" aria-label="EU header" data-testid="eu-header">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-bold text-gray-900">EU header and product code</h4>
          <StatusBadge tone={h.complete ? 'success' : 'neutral'}>{h.complete ? 'Complete' : empty ? 'Not filled in' : 'Incomplete'}</StatusBadge>
        </div>
        {canEdit && !editing && <Button size="sm" variant="outlined" onClick={() => { setForm(formOf(h)); setError(null); setEditing(true); }} data-testid="eu-header-edit">{empty ? 'Fill in' : 'Change'}</Button>}
      </div>
      <p className="text-sm text-gray-500">For buyers under EU product rules: who placed the product on the market, at which facility, and the product&apos;s own number. This passport describes {GRANULARITY_LABEL[h.granularity]}. You can publish the passport without it.</p>
      {!editing && !empty && (
        <KeyValueList
          columns={2}
          items={[
            { label: 'Operator', value: h.economicOperatorName },
            { label: 'Operator number', value: h.economicOperatorId ? `${h.economicOperatorId} (${label(OPERATOR_SCHEMES, h.economicOperatorIdScheme)})` : null },
            { label: 'Facility number', value: h.facilityId ? `${h.facilityId} (${label(FACILITY_SCHEMES, h.facilityIdScheme)})` : null },
            { label: 'GTIN', value: h.gtin },
            { label: 'Lot', value: h.lot },
            { label: 'Serial number', value: h.serial },
          ]}
        />
      )}
      {!editing && h.gs1DigitalLink && (
        <div className="text-sm" data-testid="eu-header-link">
          <p className="font-medium text-gray-900">GS1 link for the QR code on the product</p>
          <CopyableId value={h.gs1DigitalLink} />
          <p className="text-xs text-gray-500">A QR code with this address opens this passport on any scanner. It is an address, not proof: the MINMEG code on the goods is what proves they are genuine.</p>
        </div>
      )}
      {!editing && !h.complete && !empty && <p className="text-xs text-gray-500">Still missing for an EU passport: {h.missing.map((m) => MISSING_LABEL[m] ?? m).join(', ')}.</p>}
      {editing && form && (
        <div className="space-y-3 rounded-lg border border-gray-200 p-3">
          <Alert severity="warning">Everything you enter here is public: anyone with the passport number or the product code can read it. Leave a field empty to keep it out.</Alert>
          {error && <Alert severity="error">{error}</Alert>}
          <FormField htmlFor="eu-operator" label="Operator name" info="The company that places the product on the market, as it should appear to buyers and authorities.">
            <Input id="eu-operator" value={form.economicOperatorName} onChange={(e) => set('economicOperatorName')(e.target.value)} maxLength={200} />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField htmlFor="eu-operator-scheme" label="Operator number: kind">
              <DropdownSelect id="eu-operator-scheme" aria-label="Operator number: kind" value={form.economicOperatorIdScheme} onValueChange={set('economicOperatorIdScheme')} placeholder="Choose" options={OPERATOR_SCHEMES} />
            </FormField>
            <FormField htmlFor="eu-operator-id" label="Operator number">
              <Input id="eu-operator-id" value={form.economicOperatorId} onChange={(e) => set('economicOperatorId')(e.target.value)} maxLength={64} />
            </FormField>
            <FormField htmlFor="eu-facility-scheme" label="Facility number: kind">
              <DropdownSelect id="eu-facility-scheme" aria-label="Facility number: kind" value={form.facilityIdScheme} onValueChange={set('facilityIdScheme')} placeholder="Choose" options={FACILITY_SCHEMES} />
            </FormField>
            <FormField htmlFor="eu-facility-id" label="Facility number" info="The mine, plant or warehouse, by a number, not an address.">
              <Input id="eu-facility-id" value={form.facilityId} onChange={(e) => set('facilityId')(e.target.value)} maxLength={64} />
            </FormField>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField htmlFor="eu-gtin" label="GTIN" info="The number under the product's barcode (8, 12, 13 or 14 digits). You get GTINs from GS1 in your country.">
              <Input id="eu-gtin" inputMode="numeric" value={form.gtin} onChange={(e) => set('gtin')(e.target.value)} maxLength={20} />
            </FormField>
            <FormField htmlFor="eu-lot" label="Lot" info="For a batch. Up to 20 letters and digits, no spaces.">
              <Input id="eu-lot" value={form.lot} onChange={(e) => set('lot')(e.target.value)} maxLength={20} />
            </FormField>
            <FormField htmlFor="eu-serial" label="Serial number" info="For one item. Up to 20 letters and digits, no spaces.">
              <Input id="eu-serial" value={form.serial} onChange={(e) => set('serial')(e.target.value)} maxLength={20} />
            </FormField>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={saveState.isLoading} onClick={submit} data-testid="eu-header-save">Save</Button>
            <Button size="sm" variant="text" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </section>
  );
}
