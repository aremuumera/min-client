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

export type ListingKind = 'MINERAL' | 'NON_MINERAL';

export interface Listing {
  id: string;
  listingKind: ListingKind;
  categoryId: string | null;
  product_main_category: string;
  product_category: string;
  product_sub_category: string | null;
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

export const isNonMineral = (l: Pick<Listing, 'listingKind'> | null | undefined) => l?.listingKind === 'NON_MINERAL';

/** What a listing is filed under on the marketplace, most specific last */
export const categoryPathOf = (l: Pick<Listing, 'product_main_category' | 'product_category' | 'product_sub_category'>) => [...new Set([l.product_main_category, l.product_category, l.product_sub_category].filter(Boolean) as string[])];

export interface CategoryNode {
  id: string;
  tag?: string;
  code: string | null;
  name: string;
  active?: boolean;
  children: CategoryNode[];
}

/** Everything outside Minerals: tools, protective equipment and services (the backend checks this too) */
export const nonMineralRoots = (tree: readonly CategoryNode[]) => tree.filter((n) => n.code !== 'MINERALS');
export const mineralRoot = (tree: readonly CategoryNode[]) => tree.find((n) => n.code === 'MINERALS') ?? null;

/** The category with this tag, for an old record that stores only the tag */
export function categoryByTag(tree: readonly CategoryNode[], tag: string | null | undefined): CategoryNode | null {
  for (const node of tree) {
    if (node.tag === tag) return node;
    const below = categoryByTag(node.children, tag);
    if (below) return below;
  }
  return null;
}

/** The ids from a root down to this category, or [] */
export function categoryChain(tree: readonly CategoryNode[], id: string | null | undefined): string[] {
  if (!id) return [];
  for (const node of tree) {
    if (node.id === id) return [id];
    const below = categoryChain(node.children, id);
    if (below.length) return [node.id, ...below];
  }
  return [];
}

/** Lowest-level categories under a node, with their path, for a searchable list */
export function leafCategories(node: CategoryNode, path: string[] = []): { value: string; label: string }[] {
  const here = [...path, node.name];
  return node.children.length ? node.children.flatMap((c) => leafCategories(c, here)) : [{ value: node.id, label: here.join(' › ') }];
}

/** Measures nothing is sold by. Every other measurement type made in admin, new ones included, is offered for non-minerals */
export const UNITS_NOT_FOR_SALE = ['TEMPERATURE', 'EMISSIONS', 'EMISSION_INTENSITY', 'ENERGY', 'CONCENTRATION', 'PERCENTAGE', 'TRANSPORT_WORK'];

/** Every category with its full path, for a category request */
export function allCategories(nodes: readonly CategoryNode[], path: string[] = []): { value: string; label: string }[] {
  return nodes.flatMap((n) => [{ value: n.id, label: [...path, n.name].join(' › ') }, ...allCategories(n.children, [...path, n.name])]);
}

export type MaterialRequestStatus = 'PENDING' | 'APPROVED' | 'REFUSED';
export type MaterialRequestType = 'MATERIAL' | 'CATEGORY' | 'OTHER';
export interface MaterialRequest {
  id: string;
  requestType: MaterialRequestType;
  requesterOrganizationId: string;
  requestedName: string;
  suggestedCategoryId: string | null;
  suggestedCategory?: { category_uuid: string; name: string } | null;
  note: string | null;
  status: MaterialRequestStatus;
  materialId: string | null;
  material?: { id: string; code: string; name: string } | null;
  categoryId: string | null;
  category?: { category_uuid: string; name: string } | null;
  reviewedAt: string | null;
  reviewReason: string | null;
  createdAt: string;
}
export type MaterialRequestSummary = Record<MaterialRequestStatus | 'total', number>;
export const MATERIAL_REQUEST_STATUSES: MaterialRequestStatus[] = ['PENDING', 'APPROVED', 'REFUSED'];
export const materialRequestLabel = (s: MaterialRequestStatus, type?: MaterialRequestType) => ({ PENDING: 'Waiting for MINMEG', APPROVED: !type ? 'Added or answered' : type === 'OTHER' ? 'Answered' : 'Added', REFUSED: 'Refused' })[s];
export const MATERIAL_REQUEST_TYPES: { value: MaterialRequestType; label: string }[] = [
  { value: 'MATERIAL', label: 'New material' },
  { value: 'CATEGORY', label: 'New category' },
  { value: 'OTHER', label: 'Something else' },
];
export const requestTypeLabel = (t: MaterialRequestType) => MATERIAL_REQUEST_TYPES.find((o) => o.value === t)?.label ?? t;
export const materialRequestTone = (s: MaterialRequestStatus) => ({ PENDING: 'warning', APPROVED: 'success', REFUSED: 'error' } as const)[s];

/** Editor text with no words in it counts as empty */
export const isBlankText = (html: string) => !html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

export const withCommas = (value: string) => {
  const [whole, ...rest] = value.split('.');
  return [whole.replace(/\B(?=(\d{3})+(?!\d))/g, ','), ...rest].join('.');
};
