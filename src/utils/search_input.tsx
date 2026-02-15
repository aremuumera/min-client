import React, { useEffect, useRef, useState } from 'react';
import { useGetAllRfqQuery } from '@/redux/features/buyer-rfq/rfq-api';
import { useGetAllProductQuery } from '@/redux/features/supplier-products/products_api';
import { formatCompanyNameForUrl } from '@/utils/url-formatter';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Loader, Search } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useAppSelector } from '@/redux';

interface SearchInputProps {
  className?: string;
}

interface Category {
  value: string;
  label: string;
}

interface Product {
  id: string;
  name: string;
  companyName: string;
}

interface Rfq {
  id: string;
  name: string;
  companyName: string;
}


interface SearchResults {
  products: Product[];
  rfqs: Rfq[];
}


interface Variants {
  hidden: {
    opacity: number;
    y: number;
  };
  visible: {
    opacity: number;
    y: number;
  };
  exit: {
    opacity: number;
    y: number;
  };
}

const SearchInput = ({ className }: SearchInputProps) => {
  const { limit, page } = useAppSelector((state) => state.marketplace);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Character threshold for search
  const MIN_SEARCH_LENGTH = 2;
  const shouldSearch = searchTerm.trim().length >= MIN_SEARCH_LENGTH;

  const shouldQueryProducts =
    selectedCategory === 'all' ||
    selectedCategory === 'suppliers' ||
    selectedCategory === 'minerals' ||
    selectedCategory === '';

  const shouldQueryRfqs =
    selectedCategory === 'all' ||
    selectedCategory === 'buyers' ||
    selectedCategory === 'rfqs' ||
    selectedCategory === '';

  // API Queries
  const { data: productData, isLoading: isProductsLoading } = useGetAllProductQuery(
    {
      search: searchTerm,
      page: 1,
    },
    {
      skip: !shouldSearch || !shouldQueryProducts,
    }
  );

  const { data: rfqData, isLoading: isRfqLoading } = useGetAllRfqQuery(
    {
      limit,
      page,
      search: searchTerm,
    },
    {
      skip: !shouldSearch || !shouldQueryRfqs,
    }
  );

  // Process data for display
  const productsToShow = productData?.products?.slice(0, 6) || [];
  const rfqsToShow = rfqData?.data?.slice(0, 6) || [];

  const categories = [
    { value: '', label: 'All' },
    { value: 'buyers', label: 'Buyers' },
    { value: 'suppliers', label: 'Suppliers' },
    { value: 'minerals', label: 'Minerals' },
    { value: 'rfqs', label: 'RFQs' },
  ];

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim().length >= MIN_SEARCH_LENGTH) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  // Handle category selection
  const handleCategorySelect = (value: string) => {
    setSelectedCategory(value);
    setShowCategoryDropdown(false);
  };

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSearchTerm('');
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCurrentCategoryLabel = () => {
    const category = categories.find((cat) => cat.value === selectedCategory);
    return category ? category.label : 'All';
  };

  // Animation variants
  const dropdownVariants: any = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  useEffect(() => {
    if (showResults || showCategoryDropdown) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showResults, showCategoryDropdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSearchTerm('');
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={resultsRef} className="relative w-full max-w-[600px]">
      {/* <AnimatePresence>
        {(showResults || showCategoryDropdown) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm h-full z-50"
            style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
          />
        )}
      </AnimatePresence> */}
      {/* Search Input Container */}
      <div className="relative bg-white border border-[#E5E5E5] rounded-full flex items-center py-3 sm:px-4 px-3 focus-within:border-green-500 transition-colors">
        {/* Category Selector */}
        <div ref={categoryRef} className="relative">
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="flex items-center gap-1 sm:gap-2 text-gray-300 hover:text-white transition-colors pr-3 text-sm md:text-base whitespace-nowrap"
          >
            <span className="font-medium text-gray-400">{getCurrentCategoryLabel()}</span>
            <ChevronDown className={`w-4 h-4 transition-transform text-gray-400 ${showCategoryDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Category Dropdown */}
          <AnimatePresence>
            {showCategoryDropdown && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute top-full left-0 mt-2 bg-white border border-[#E5E5E5] rounded-lg shadow-xl py-2 min-w-[150px] z-50"
              >
                {categories.map((category) => (
                  <motion.button
                    key={category.value}
                    variants={itemVariants}
                    onClick={() => handleCategorySelect(category.value)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedCategory === category.value
                      ? 'bg-green-500/20 text-green-900'
                      : 'text-gray-500 hover:bg-[#E5E5E5] hover:text-green-900'
                      }`}
                  >
                    {category.label}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="w-px sm:mx-3 h-5 bg-gray-400 " />

        {/* Search Input */}
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search for any minerals"
          className="flex-1 bg-transparent border-none! focus:border-none! focus:outline-none! focus:ring-0!  text-gray-300 placeholder-gray-500 text-sm md:text-base"
        />

        {/* Search Icon */}
        <div className="ml-3">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showResults && shouldSearch && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute left-0 right-0 mt-2 bg-white border border-[#E5E5E5] rounded-lg shadow-2xl max-h-[60vh] overflow-y-auto z-50"
          >
            {/* Loading State */}
            {(isProductsLoading || isRfqLoading) && (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 text-green-500 animate-spin" />
              </div>
            )}

            {/* Products Section */}
            {!isProductsLoading && shouldQueryProducts && productsToShow.length > 0 && (
              <div>
                <div className="px-4 py-3 bg-white border-b border-[#E5E5E5]">
                  <h3 className="text-sm font-semibold text-gray-500">Products</h3>
                </div>
                {productsToShow.map((product: any) => (
                  <a
                    key={product.id}
                    href={`/dashboard/products/details/${product.id}/${formatCompanyNameForUrl(product?.product_name)}`}
                    onClick={() => {
                      setShowResults(false);
                      setSearchTerm('');
                    }}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-100 transition-colors border-b border-[#E5E5E5]"
                  >
                    {/* Product Image */}
                    <div className="w-12 h-12 shrink-0 rounded overflow-hidden bg-gray-800">
                      <img
                        src={product.images?.[0] || '/api/placeholder/50/50'}
                        alt={product.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-black truncate">{product.product_name}</h4>
                      <p className="text-xs text-gray-400 mt-1">
                        {product.product_category} | {product.storeProfile?.company_name}
                      </p>
                      <p className="text-sm font-semibold text-green-800 mt-1">${product.real_price}</p>
                    </div>
                  </a>
                ))}
                {productData?.products?.length > 6 && (
                  <a
                    href="/dashboard/products/all-mineral-cp"
                    onClick={() => {
                      setShowResults(false);
                      setSearchTerm('');
                    }}
                    className="block px-4 py-3 text-center text-sm font-medium text-green-800 hover:bg-slate-100 transition-colors"
                  >
                    View all products
                  </a>
                )}
              </div>
            )}

            {/* RFQs Section */}
            {!isRfqLoading && shouldQueryRfqs && rfqsToShow.length > 0 && (
              <div>
                <div className="px-4 py-3 bg-white border-b border-[#E5E5E5]">
                  <h3 className="text-sm font-semibold text-gray-500">RFQs</h3>
                </div>
                {rfqsToShow.map((rfq: any, i: number) => (
                  <a
                    key={i}
                    href={`/dashboard/rfqs/details/${rfq.rfqId}/${formatCompanyNameForUrl(rfq?.rfqProductName)}`}
                    onClick={() => {
                      setShowResults(false);
                      setSearchTerm('');
                    }}
                    className="block px-4 py-3 hover:bg-gray-800/50 transition-colors border-b border-gray-800/30"
                  >
                    <h4 className="text-sm font-medium text-black">Looking For - {rfq.rfqProductName}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Quantity: {rfq.quantityRequired} {rfq.quantityMeasure}
                    </p>
                  </a>
                ))}
                {rfqData?.data?.length > 6 && (
                  <a
                    href="/dashboard/products/rfq-products"
                    onClick={() => {
                      setShowResults(false);
                      setSearchTerm('');
                    }}
                    className="block px-4 py-3 text-center text-sm font-medium text-green-800 hover:bg-slate-100 transition-colors"
                  >
                    View all RFQs
                  </a>
                )}
              </div>
            )}

            {/* No Results State */}
            {shouldSearch &&
              !isProductsLoading &&
              !isRfqLoading &&
              productsToShow.length === 0 &&
              rfqsToShow.length === 0 && (
                <div className="px-4 py-12 text-center">
                  <p className="text-gray-400">No results found for "{searchTerm}"</p>
                </div>
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchInput;
