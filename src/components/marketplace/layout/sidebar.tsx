
"use client";

import React, { useEffect, useState } from 'react';
import { resetFilters, setFilter, setSort } from '@/redux/features/marketplace/marketplace_slice';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useAlert } from '@/providers/alert-provider';
import { useMediaQuery } from '@/hooks/use-media-query';
import { links, real, Category, SubCategory, countries, MoqUnits } from '@/lib/marketplace-data';
import { ChevronDown, ChevronUp, Search, X, Star } from 'lucide-react';
import { IoSearch } from 'react-icons/io5';

// Assets
const ca = '/assets/flag-ca.svg'; // Check assets
const ru = '/assets/flag-ru.svg';
const un = '/assets/flag-uk.svg';
const us = '/assets/flag-us.svg';

interface SideBarProps {
  variant?: 'desktop' | 'mobile';
  onClose?: () => void;
}

const SortBy = [
  { value: 'price_asc', label: 'Price: Low to High', hasProd: true, hasRfq: false },
  { value: 'price_desc', label: 'Price: High to Low', hasProd: true, hasRfq: false },
  { value: 'newest', label: 'Newest Arrivals', hasProd: true, hasRfq: true },
  { value: 'popular', label: 'Most Popular', hasProd: true, hasRfq: true },
];

const storeReviews = [
  //  { value: '4', img: '/assets/4-star.png' }, // Placeholder paths
  // { value: '3', img: '/assets/3-star.png' },
  // { value: '2', img: '/assets/2-star.png' },
  // { value: '1', img: '/assets/1-star.png' },
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4 Stars & Up' },
  { value: '3', label: '3 Stars & Up' },
  { value: '2', label: '2 Stars & Up' },
];

const rfqChecks = [
  { name: 'All', label: 'All' },
  { name: 'pending', label: 'Pending' },
  { name: 'open', label: 'Open' },
  { name: 'closed', label: 'Closed' },
  { name: 'quoted', label: 'Quoted' },
  { name: 'expired', label: 'Expired' },
];

const SideBar = ({ variant = 'desktop', onClose = () => { } }: SideBarProps) => {
  const isMobile = variant === 'mobile';
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams(); // Note: params might not be available directly in component consistently in all next versions, but hook works.

  // Extract params from pathname if useParams doesn't give them (App Router nuances)
  // Or rely on useParams if configured correctly with dynamic segments.
  // Assuming route is /dashboard/products/all-mineral-cp/[mainCategoryId]/[mineralCategoryId]/...
  const mainCategoryId = params?.slug?.[0] || '';
  const mineralCategoryId = params?.slug?.[1] || '';
  const subMineralCategoryId = params?.slug?.[2] || '';

  // Or better, let's look at how the page is structured. 
  // If it's `src/app/dashboard/products/all-mineral-cp/[[...slug]]/page.tsx`, then slug is an array.

  const mdUp = useMediaQuery('up', 'md');
  const { showAlert } = useAlert();

  const { limit, page, category, mainCategory, subCategory, filters, search, sort, supplierId, profileId } =
    useSelector((state: any) => state.marketplace);

  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);

  const dispatch = useDispatch();

  // Local UI states
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  const [filteredCountries, setFilteredCountries] = useState(countries);
  const [moqValue, setMoqValue] = useState(filters.quantity || '');
  const [minPrice, setMinPrice] = useState(filters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice || '');
  const [selectedMoqUnit, setSelectedMoqUnit] = useState(filters.measure || '');

  useEffect(() => {
    if (locationSearchTerm) {
      setFilteredCountries(
        countries.filter((country) =>
          country.name.toLowerCase().includes(locationSearchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredCountries(countries);
    }
  }, [locationSearchTerm]);

  const prodCheck = pathname?.includes('/dashboard/products/all-mineral-cp');
  const rfqCheck = pathname?.includes('/dashboard/products/rfq-products');

  const filteredSortOptions = SortBy.filter((option) => {
    if (prodCheck) return option.hasProd;
    if (rfqCheck) return option.hasRfq;
    return true;
  });

  const handleReset = () => {
    dispatch(resetFilters());
    setLocationSearchTerm('');
    setFilteredCountries(countries);
    setMinPrice('');
    setMaxPrice('');
    setSelectedMoqUnit('');
    setMoqValue('');
    setActiveCategory(null);
    setActiveSubCategory(null);
  };

  // Import countries from library if available, otherwise mock or fetch
  // For now I will assume countries are in `marketplace-data` or similar. I'll check imports later.

  const toggleCategory = (categoryId: number) => {
    setActiveCategory((prevActive) => (prevActive === categoryId ? null : categoryId));
    setActiveSubCategory(null);
  };

  const toggleSubCategory = (parentId: number, subCategoryId: number) => {
    const combinedId = `${parentId}-${subCategoryId}`;
    setActiveSubCategory((prevActive) => (prevActive === combinedId ? null : combinedId));
  };

  const handleLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    let newLocations = [...(filters.location || [])];

    if (checked) {
      if (!newLocations.includes(name)) {
        newLocations.push(name);
      }
      if (isMobile) {
        // handleClose();
      }
    } else {
      newLocations = newLocations.filter((loc) => loc !== name);
    }

    dispatch(setFilter({ filterType: 'location', value: newLocations.length > 0 ? newLocations : null }));
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSort(event.target.value));
  };

  const handleRatingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    dispatch(setFilter({ filterType: 'rating', value: checked ? name : null }));
  };

  const handleSelectMoqChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMoqUnit(e.target.value);
  };

  const handleMoqSearch = () => {
    if (selectedMoqUnit && moqValue) {
      dispatch(setFilter({ filterType: 'measure', value: selectedMoqUnit }));
      dispatch(setFilter({ filterType: 'quantity', value: moqValue }));
    } else {
      dispatch(setFilter({ filterType: 'measure', value: null }));
      dispatch(setFilter({ filterType: 'quantity', value: null }));
    }
    if (isMobile) onClose();
  };

  const handlePriceChange = () => {
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;

    if (min !== null && max !== null && min > max) {
      showAlert('Minimum price cannot be greater than maximum price.', 'error');
      return;
    }

    dispatch(setFilter({ filterType: 'minPrice', value: min }));
    dispatch(setFilter({ filterType: 'maxPrice', value: max }));

    if (isMobile) onClose();
  };

  const handleRfqChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    dispatch(setFilter({ filterType: 'rfqsStatus', value: checked ? name : null }));
  };

  const hasActiveFilters = () => {
    if (sort !== null && sort !== '') return true;
    return Object.values(filters).some(
      (value: any) => value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)
    );
  };

  const renderRfqCategories = () => (
    <div className="text-gray-900 w-full pt-[10px] duration-500">
      {real?.map((category) => (
        <div key={category.id}>
          {/* Recursive rendering logic similar to original but adapted for Next.js Links */}
          <div className="h-full">
            {category.submenu ? (
              // Category with submenu
              <>
                <div
                  onClick={() => category.id && toggleCategory(category.id)}
                  className={`py-[10px] cursor-pointer text-[.85rem] border-b-[1px] border-b-gray-200 px-[8px] font-[500] flex justify-between items-center
                     ${pathname?.includes(category.tag || '') ? 'bg-green-50 text-green-600' : ''}`}
                >
                  <Link href={`/dashboard/products/rfq-products/${category.tag}`} className="flex-1 hover:text-green-600">
                    {category.name}
                  </Link>
                  <span className="text-sm">
                    {activeCategory === category.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
                <div
                  className={`transition-all duration-500 ease-in-out ${activeCategory === category.id ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                    } overflow-hidden`}
                >
                  <div className="overflow-y-auto max-h-[400px]">
                    {category.children?.map((subCategory) => (
                      <div key={subCategory.id}>
                        {subCategory.children && subCategory.children.length > 0 ? (
                          <>
                            <div
                              onClick={() => category.id && toggleSubCategory(category.id, subCategory.id!)}
                              className={`py-[8px] pl-4 pr-2 text-[.8rem] flex justify-between items-center cursor-pointer hover:bg-gray-50
                                ${pathname?.includes(subCategory.tag || '') ? 'bg-green-50 text-green-600 font-medium' : 'text-gray-600'}`}
                            >
                              <Link href={`/dashboard/products/rfq-products/${category.tag}/${subCategory.tag}`} className="flex-1">
                                {subCategory.name}
                              </Link>
                              <span className="text-xs">
                                {activeSubCategory === `${category.id}-${subCategory.id}` ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </span>
                            </div>
                            <div
                              className={`transition-all duration-500 ease-in-out ${activeSubCategory === `${category.id}-${subCategory.id}` ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                                } overflow-hidden pl-4`}
                            >
                              {subCategory.children.map((item) => (
                                <div key={item.id} className={`py-1.5 pl-4 pr-2 text-[0.75rem] hover:text-green-600 transition-colors
                                  ${pathname?.includes(item.tag || '') ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                                  <Link href={`/dashboard/products/rfq-products/${category.tag}/${subCategory.tag}/${item.tag}`}>
                                    {item.name}
                                  </Link>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className={`py-[8px] pl-6 pr-2 text-[.8rem] hover:bg-gray-50
                                ${pathname?.includes(subCategory.tag || '') ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                            <Link href={`/dashboard/products/rfq-products/${category.tag}/${subCategory.tag}`}>
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
    <div className={`h-full bg-white flex flex-col ${isMobile ? 'w-full' : 'w-72 border-r border-gray-100 shadow-sm'}`}>
      {isMobile && (
        <div className="flex justify-end p-2 border-b">
          <button onClick={onClose} aria-label="Close sidebar"><X size={24} /></button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 pb-5 scrollbar-thin scrollbar-thumb-gray-200">
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
                    onClick={() => category.id && toggleCategory(category.id)}
                    className={`py-2.5 px-2 cursor-pointer text-[0.85rem] font-medium flex justify-between items-center transition-colors rounded-lg group
                        ${pathname?.includes(category.tag || '') ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:text-green-600'}`}
                  >
                    <Link href={`/dashboard/products/all-mineral-cp/${category.tag}`} className="flex-1">
                      {category.name}
                    </Link>
                    <span className="text-sm">
                      {activeCategory === category.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </div>
                  <div
                    className={`transition-all duration-500 ease-in-out ${activeCategory === category.id ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                      } overflow-hidden`}
                  >
                    {category.children.map((subCategory) => (
                      <div key={subCategory.id}>
                        {subCategory.children && subCategory.children.length > 0 ? (
                          <>
                            <div
                              onClick={() => category.id && toggleSubCategory(category.id, subCategory.id!)}
                              className={`py-2 pl-6 pr-2 text-[0.8rem] flex justify-between items-center cursor-pointer hover:text-green-600
                                 ${pathname?.includes(subCategory.tag || '') ? 'text-green-600 font-medium' : 'text-gray-600'}`}
                            >
                              <Link href={`/dashboard/products/all-mineral-cp/${category.tag}/${subCategory.tag}`} className="flex-1">
                                {subCategory.name}
                              </Link>
                              <span className="text-xs">
                                {activeSubCategory === `${category.id}-${subCategory.id}` ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </span>
                            </div>
                            <div
                              className={`transition-all duration-300 ease-in-out ${activeSubCategory === `${category.id}-${subCategory.id}` ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                                } overflow-hidden pl-4`}
                            >
                              {subCategory.children.map((item) => (
                                <div key={item.id} className={`py-1.5 pl-6 pr-2 text-[0.75rem] hover:text-green-600 transition-colors
                                    ${pathname?.includes(item.tag || '') ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                                  <Link href={`/dashboard/products/all-mineral-cp/${category.tag}/${subCategory.tag}/${item.tag}`}>
                                    {item.name}
                                  </Link>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className={`py-2 pl-6 pr-2 text-[0.8rem] hover:text-green-600 transition-colors
                            ${pathname?.includes(subCategory.tag || '') ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                            <Link href={`/dashboard/products/all-mineral-cp/${category.tag}/${subCategory.tag}`}>
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
        {/* RFQ Status Filter */}
        {rfqCheck && (
          <div className="mt-6">
            <h2 className="font-semibold text-[0.95rem] text-gray-900 mb-2">RFQ Status</h2>
            <div className="h-px bg-gray-200 mb-3"></div>
            <div className="space-y-2">
              {rfqChecks.map((rfq) => (
                <label key={rfq.name} className="flex items-center gap-2 text-sm cursor-pointer hover:text-green-600 group">
                  <input
                    type="radio"
                    name="rfqStatus"
                    value={rfq.name}
                    checked={(filters.rfqsStatus || 'All') === rfq.name}
                    onChange={handleRfqChange}
                    className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <span className="text-gray-700 group-hover:text-green-600 font-medium">{rfq.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Location Filter */}
        <div className="mt-6">
          <h2 className="font-semibold text-[0.95rem] text-gray-900 mb-3">Location</h2>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search location..."
              value={locationSearchTerm}
              onChange={(e) => setLocationSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div className="max-h-[160px] overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1.5 scrollbar-hide bg-gray-50/30 font-medium">
            {filteredCountries.map((country: any) => (
              <label key={country.name} className="flex items-center gap-2.5 text-sm cursor-pointer hover:bg-white p-1.5 rounded-md transition-all group group-hover:shadow-sm">
                <input
                  type="checkbox"
                  name={country.name}
                  checked={filters.location?.includes(country.name) || false}
                  onChange={handleLocationChange}
                  className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-gray-300"
                />
                <div className="flex items-center gap-2">
                  {country.flag && (
                    <img src={country.flag} alt={`${country.name} flag`} className="w-5 h-3.5 object-cover rounded shadow-sm border border-gray-100" />
                  )}
                  <span className="text-gray-700 group-hover:text-green-700">{country.name}</span>
                </div>
              </label>
            ))}
            {filteredCountries.length === 0 && (
              <div className="text-center text-gray-400 py-6 text-xs italic">No locations found</div>
            )}
          </div>
        </div>

        {/* Sort By Filter */}
        <div className="mt-6">
          <h2 className="font-semibold text-[0.95rem] text-gray-900 mb-2">Sort By</h2>
          <div className="h-px bg-gray-200 mb-3"></div>
          <div className="space-y-2">
            {filteredSortOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm cursor-pointer hover:text-green-600">
                <input
                  type="radio"
                  name="sort"
                  value={option.value}
                  checked={sort === option.value}
                  onChange={handleSortChange}
                  className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Filter */}
        {prodCheck && (
          <div className="mt-6">
            <h2 className="font-semibold text-[0.95rem] text-gray-900 mb-2">Price</h2>
            <div className="h-px bg-gray-200 mb-3"></div>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                onBlur={handlePriceChange}
                className="w-full p-2 text-sm border border-gray-200 rounded-md"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                onBlur={handlePriceChange}
                className="w-full p-2 text-sm border border-gray-200 rounded-md"
              />
            </div>
            <button
              onClick={handlePriceChange}
              className="w-full py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-all shadow-md active:scale-[0.98] mt-2 outline-none"
            >
              Apply Price Filter
            </button>
          </div>
        )}

        {/* MOQ Filter */}
        {prodCheck && (
          <div className="mt-8">
            <h2 className="font-semibold text-[0.95rem] text-gray-900 mb-2">Minimum Order Quantity</h2>
            <div className="h-px bg-gray-200 mb-3"></div>
            <div className="flex items-center gap-2 p-1.5 border border-gray-300 rounded-xl bg-gray-50/50 hover:bg-white transition-colors focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-600">
              <select
                value={selectedMoqUnit}
                onChange={handleSelectMoqChange}
                className="bg-transparent text-[0.8rem] font-semibold focus:outline-none max-w-[80px] cursor-pointer text-gray-700"
              >
                <option value="">Unit</option>
                {MoqUnits?.map(unit => (
                  <option key={unit} value={unit.toLowerCase()}>{unit}</option>
                ))}
              </select>
              <div className="w-px h-6 bg-gray-300 shrink-0"></div>
              <input
                type="text"
                placeholder="Value"
                value={moqValue}
                onChange={(e) => setMoqValue(e.target.value)}
                className="bg-transparent text-sm w-full focus:outline-none placeholder:text-gray-400 font-medium"
              />
              <button
                onClick={handleMoqSearch}
                className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md active:scale-95"
              >
                <IoSearch size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Store Reviews Filter */}
        {prodCheck && (
          <div className="mt-8">
            <h2 className="font-semibold text-[0.95rem] text-gray-900 mb-2">Store Reviews</h2>
            <div className="h-px bg-gray-200 mb-4"></div>
            <div className="space-y-3.5">
              {storeReviews.map((rating) => (
                <label key={rating.value} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="rating"
                    value={rating.value}
                    checked={filters.rating === rating.value}
                    onChange={(e) => {
                      dispatch(setFilter({ filterType: 'rating', value: e.target.value }));
                      if (isMobile) onClose();
                    }}
                    className="w-4.5 h-4.5 text-green-600 focus:ring-green-500 border-gray-300 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                    <div className="flex text-yellow-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} fill={i < parseInt(rating.value) ? "currentColor" : "none"} className={i < parseInt(rating.value) ? "" : "text-gray-300"} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{rating.label}</span>
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
