import { COUNTRIES } from '@/utils/CountriesState';

/*
 * The marketplace's filters as the backend reads them: GET /products/all for listings, GET /rfqs/all for RFQs.
 * One place, so every product view and the RFQ view send the same thing (marketplace filters, 2026-11-27).
 */

export interface MarketplaceFilterState {
  /** ISO country codes: where the goods are (listings) or where the RFQ delivers to */
  countries: string[] | null;
  materialId: string | null;
  /** mine, warehouse... (the kind of site) */
  locationType: string | null;
  /** delivery or pickup: a listing or RFQ offering both matches either */
  fulfillment: string | null;
  /** The price buyers see (with fees), per unit, in `currency` */
  minPrice: number | null;
  maxPrice: number | null;
  currency: string | null;
  /** The store's rating, at least */
  rating: string | null;
  /** open (default), closing_soon or ended */
  rfqsStatus: string | null;
}

export const PRICE_CURRENCIES = [
  { value: 'NGN', label: 'Naira (₦)' },
  { value: 'USD', label: 'US dollar ($)' },
];

export const RFQ_VIEWS = [
  { value: 'open', label: 'Open for offers' },
  { value: 'closing_soon', label: 'Closing within 7 days' },
  { value: 'ended', label: 'Ended' },
];

export const FULFILMENT_CHOICES = [
  { value: 'delivery', label: 'Delivery' },
  { value: 'pickup', label: 'Pickup' },
];

const regionName = typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;

/** Every country by ISO code, named as listings show it ("Congo - Kinshasa"); search also finds the long name */
export const COUNTRY_CHOICES: { code: string; name: string; otherName: string; flag: string }[] = COUNTRIES.map((c) => {
  let name = c.name;
  try {
    name = regionName?.of(c.isoCode) ?? c.name;
  } catch {
    // keep the list's name
  }
  return { code: c.isoCode, name, otherName: c.name, flag: c.flag };
}).sort((a, b) => a.name.localeCompare(b.name));

const has = (v: unknown) => v !== null && v !== undefined && v !== '';

/** Listing filters for GET /products/all. A price range is sent with its currency, never on its own */
export function listingFilterParams(f: Partial<MarketplaceFilterState>) {
  const priced = has(f.minPrice) || has(f.maxPrice);
  return {
    country: f.countries?.length ? f.countries.join(',') : undefined,
    materialId: f.materialId || undefined,
    locationType: f.locationType || undefined,
    fulfillmentType: f.fulfillment || undefined,
    minPrice: priced && has(f.minPrice) ? f.minPrice : undefined,
    maxPrice: priced && has(f.maxPrice) ? f.maxPrice : undefined,
    currency: priced ? f.currency || 'NGN' : undefined,
    minRating: f.rating || undefined,
  };
}

/** RFQ filters for GET /rfqs/all */
export function rfqFilterParams(f: Partial<MarketplaceFilterState>) {
  return {
    status: f.rfqsStatus || undefined,
    country: f.countries?.length ? f.countries.join(',') : undefined,
    materialId: f.materialId || undefined,
    locationType: f.locationType || undefined,
    fulfillmentType: f.fulfillment || undefined,
  };
}
