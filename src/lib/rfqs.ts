import { Country, State } from 'country-state-city';

/* RFQs and offers (step 2.6b, decisions #59, #100). The backend checks all of this too. */
export interface RfqAttachment {
  url: string;
  publicId?: string;
  type?: string;
}
export type RfqKind = 'MINERAL' | 'NON_MINERAL';

export interface Rfq {
  id?: string;
  rfqId: string;
  userId?: string;
  status: string;
  rfqKind?: RfqKind;
  rfqProductName: string;
  rfqDescription: string;
  rfqProductMainCategory: string;
  rfqProductCategory: string;
  rfqProductSubCategory?: string | null;
  category_tag?: string | null;
  materialId?: string | null;
  material?: { id: string; code: string; name: string } | null;
  unitId?: string | null;
  unit?: { id: string; code: string; name: string; symbol: string } | null;
  quantityRequired: string;
  quantityMeasure: string;
  durationOfSupply: string;
  deliveryPeriod: string;
  purity_grade?: string | null;
  moisture_max?: number | string | null;
  packaging?: string | null;
  sampling_method?: string | null;
  selectedPayments?: string[];
  selectedShippings?: string[];
  paymentsTermsDescribed?: string | null;
  shippingTermsDescribed?: string | null;
  inquiry_type?: 'immediate' | 'recurring';
  recurring_frequency?: string | null;
  recurring_duration?: number | null;
  urgency_level?: 'standard' | 'urgent';
  is_inspection_required?: boolean;
  is_shipment_included?: boolean;
  fulfillment_type?: string | null;
  location_type?: string | null;
  productDestination?: string | null;
  selectedCountryName?: string | null;
  countryCode?: string | null;
  selectedState?: string | null;
  fullAddress?: string | null;
  bidding_deadline?: string | null;
  attachments?: RfqAttachment[];
  offerCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface RfqOffer {
  id: string;
  external_id: string;
  rfq_id: string;
  rfq?: { rfqId: string; rfqProductName: string; status?: string; bidding_deadline?: string | null };
  status: string;
  is_shortlisted?: boolean;
  version_number?: number;
  is_latest?: boolean;
  quantity: number | string;
  measure_type: string;
  unitId?: string | null;
  unit_price: number | string;
  currency: string;
  purity_grade?: string | null;
  moisture_max?: number | string | null;
  packaging?: string | null;
  sampling_method?: string | null;
  delivery_location?: string | null;
  delivery_state?: string | null;
  delivery_country?: string | null;
  delivery_address?: string | null;
  timeline_type?: string | null;
  recurring_frequency?: string | null;
  recurring_duration?: number | null;
  description?: string | null;
  firebase_room_id?: string | null;
  createdAt: string;
}

const RFQ_STATUS: Record<string, { label: string; tone: 'success' | 'neutral' | 'warning' | 'error' | 'dark' }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  published: { label: 'Published', tone: 'success' },
  pending: { label: 'Published', tone: 'success' },
  in_negotiation: { label: 'In negotiation', tone: 'dark' },
  closed: { label: 'Bidding closed', tone: 'neutral' },
  expired: { label: 'Expired', tone: 'warning' },
  cancelled: { label: 'Cancelled', tone: 'error' },
};
export const rfqStatusLabel = (status: string) => RFQ_STATUS[status]?.label ?? status;
export const rfqStatusTone = (status: string) => RFQ_STATUS[status]?.tone ?? 'neutral';
export const RFQ_STATUS_OPTIONS = ['draft', 'published', 'in_negotiation', 'closed', 'expired', 'cancelled'].map((value) => ({ value, label: rfqStatusLabel(value) }));

/** Edit and cancel while draft or published; delete only if it never had an offer (the backend's rules) */
export const canEditRfq = (status: string) => ['draft', 'published', 'pending'].includes(status);

export const FULFILMENT_OPTIONS = [
  { value: 'pickup', label: 'Pickup' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'both', label: 'Pickup and delivery' },
];
export const LOCATION_TYPE_OPTIONS = [
  { value: 'mine', label: 'Mine' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'processing_facility', label: 'Processing facility' },
  { value: 'port', label: 'Port' },
  { value: 'storage_facility', label: 'Storage facility' },
  { value: 'other', label: 'Other' },
];
export const optionLabel = (options: readonly { value: string; label: string }[], value?: string | null) => options.find((o) => o.value === value)?.label ?? '';

export const COUNTRY_OPTIONS = Country.getAllCountries().map((c) => ({ value: c.isoCode, label: c.name }));
export const countryName = (code: string) => Country.getCountryByCode(code)?.name ?? '';
export const stateOptions = (countryCode: string) => (countryCode ? State.getStatesOfCountry(countryCode).map((s) => ({ value: s.name, label: s.name })) : []);
export const NIGERIA = 'NG';

export const OFFER_STATUS_OPTIONS = [
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'PENDING', label: 'Pending review' },
  { value: 'REJECTED', label: 'Declined' },
];
export const offerStatusKey = (o: Pick<RfqOffer, 'status' | 'is_shortlisted'>) => (o.is_shortlisted && o.status !== 'accepted' && o.status !== 'rejected' ? 'SHORTLISTED' : o.status === 'accepted' ? 'ACCEPTED' : o.status === 'rejected' ? 'REJECTED' : o.status === 'withdrawn' ? 'WITHDRAWN' : 'PENDING');
const OFFER_TONES = { SHORTLISTED: 'dark', ACCEPTED: 'success', REJECTED: 'error', PENDING: 'warning', WITHDRAWN: 'neutral' } as const;
export const offerStatusTone = (o: Pick<RfqOffer, 'status' | 'is_shortlisted'>) => OFFER_TONES[offerStatusKey(o)];
export const offerStatusLabel = (o: Pick<RfqOffer, 'status' | 'is_shortlisted'>) => (offerStatusKey(o) === 'WITHDRAWN' ? 'Replaced' : optionLabel(OFFER_STATUS_OPTIONS, offerStatusKey(o)));

/** "2026-12-01" from a stored date, for a date input */
export const toDateInput = (value?: string | null) => (value ? new Date(value).toISOString().slice(0, 10) : '');
/** The deadline runs to the end of the chosen day */
export const fromDateInput = (value: string) => (value ? new Date(`${value}T23:59:59`).toISOString() : null);
export const todayInput = () => new Date().toISOString().slice(0, 10);

export const RFQ_FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'application/pdf'];
export const MAX_RFQ_FILES = 5;
const MAX_VIDEO_BYTES = 15 * 1024 * 1024;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
export function rfqFileError(files: readonly File[], existing = 0): string | null {
  if (files.length + existing > MAX_RFQ_FILES) return `Add up to ${MAX_RFQ_FILES} files`;
  for (const f of files) {
    if (!RFQ_FILE_TYPES.includes(f.type)) return `${f.name}: use PNG, JPEG, WEBP, MP4 or PDF`;
    if (f.size > (f.type === 'video/mp4' ? MAX_VIDEO_BYTES : MAX_FILE_BYTES)) return `${f.name} is too large: videos up to 15 MB, other files up to 5 MB`;
  }
  return null;
}
