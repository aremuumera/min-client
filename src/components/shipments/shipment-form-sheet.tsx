'use client';

import * as React from 'react';
import { Button, DropdownSelect, FormField, Input, QuantityInput, SideSheet, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { dateTimeInput, fromDateTimeInput, SHIPPABLE, VEHICLE_TYPES, vehicleTypeLabel, type Shipment } from '@/lib/shipments';
import { showQuantity } from '@/lib/trade-stock';
import { useGetLocationsQuery } from '@/redux/features/locations/locations_api';
import { useCreateShipmentMutation, useUpdateShipmentMutation } from '@/redux/features/shipments/shipments_api';
import { useGetSellerTradesQuery, useGetTradeAllocationsQuery } from '@/redux/features/trade/trade_api';

const VEHICLE_FIELDS = [
  ['plateNumber', 'Plate number'],
  ['containerNumber', 'Container number'],
  ['sealNumber', 'Seal number'],
  ['driverName', 'Driver name'],
  ['driverPhone', 'Driver phone'],
] as const;

/**
 * Plan a shipment (seller), or edit its plan before dispatch. Lines are chosen on create; afterwards
 * they are added or removed from the shipment itself.
 */
export function ShipmentFormSheet({ open, onClose, tradeId: fixedTrade, shipment, onSaved }: { open: boolean; onClose: () => void; tradeId?: string; shipment?: Shipment; onSaved?: (id: string) => void }) {
  const editing = !!shipment;
  const trades = useGetSellerTradesQuery(undefined, { skip: !open || editing || !!fixedTrade });
  const [tradeId, setTradeId] = React.useState(fixedTrade ?? shipment?.tradeId ?? '');
  const allocations = useGetTradeAllocationsQuery(tradeId, { skip: !open || editing || !tradeId });
  const sites = useGetLocationsQuery({ limit: 100 }, { skip: !open });
  const vehicle = shipment?.metadata?.vehicle ?? {};
  const [origin, setOrigin] = React.useState(shipment?.originLocationId ?? '');
  const [destination, setDestination] = React.useState(shipment?.destinationLocationId ?? '');
  const [departure, setDeparture] = React.useState(dateTimeInput(shipment?.plannedDepartureAt));
  const [arrival, setArrival] = React.useState(dateTimeInput(shipment?.plannedArrivalAt));
  const [carrier, setCarrier] = React.useState(shipment?.carrierName ?? '');
  const [reference, setReference] = React.useState(shipment?.trackingReference ?? '');
  const [vehicleType, setVehicleType] = React.useState(vehicle.vehicleType ?? '');
  const [vehicleFields, setVehicleFields] = React.useState<Record<string, string>>(Object.fromEntries(VEHICLE_FIELDS.map(([k]) => [k, vehicle[k] ?? ''])));
  const [quantities, setQuantities] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();
  const [create, { isLoading: creating }] = useCreateShipmentMutation();
  const [update, { isLoading: updating }] = useUpdateShipmentMutation();

  const shippable = (allocations.data?.data ?? []).filter((a) => SHIPPABLE.includes(a.status));
  const siteOptions = (sites.data?.data ?? []).map((l) => ({ value: l.id, label: l.name }));
  const tradeOptions = (trades.data?.data ?? [])
    .filter((t) => Number(t.allocationSummary?.committed ?? 0) > 0)
    .map((t) => ({ value: t.id, label: `${t.tradeCode} · ${showQuantity(t.quantity, t.unit?.symbol)}` }));
  const lines = Object.entries(quantities)
    .filter(([, q]) => Number(q) > 0)
    .map(([allocationId, quantity]) => ({ allocationId, quantity }));

  const submit = async () => {
    const v = Object.fromEntries(Object.entries({ ...vehicleFields, vehicleType }).filter(([, x]) => x.trim()));
    const plan = {
      originLocationId: origin || null,
      destinationLocationId: destination || null,
      plannedDepartureAt: fromDateTimeInput(departure),
      plannedArrivalAt: fromDateTimeInput(arrival),
      carrierName: carrier.trim() || null,
      trackingReference: reference.trim() || null,
      vehicle: Object.keys(v).length ? v : null,
    };
    const ok = await confirm(
      editing
        ? { title: 'Save the plan?', description: 'Nothing moves until the shipment is dispatched.', confirmLabel: 'Save' }
        : { title: 'Plan this shipment?', description: `${lines.length} line(s). Nothing leaves your stock until you dispatch it.`, confirmLabel: 'Plan shipment' },
    );
    if (!ok) return;
    setError(null);
    try {
      if (editing) {
        await update({ id: shipment.id, ...plan }).unwrap();
        onSaved?.(shipment.id);
      } else {
        const res = await create({ tradeId, ...plan, lines, idempotencyKey: key }).unwrap();
        done();
        onSaved?.(res.data.id);
      }
      onClose();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? `Edit ${shipment.shipmentNumber}` : 'Plan a shipment'}
      subtitle="One truck, container or other movement of goods for a trade."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={creating || updating || (!editing && (!tradeId || !lines.length))} onClick={submit}>{editing ? 'Save' : 'Plan shipment'}</Button>
        </div>
      }
    >
      <div className="space-y-5">
        {!editing && !fixedTrade && (
          <FormField htmlFor="shipment-trade" label="Trade" required info="Only trades with stock committed at Trade Accepted are listed.">
            <DropdownSelect id="shipment-trade" aria-label="Trade" value={tradeId} onValueChange={(v) => { setTradeId(v); setQuantities({}); }} placeholder={trades.isLoading ? 'Loading trades…' : 'Choose a trade'} options={tradeOptions} searchable />
          </FormField>
        )}
        {!editing && tradeId && (
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-ink">What goes on this shipment</legend>
            {allocations.isLoading ? (
              <p className="text-sm text-steel">Loading committed stock…</p>
            ) : !shippable.length ? (
              <p className="text-sm text-steel">This trade has no committed stock to ship.</p>
            ) : (
              shippable.map((a) => (
                <FormField key={a.id} htmlFor={`line-${a.id}`} label={`${a.batch?.material?.name ?? 'Batch'} · ${a.batch?.batchCode ?? ''}`} optional info={`${showQuantity(a.quantityAllocated, a.unit?.symbol)} committed. Leave empty to leave it off this shipment.`}>
                  <QuantityInput id={`line-${a.id}`} value={quantities[a.id] ?? ''} onChange={(q) => setQuantities({ ...quantities, [a.id]: q })} unit={a.unit?.symbol} />
                </FormField>
              ))
            )}
          </fieldset>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField htmlFor="shipment-origin" label="From" optional info="Your site the goods leave from. The buyer doesn't see it.">
            <DropdownSelect id="shipment-origin" aria-label="From" value={origin} onValueChange={setOrigin} placeholder="Not set" options={siteOptions} searchable />
          </FormField>
          <FormField htmlFor="shipment-destination" label="To" optional info="Left empty, the trade's delivery site is used.">
            <DropdownSelect id="shipment-destination" aria-label="To" value={destination} onValueChange={setDestination} placeholder="The trade's delivery site" options={siteOptions} searchable />
          </FormField>
          <FormField htmlFor="shipment-departure" label="Planned departure" optional>
            <Input id="shipment-departure" type="datetime-local" value={departure} onChange={(e) => setDeparture(e.target.value)} />
          </FormField>
          <FormField htmlFor="shipment-arrival" label="Planned arrival" optional>
            <Input id="shipment-arrival" type="datetime-local" value={arrival} min={departure || undefined} onChange={(e) => setArrival(e.target.value)} />
          </FormField>
          <FormField htmlFor="shipment-carrier" label="Carrier" optional info="The haulage company's name. Only you and MINMEG see it.">
            <Input id="shipment-carrier" value={carrier} maxLength={200} onChange={(e) => setCarrier(e.target.value)} />
          </FormField>
          <FormField htmlFor="shipment-reference" label="Waybill or tracking number" optional>
            <Input id="shipment-reference" value={reference} maxLength={200} onChange={(e) => setReference(e.target.value)} />
          </FormField>
        </div>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-ink">Vehicle (Optional)</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField htmlFor="vehicle-type" label="Type" optional>
              <DropdownSelect id="vehicle-type" aria-label="Vehicle type" value={vehicleType} onValueChange={setVehicleType} placeholder="Not set" options={VEHICLE_TYPES.map((v) => ({ value: v, label: vehicleTypeLabel(v) }))} />
            </FormField>
            {VEHICLE_FIELDS.map(([k, label]) => (
              <FormField key={k} htmlFor={`vehicle-${k}`} label={label} optional>
                <Input id={`vehicle-${k}`} value={vehicleFields[k]} maxLength={k === 'driverName' ? 120 : k === 'sealNumber' ? 64 : 32} onChange={(e) => setVehicleFields({ ...vehicleFields, [k]: e.target.value })} />
              </FormField>
            ))}
          </div>
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>
      {dialog}
    </SideSheet>
  );
}
