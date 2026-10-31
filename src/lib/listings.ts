/*
 * Group 06 listings (docs/new/frontend/implementation/step-2.6-listings.md). A listing is the advert;
 * its batches are the physical stock, and what can be sold comes from them. Shapes follow the
 * backend's Swagger schemas (minmeg-backend-ts src/docs/listing.docs.ts).
 */
import { OPERABLE_STATUSES, type Batch } from './batches';

export const LISTING_STATUSES = ['draft', 'published', 'paused', 'closed', 'archived', 'unavailable'] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];
export type ListingAction = 'publish' | 'pause' | 'close' | 'relist' | 'archive';

/** The status each action may start from (backend listing.service FROM) */
export const ACTIONS_FROM: Record<ListingAction, readonly string[]> = {
  publish: ['draft', 'paused', 'unavailable'],
  pause: ['published'],
  close: ['published', 'paused', 'unavailable'],
  relist: ['closed'],
  archive: ['draft', 'paused', 'unavailable', 'closed'],
};
export const actionsFor = (status: string) => (Object.keys(ACTIONS_FROM) as ListingAction[]).filter((a) => ACTIONS_FROM[a].includes(status));

export const MIN_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 15 * 1024 * 1024;
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'video/mp4'];
export const ATTACHMENT_FILE_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];

export interface ListingMedia {
  /** Pictures are removed by this; attachments by id */
  imageUuid?: string;
  id?: string | number;
  url: string;
  type?: string;
  position?: number;
}
export interface DescriptionSection {
  header: string;
  description: string;
}

export interface AvailabilityRow {
  listingBatchId?: string;
  batchId?: string;
  batchCode: string;
  status?: string;
  contributes: string;
  eligible?: boolean;
  reason?: string | null;
}

export interface Listing {
  id: string;
  listingCode: string | null;
  supplierId: string;
  status: ListingStatus;
  product_name: string;
  productHeaderDescription: string;
  productDetailDescription: DescriptionSection[] | Record<string, unknown> | null;
  materialId: string | null;
  unitId: string | null;
  unit?: { id: string; code: string; symbol: string; name: string } | null;
  measure: string | null;
  real_price: number;
  prev_price: number | null;
  display_price: number;
  total_platform_fees: number | null;
  unitCurrency: string;
  quantity: number;
  availableQuantity?: string;
  minimum_order_quantity: string | null;
  batches?: AvailabilityRow[];
  images?: ListingMedia[];
  attachments?: ListingMedia[];
  locationId: string | null;
  selected_country_name?: string | null;
  selected_state?: string | null;
  delivery_period?: string | null;
  paymentsTermsDescribed?: string | null;
  shippingTermsDescribed?: string | null;
  selected_payments?: string[] | string | null;
  selected_shipping?: string[] | string | null;
  packaging?: string | null;
  sampling_method?: string | null;
  moisture_max?: number | string | null;
  color?: string | null;
  composition?: string | null;
  density?: string | null;
  hardness?: string | null;
  purity_grade?: string | null;
  supply_type?: string | null;
  frequency?: string | null;
  duration?: string | null;
  trade_scope?: string | null;
  fulfillment_type?: string | null;
  is_popular?: boolean;
  is_featured?: boolean;
  metadata?: { statusNote?: string } | null;
  updatedAt: string;
  createdAt: string;
}

export interface ListingBatchRow {
  id: string;
  batchId: string;
  status: string;
  availableQuantity: string;
  removedAt: string | null;
  removalReason: string | null;
  batch: Batch;
}

/** A batch that can back this listing: same unit, usable, eligible, on no other active listing */
export function canBackListing(batch: Batch & { listing?: unknown }, unitId: string): boolean {
  if (batch.quantityUnitId !== unitId || batch.listing) return false;
  if (!OPERABLE_STATUSES.includes(batch.batchStatus)) return false;
  return !['NOT_ELIGIBLE', 'SUSPENDED'].includes(batch.listingEligibilityStatus) && Number(batch.availableQuantity) > 0;
}

/** Terms may come back as an array, or as text from the old routes */
export function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [value];
  } catch {
    return [value];
  }
}

/** Why pictures can't be added, or null. A video counts as one file; only one is allowed. */
export function mediaError(files: readonly File[], existingVideo: boolean): string | null {
  const videos = files.filter((f) => f.type.startsWith('video/')).length + (existingVideo ? 1 : 0);
  if (videos > 1) return 'Only one video can be added';
  for (const f of files) {
    if (!IMAGE_TYPES.includes(f.type)) return `${f.name}: use PNG, JPEG, WEBP or MP4`;
    if (f.size > (f.type.startsWith('video/') ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) return `${f.name} is too large: pictures up to 5 MB, a video up to 15 MB`;
  }
  return null;
}

export function attachmentError(files: readonly File[]): string | null {
  for (const f of files) {
    if (!ATTACHMENT_FILE_TYPES.includes(f.type)) return `${f.name}: use PDF, PNG or JPEG`;
    if (f.size > MAX_ATTACHMENT_BYTES) return `${f.name} is too large: up to 5 MB`;
  }
  return null;
}

/** Money as typed: digits with up to 2 decimals */
export const MONEY_PATTERN = /^\d{1,13}(\.\d{1,2})?$/;

export function formatMoney(amount: number | string | null | undefined, currency = 'NGN'): string {
  if (amount === null || amount === undefined || amount === '') return '—';
  return `${currency} ${Number(amount).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

const STATUS_WORDS: Record<string, string> = { draft: 'Draft', published: 'Published', paused: 'Paused', closed: 'Closed', archived: 'Archived', unavailable: 'Unavailable' };
export const listingStatusLabel = (status: string) => STATUS_WORDS[status] ?? status;
export const listingStatusTone = (status: string): 'success' | 'neutral' | 'warning' | 'error' => (status === 'published' ? 'success' : status === 'paused' || status === 'unavailable' ? 'warning' : 'neutral');
