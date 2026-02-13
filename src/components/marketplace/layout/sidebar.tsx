
"use client";

import React, { useEffect, useState } from 'react';
import { resetFilters, setFilter, setSort } from '@/redux/features/marketplace/marketplace_slice';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useAlert } from '@/providers/alert-provider';
import { useMediaQuery } from '@/hooks/use-media-query';
import { links, real, Category, SubCategory } from '@/lib/marketplace-data';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
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
  { value: 'newest', label: 'Newest Arrivals', hasProd: true, hasRfq: true },
  { value: 'price_low', label: 'Price: Low to High', hasProd: true, hasRfq: false },
  { value: 'price_high', label: 'Price: High to Low', hasProd: true, hasRfq: false },
  { value: 'rating', label: 'Rating: High to Low', hasProd: true, hasRfq: false },
  { value: 'popularity', label: 'Most Popular', hasProd: true, hasRfq: true },
];

export const MoqUnits = ['kg', 'tons', 'g', 'lb', 'oz', 'm3', 'l', 'barrels', 'units'];
export const Moq = MoqUnits;

// Fake data for store ratings images
const storeReviews = [
  { value: '4', img: '/assets/4-star.png' }, // Placeholder paths
  { value: '3', img: '/assets/3-star.png' },
  { value: '2', img: '/assets/2-star.png' },
  { value: '1', img: '/assets/1-star.png' },
];

const rfqChecks = [
  { name: 'All', label: 'All' },
  { name: 'pending', label: 'Pending' },
  { name: 'open', label: 'Open' },
  { name: 'closed', label: 'Closed' },
];

const SideBar = ({ variant = 'desktop', onClose = () => { } }: SideBarProps) => {
  const isMobile = variant === 'mobile';
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams(); // Note: params might not be available directly in component consistently in all next versions, but hook works.

  // Extract params from pathname if useParams doesn't give them (App Router nuances)
  // Or rely on useParams if configured correctly with dynamic segments.
  // Assuming route is /products/all-mineral-cp/[mainCategoryId]/[mineralCategoryId]/...
  const mainCategoryId = params?.slug?.[0] || '';
  const mineralCategoryId = params?.slug?.[1] || '';
  const subMineralCategoryId = params?.slug?.[2] || '';

  // Or better, let's look at how the page is structured. 
  // If it's `src/app/products/all-mineral-cp/[[...slug]]/page.tsx`, then slug is an array.

  const mdUp = useMediaQuery('up', 'md');
  const { showAlert } = useAlert();

  const { limit, page, category, mainCategory, subCategory, filters, search, sort, supplierId, profileId } =
    useSelector((state: any) => state.marketplace);

  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);

  const dispatch = useDispatch();

  // Local UI states
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  // const [filteredCountries, setFilteredCountries] = useState(countries); // need countries data
  const [filteredCountries, setFilteredCountries] = useState<any[]>([]); // Initialize empty or import countries
  const [moqValue, setMoqValue] = useState(filters.quantity || '');
  const [minPrice, setMinPrice] = useState(filters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice || '');
  const [selectedMoqUnit, setSelectedMoqUnit] = useState(filters.measure || '');

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
    // setFilteredCountries(countries);
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
    <div className="text-[#03045e] w-full pt-[10px] duration-500">
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
                  <div className="overflow-y-auto max-h-[300px]">
                    {category.children?.map((subCategory) => (
                      <div key={subCategory.id}>
                        {/* Subcategory rendering logic */}
                        <div className={`py-[8px] pl-6 pr-2 text-[.8rem] hover:bg-gray-50
                               ${pathname?.includes(subCategory.tag || '') ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                          <Link href={`/dashboard/products/rfq-products/${category.tag}/${subCategory.tag}`}>
                            {subCategory.name}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <Link
                href={`/dashboard/products/rfq-products/${category.tag}`}
                className={`block py-[10px] px-[8px] text-[.85rem] font-[500] border-b-[1px] border-b-gray-200
                  ${pathname?.includes(category.tag || '') ? 'bg-green-50 text-green-600' : ''}`}
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
    <div className={`h-full bg-white flex flex-col ${isMobile ? 'w-full' : 'w-64 border-r border-gray-100'}`}>
      {isMobile && (
        <div className="flex justify-end p-2 border-b">
          <button onClick={onClose}><X size={24} /></button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 pb-5 scrollbar-thin scrollbar-thumb-gray-200">
        {/* Categories Header */}
        <div className="flex justify-between items-center mt-4 mb-2">
          <h2 className="font-semibold text-[0.95rem] text-gray-900">Categories</h2>
          {!isMobile && hasActiveFilters() && (
            <button onClick={handleReset} className="text-[0.8rem] text-green-600 underline hover:text-green-700">
              Clear filters
            </button>
          )}
        </div>
        <div className="h-px bg-gray-200 mb-2"></div>

        {/* Categories List */}
        <div className="text-[#03045e]">
          {rfqCheck ? renderRfqCategories() : real?.map((category) => (
            <div key={category.id} className="mb-1">
              <Link
                href={`/dashboard/products/all-mineral-cp/${category?.tag}`}
                className={`block py-[10px] px-[8px] text-[.85rem] font-[500] border-b-[1px] border-b-gray-100 hover:text-green-600 transition-colors
                        ${pathname?.includes(category?.tag || '') ? 'bg-green-50 text-green-600 rounded-md' : ''}`}
                onClick={() => onClose()}
              >
                {category.name}
              </Link>
            </div>
          ))}
        </div>

        {/* Filters */}
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
          {/* Countries List - Placeholder since I didn't import countries yet */}
          {/* <div className="max-h-[160px] overflow-y-auto border border-gray-100 rounded-md p-2 space-y-2">
                    {filteredCountries.map((country: any) => (
                        <label key={country.name} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input 
                                type="checkbox" 
                                name={country.name}
                                checked={filters.location?.includes(country.name) || false}
                                onChange={handleLocationChange}
                                className="rounded text-green-600 focus:ring-green-500"
                            />
                            <span>{country.name}</span>
                        </label>
                    ))}
                 </div> */}
        </div>

        {/* Sort By */}
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
                  className="text-green-600 focus:ring-green-500"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price */}
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
              className="w-full py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
            >
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SideBar;
