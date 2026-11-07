/*
 * Shipments (step 2.7a, docs/new/frontend/implementation/step-2.7-shipments-tracking-traceability.md).
 * Shapes follow the backend's shipment module. The buyer's copy leaves out the driver, vehicle,
 * carrier, its references and the origin site (decision #105): those fields are optional here.
 */
export type ShipmentStatus = 'DRAFT' | 'PENDING' | 'READY_FOR_DISPATCH' | 'DEPARTED' | 'IN_TRANSIT' | 'ARRIVED' | 'PARTIALLY_DELIVERED' | 'DELIVERED' | 'DELIVERY_REJECTED' | 'CANCELLED';
export type ViewerRole = 'seller' | 'buyer' | 'staff';

export const SHIPMENT_STATUSES: ShipmentStatus[] = ['DRAFT', 'PENDING', 'READY_FOR_DISPATCH', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED', 'PARTIALLY_DELIVERED', 'DELIVERED', 'DELIVERY_REJECTED', 'CANCELLED'];
const LABELS: Record<ShipmentStatus, string> = {
  DRAFT: 'Draft',
  PENDING: 'Planned',
  READY_FOR_DISPATCH: 'Ready to dispatch',
  DEPARTED: 'Departed',
  IN_TRANSIT: 'In transit',
  ARRIVED: 'Arrived',
  PARTIALLY_DELIVERED: 'Partly delivered',
  DELIVERED: 'Delivered',
  DELIVERY_REJECTED: 'Delivery rejected',
  CANCELLED: 'Cancelled',
};
export const shipmentStatusLabel = (s: string) => LABELS[s as ShipmentStatus] ?? s;

export const PLANNING: ShipmentStatus[] = ['DRAFT', 'PENDING', 'READY_FOR_DISPATCH'];
export const MOVING: ShipmentStatus[] = ['DEPARTED', 'IN_TRANSIT', 'ARRIVED'];
export const DELIVERY_RECORDED: ShipmentStatus[] = ['PARTIALLY_DELIVERED', 'DELIVERED', 'DELIVERY_REJECTED'];

export const LINE_LABELS: Record<string, string> = {
  PLANNED: 'Planned',
  LOADED: 'Loaded',
  IN_TRANSIT: 'In transit',
  RECEIVED: 'Received',
  PARTIALLY_RECEIVED: 'Partly received',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

export const VEHICLE_TYPES = ['TRUCK', 'TRAILER', 'CONTAINER', 'RAIL_WAGON', 'VESSEL', 'BARGE', 'AIRCRAFT', 'OTHER'] as const;
export const vehicleTypeLabel = (v: string) => v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, ' ');

export interface Place {
  id: string;
  code?: string;
  name: string;
}
export interface ShipmentLine {
  id: string;
  allocationId: string;
  batchId: string;
  status: string;
  quantityShipped: string;
  quantityReceived: string | null;
  quantityRejected: string | null;
  quantityAccepted: string | null;
  unit: { id: string; symbol: string } | null;
  material: { id: string; name: string } | null;
  batch: { id: string; batchCode: string } | null;
  metadata?: { reconciliation?: { status: 'RECORDED' | 'PENDING_APPROVAL' | 'APPROVED'; difference: string }; rejectionReason?: string | null } | null;
}
export interface Shipment {
  id: string;
  shipmentNumber: string;
  tradeId: string;
  shipmentType: 'DELIVERY' | 'RETURN';
  returnOfShipmentId: string | null;
  status: ShipmentStatus;
  closed?: boolean;
  finalizedAt: string | null;
  plannedDepartureAt: string | null;
  actualDepartureAt: string | null;
  plannedArrivalAt: string | null;
  actualArrivalAt: string | null;
  trackingModes: string[];
  carrierName?: string | null;
  trackingReference?: string | null;
  originLocationId?: string | null;
  destinationLocationId: string | null;
  metadata?: { vehicle?: Record<string, string> | null; cancellation?: { reason: string } | null; closeNote?: string | null } | null;
  origin?: Place | null;
  destination?: Place | null;
  trade?: { id: string; tradeCode: string; status?: string };
  lines?: ShipmentLine[];
  totals?: { shipped: string; received: string; rejected: string; accepted: string; difference: string };
  returnShipments?: { id: string; shipmentNumber: string; status: string }[];
  lineCount?: number;
  quantityShipped?: string | null;
  unitSymbol?: string | null;
  viewerRole: ViewerRole;
  createdAt: string;
}
export interface Readiness {
  checked: boolean;
  ready: boolean;
  problems: { code: string; message: string }[];
  notices: { code: string; message: string }[];
}

/** One trade-level allocation that can go on a shipment (committed at Trade Accepted) */
export interface ShippableAllocation {
  id: string;
  status: string;
  quantityAllocated: string;
  unit: { id: string; symbol: string } | null;
  batch: { id: string; batchCode: string; material?: { name: string } | null } | null;
}
export const SHIPPABLE = ['ACTIVE', 'PARTIALLY_FULFILLED'];

export const dateTimeInput = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');
export const fromDateTimeInput = (v: string) => (v ? new Date(v).toISOString() : null);
