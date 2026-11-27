"use client";

import { PLACE_LABELS } from '@/lib/listings';
import React, { useMemo, useState } from 'react';
import { resetFilters, setFilter, setSort } from '@/redux/features/marketplace/marketplace_slice';
import { useGetMarketplaceMaterialsQuery } from '@/redux/features/listings/listings_api';
import { Button, DropdownSelect } from '@/components/ui';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/redux/hooks';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAlert } from '@/providers/alert-provider';
import { real } from '@/lib/marketplace-data';
import { COUNTRY_CHOICES, FULFILMENT_CHOICES, PRICE_CURRENCIES, RFQ_VIEWS } from '@/lib/marketplace-filters';
import { ChevronDown, ChevronUp, Search, X, Star } from 'lucide-react';

interface SideBarProps {
  variant?: 'desktop' | 'mobile';
  onClose?: () => void;
}

/* What each list can be sorted by (the backend's sort keys) */
const SORTS = [
  { value: 'newest', label: 'Newest', prod: true, rfq: true },
  { value: 'price_asc', label: 'Price: low to high', prod: true, rfq: false },
  { value: 'price_desc', label: 'Price: high to low', prod: true, rfq: false },
  { value: 'deadline_asc', label: 'Closing soonest', prod: false, rfq: true },
  { value: 'popular', label: 'Most viewed', prod: true, rfq: true },
];

const STORE_RATINGS = [
  { value: '', label: 'Any rating', stars: 0 },
  { value: '5', label: '5 stars', stars: 5 },
  { value: '4', label: '4 stars & up', stars: 4 },
  { value: '3', label: '3 stars & up', stars: 3 },
  { value: '2', label: '2 stars & up', stars: 2 },
];

const SectionTitle = ({ children }: { children: React.ReactNode }) => <h2 className="mb-2 text-[0.95rem] font-semibold text-gray-900">{children}</h2>;

/* The marketplace's categories and filters (listings and RFQs). The filters are sent by src/lib/marketplace-filters.ts */
const SideBar = ({ variant = 'desktop', onClose = () => { } }: SideBarProps) => {
  const isMobile = variant === 'mobile';
  const pathname = usePathname();
  const { showAlert } = useAlert();
  const materials = useGetMarketplaceMaterialsQuery();

  const { filters, sort } = useAppSelector((state) => state.marketplace);

  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);

  const dispatch = useDispatch();

  // Local UI states
  const [countrySearch, setCountrySearch] = useState('');
  const [minPrice, setMinPrice] = useState<string>(filters.minPrice != null ? String(filters.minPrice) : '');
  const [maxPrice, setMaxPrice] = useState<string>(filters.maxPrice != null ? String(filters.maxPrice) : '');
  const [currency, setCurrency] = useState<string>(filters.currency || 'NGN');

  const prodCheck = pathname?.includes('/dashboard/products/all-mineral-cp');
  const rfqCheck = pathname?.includes('/dashboard/products/rfq-products');

  const sortOptions = SORTS.filter((o) => (rfqCheck ? o.rfq : o.prod));

  // Chosen countries first, then the rest; search finds the short or the long name, or the code
  const selectedCountries: string[] = useMemo(() => filters.countries ?? [], [filters.countries]);
  const shownCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    const list = q ? COUNTRY_CHOICES.filter((c) => c.name.toLowerCase().includes(q) || c.otherName.toLowerCase().includes(q) || c.code.toLowerCase() === q) : COUNTRY_CHOICES;
    return [...list.filter((c) => selectedCountries.includes(c.code)), ...list.filter((c) => !selectedCountries.includes(c.code))];
  }, [countrySearch, selectedCountries]);

  const setOne = (filterType: string, value: unknown) => dispatch(setFilter({ filterType, value }));

  const handleReset = () => {
    dispatch(resetFilters());
    setCountrySearch('');
    setMinPrice('');
    setMaxPrice('');
    setCurrency('NGN');
    setActiveCategory(null);
    setActiveSubCategory(null);
  };

  const toggleCategory = (categoryId: number) => {
    setActiveCategory((prevActive) => (prevActive === categoryId ? null : categoryId));
    setActiveSubCategory(null);
  };

  const toggleSubCategory = (parentId: number, subCategoryId: number) => {
    const combinedId = `${parentId}-${subCategoryId}`;
    setActiveSubCategory((prevActive) => (prevActive === combinedId ? null : combinedId));
  };

  const toggleCountry = (code: string, checked: boolean) => {
    const next = checked ? [...new Set([...selectedCountries, code])] : selectedCountries.filter((c) => c !== code);
    setOne('countries', next.length > 0 ? next : null);
  };

  // A price range is compared in one currency, the listing's own (src/lib/marketplace-filters.ts)
  const applyPrice = () => {
    const min = minPrice.trim() ? Number(minPrice) : null;
    const max = maxPrice.trim() ? Number(maxPrice) : null;
    if ((min !== null && (!Number.isFinite(min) || min < 0)) || (max !== null && (!Number.isFinite(max) || max < 0))) {
      showAlert('Enter prices as numbers of 0 or more.', 'error');
      return;
    }
    if (min !== null && max !== null && min > max) {
      showAlert('The lowest price cannot be more than the highest.', 'error');
      return;
    }
    setOne('minPrice', min);
    setOne('maxPrice', max);
    setOne('currency', min === null && max === null ? null : currency);
    if (isMobile) onClose();
  };

  const hasActiveFilters = () => {
    if (sort !== null && sort !== '') return true;
    return Object.values(filters).some(
      (value: unknown) => value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)
    );
  };

  const renderRfqCategories = () => (
    <div className="text-gray-900 w-full pt-[10px] duration-500">
      {real?.map((category) => (
        <div key={category.id}>
          {/* Recursive rendering logic adapted for Next.js Links */}
          <div className="h-full">
            {category.submenu ? (
              // Category with submenu
              <>
                <div
                  className={`py-[10px] text-[.85rem] border-b-[1px] border-b-gray-200 px-[8px] font-[500] flex justify-between items-center
                     ${pathname?.includes(category.tag || '') ? 'bg-green-50 text-green-600' : ''}`}
                >
                  <Link
                    href={`/dashboard/products/rfq-products/${category.tag}`}
                    className="flex-1 hover:text-green-600"
                    onClick={() => onClose()}
                  >
                    {category.name}
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      category.id && toggleCategory(category.id);
                    }}
                    className="text-sm p-1 hover:text-green-600 cursor-pointer focus:outline-none"
                    aria-label="Toggle subcategories"
                  >
                    {activeCategory === category.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
                  <div
                    className={`transition-all duration-300 ease-in-out ${activeCategory === category.id ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
                      } overflow-y-auto pr-1 custom-thin-scrollbar`}
                  >
                  <div>
                    {category.children?.map((subCategory) => (
                      <div key={subCategory.id}>
                        {subCategory.children && subCategory.children.length > 0 ? (
                          <>
                            <div
                              className={`py-[8px] pl-4 pr-2 text-[.8rem] flex justify-between items-center hover:bg-gray-50
                                ${pathname?.includes(subCategory.tag || '') ? 'bg-green-50 text-green-600 font-medium' : 'text-gray-600'}`}
                            >
                              <Link
                                href={`/dashboard/products/rfq-products/${category.tag}/${subCategory.tag}`}
                                className="flex-1 hover:text-green-600"
                                onClick={() => onClose()}
                              >
                                {subCategory.name}
                              </Link>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  category.id && toggleSubCategory(category.id, subCategory.id!);
                                }}
                                className="text-xs p-1 hover:text-green-600 cursor-pointer focus:outline-none"
                                aria-label="Toggle items"
                              >
                                {activeSubCategory === `${category.id}-${subCategory.id}` ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                            <div
                              className={`transition-all duration-300 ease-in-out ${activeSubCategory === `${category.id}-${subCategory.id}` ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'
                                } overflow-y-auto pl-4 pr-1 custom-thin-scrollbar`}
                            >
                              {subCategory.children.map((item) => (
                                <div key={item.id} className={`py-1.5 pl-4 pr-2 text-[0.75rem] hover:text-green-600 transition-colors
                                  ${pathname?.includes(item.tag || '') ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                                  <Link
                                    href={`/dashboard/products/rfq-products/${category.tag}/${subCategory.tag}/${item.tag}`}
                                    onClick={() => onClose()}
                                  >
                                    {item.name}
                                  </Link>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className={`py-[8px] pl-6 pr-2 text-[.8rem] hover:bg-gray-50
                                ${pathname?.includes(subCategory.tag || '') ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                            <Link
                              href={`/dashboard/products/rfq-products/${category.tag}/${subCategory.tag}`}
                              onClick={() => onClose()}
                            >
                              {subCategory.name}
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <Link
                href={`/dashboard/products/rfq-products/${category.tag}`}
                className={`block py-[10px] px-[8px] text-[.85rem] font-medium border-b border-gray-100 hover:text-green-600 transition-colors
                  ${pathname?.includes(category.tag || '') ? 'bg-green-50 text-green-600 rounded-md' : 'text-gray-600'}`}
                onClick={() => onClose()}
              >
                {category.name}
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`h-full bg-white flex flex-col ${isMobile ? 'w-full' : 'w-72 border-r border-gray-100'}`}>
      {isMobile && (
        <div className="flex justify-end p-2 border-b">
          <button onClick={onClose} aria-label="Close sidebar"><X size={24} /></button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 pb-5 custom-thin-scrollbar">
        {/* Categories Header */}
        <div className="flex justify-between items-center mt-4 mb-2">
          <h2 className="font-semibold text-[0.95rem] text-gray-900">Categories</h2>
          {hasActiveFilters() && (
            <button onClick={handleReset} className="text-[0.8rem] text-green-600 underline hover:text-green-700">
              Clear filters
            </button>
          )}
        </div>
        <div className="h-px bg-gray-200 mb-2"></div>

        {/* Categories List */}
        <div className="text-gray-900 border-b border-gray-100 pb-2">
          {rfqCheck ? renderRfqCategories() : real?.map((category) => (
            <div key={category.id} className="mb-1">
              {category.children && category.children.length > 0 ? (
                <>
                  <div
                    className={`py-2.5 px-2 text-[0.85rem] font-medium flex justify-between items-center transition-colors rounded-lg group
                        ${pathname?.includes(category.tag || '') ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:text-green-600'}`}
                  >
                    <Link
                      href={`/dashboard/products/all-mineral-cp/${category.tag}`}
                      className="flex-1 hover:text-green-600"
                      onClick={() => onClose()}
                    >
                      {category.name}
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        category.id && toggleCategory(category.id);
                      }}
                      className="text-sm p-1 hover:text-green-600 cursor-pointer focus:outline-none"
                      aria-label="Toggle subcategories"
                    >
                      {activeCategory === category.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                  <div
                    className={`transition-all duration-300 ease-in-out ${activeCategory === category.id ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
                      } overflow-y-auto pr-1 custom-thin-scrollbar`}
                  >
                    {category.children.map((subCategory) => (
                      <div key={subCategory.id}>
                        {subCategory.children && subCategory.children.length > 0 ? (
                          <>
                            <div
                              className={`py-2 pl-6 pr-2 text-[0.8rem] flex justify-between items-center hover:text-green-600
                                 ${pathname?.includes(subCategory.tag || '') ? 'text-green-600 font-medium' : 'text-gray-600'}`}
                            >
                              <Link
                                href={`/dashboard/products/all-mineral-cp/${category.tag}/${subCategory.tag}`}
                                className="flex-1 hover:text-green-600"
                                onClick={() => onClose()}
                              >
                                {subCategory.name}
                              </Link>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  category.id && toggleSubCategory(category.id, subCategory.id!);
                                }}
                                className="text-xs p-1 hover:text-green-600 cursor-pointer focus:outline-none"
                                aria-label="Toggle items"
                              >
                                {activeSubCategory === `${category.id}-${subCategory.id}` ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                            <div
                              className={`transition-all duration-300 ease-in-out ${activeSubCategory === `${category.id}-${subCategory.id}` ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'
                                } overflow-y-auto pl-4 pr-1 custom-thin-scrollbar`}
                            >
                              {subCategory.children.map((item) => (
                                <div key={item.id} className={`py-1.5 pl-6 pr-2 text-[0.75rem] hover:text-green-600 transition-colors
                                    ${pathname?.includes(item.tag || '') ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                                  <Link
                                    href={`/dashboard/products/all-mineral-cp/${category.tag}/${subCategory.tag}/${item.tag}`}
                                    onClick={() => onClose()}
                                  >
                                    {item.name}
                                  </Link>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className={`py-2 pl-6 pr-2 text-[0.8rem] hover:text-green-600 transition-colors
                            ${pathname?.includes(subCategory.tag || '') ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                            <Link
                              href={`/dashboard/products/all-mineral-cp/${category.tag}/${subCategory.tag}`}
                              onClick={() => onClose()}
                            >
                              {subCategory.name}
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  href={`/dashboard/products/all-mineral-cp/${category?.tag}`}
                  className={`block py-2.5 px-2 text-[0.85rem] font-medium border-b border-gray-100 hover:text-green-600 transition-colors
                          ${pathname?.includes(category?.tag || '') ? 'bg-green-50 text-green-600 rounded-md' : 'text-gray-700'}`}
                  onClick={() => onClose()}
                >
                  {category.name}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Filters */}
        {rfqCheck && (
          <div className="mt-6">
            <SectionTitle>RFQ status</SectionTitle>
            <div className="mb-3 h-px bg-gray-200"></div>
            <div className="space-y-2">
              {RFQ_VIEWS.map((view) => (
                <label key={view.value} className="group flex cursor-pointer items-center gap-2 text-sm hover:text-green-600">
                  <input
                    type="radio"
                    name="rfqStatus"
                    value={view.value}
                    checked={(filters.rfqsStatus || 'open') === view.value}
                    onChange={() => setOne('rfqsStatus', view.value === 'open' ? null : view.value)}
                    className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="font-medium text-gray-700 group-hover:text-green-600">{view.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <SectionTitle>Material</SectionTitle>
          <DropdownSelect
            aria-label="Material"
            searchable
            value={filters.materialId ?? ''}
            onValueChange={(value) => setOne('materialId', value || null)}
            options={(materials.data?.data ?? []).map((m) => ({ value: m.id, label: m.name }))}
            placeholder="All materials"
          />
        </div>

        {/* Mine, warehouse... (the kind of site the goods are offered from, or the buyer wants them from) */}
        <div className="mt-6">
          <SectionTitle>{rfqCheck ? 'Wanted from' : 'Offered from'}</SectionTitle>
          <DropdownSelect
            aria-label={rfqCheck ? 'Wanted from' : 'Offered from'}
            value={filters.locationType ?? ''}
            onValueChange={(value) => setOne('locationType', value || null)}
            options={Object.entries(PLACE_LABELS).map(([value, label]) => ({ value, label }))}
            placeholder="Any site"
          />
        </div>

        <div className="mt-6">
          <SectionTitle>Delivery or pickup</SectionTitle>
          <DropdownSelect
            aria-label="Delivery or pickup"
            value={filters.fulfillment ?? ''}
            onValueChange={(value) => setOne('fulfillment', value || null)}
            options={FULFILMENT_CHOICES}
            placeholder="Either"
          />
        </div>

        {/* Countries: where the goods are (listings) or where the RFQ delivers to */}
        <div className="mt-6">
          <SectionTitle>{rfqCheck ? 'Delivery to' : 'Where the goods are'}</SectionTitle>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              aria-label="Search countries"
              placeholder="Search countries..."
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          {selectedCountries.length > 0 && (
            <p className="mb-2 text-xs text-gray-500">
              {selectedCountries.length} selected ·{' '}
              <button type="button" className="text-green-600 underline hover:text-green-700" onClick={() => setOne('countries', null)}>
                any country
              </button>
            </p>
          )}
          <div className="custom-thin-scrollbar max-h-[200px] space-y-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50/30 p-2">
            {shownCountries.map((country) => (
              <label key={country.code} className="group flex cursor-pointer items-center gap-2.5 rounded-md p-1.5 text-sm hover:bg-white">
                <input
                  type="checkbox"
                  checked={selectedCountries.includes(country.code)}
                  onChange={(e) => toggleCountry(country.code, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span aria-hidden="true">{country.flag}</span>
                <span className="text-gray-700 group-hover:text-green-700">{country.name}</span>
              </label>
            ))}
            {shownCountries.length === 0 && <div className="py-6 text-center text-xs italic text-gray-400">No country found</div>}
          </div>
        </div>

        <div className="mt-6">
          <SectionTitle>Sort by</SectionTitle>
          <div className="mb-3 h-px bg-gray-200"></div>
          <div className="space-y-2">
            {sortOptions.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm hover:text-green-600">
                <input
                  type="radio"
                  name="sort"
                  value={option.value}
                  checked={(sort || 'newest') === option.value}
                  onChange={(e) => dispatch(setSort(e.target.value))}
                  className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {prodCheck && (
          <div className="mt-6">
            <SectionTitle>Price per unit</SectionTitle>
            <div className="mb-3 h-px bg-gray-200"></div>
            <DropdownSelect aria-label="Price currency" value={currency} onValueChange={(value) => setCurrency(value || 'NGN')} options={PRICE_CURRENCIES} className="mb-2" />
            <div className="mb-2 flex items-center gap-2">
              <input
                type="number"
                min={0}
                aria-label="Lowest price"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full rounded-md border border-gray-200 p-2 text-sm"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                min={0}
                aria-label="Highest price"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-md border border-gray-200 p-2 text-sm"
              />
            </div>
            <p className="mb-2 text-xs text-gray-500">As buyers see it, with MINMEG&apos;s fees. Only listings priced in this currency.</p>
            <Button size="sm" fullWidth onClick={applyPrice}>
              Apply price
            </Button>
          </div>
        )}

        {prodCheck && (
          <div className="mt-8">
            <SectionTitle>Store rating</SectionTitle>
            <div className="mb-4 h-px bg-gray-200"></div>
            <div className="space-y-3">
              {STORE_RATINGS.map((rating) => (
                <label key={rating.label} className="group flex cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="rating"
                    value={rating.value}
                    checked={(filters.rating ?? '') === rating.value}
                    onChange={() => {
                      setOne('rating', rating.value || null);
                      if (isMobile) onClose();
                    }}
                    className="h-4 w-4 cursor-pointer border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div className="flex items-center gap-1.5">
                    {rating.stars > 0 && (
                      <div className="flex text-yellow-400" aria-hidden="true">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={14} fill={i < rating.stars ? 'currentColor' : 'none'} className={i < rating.stars ? '' : 'text-gray-300'} />
                        ))}
                      </div>
                    )}
                    <span className="text-xs font-medium text-gray-500">{rating.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SideBar;
