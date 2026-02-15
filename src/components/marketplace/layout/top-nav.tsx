
"use client";

import { useViewMode } from '@/contexts/view-product-mode';
import { paths } from '@/config/paths';
import Link from 'next/link';
import { generateMarketplaceBreadcrumbs } from '@/lib/breadcrumbs';
import { useParams, usePathname } from 'next/navigation';
import { LayoutGrid, List, Filter } from 'lucide-react';
import SearchInput from '@/utils/search_input';

interface TopNavProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const TopNav = ({ onToggleSidebar, isSidebarOpen }: TopNavProps) => {
  const { isGridView, setIsGridView } = useViewMode();
  const pathname = usePathname();
  const params = useParams();
  const breadcrumbs = generateMarketplaceBreadcrumbs(pathname, params as any);

  return (
    <div className="px-4 py-4 w-full bg-[#F5F5F5] border rounded-[20px] border-[#E0E0E0] flex flex-col gap-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Left Side: Breadcrumbs and Filter Button */}
        <div className="flex items-center gap-4 w-full md:flex-1 md:min-w-0">
          <button
            onClick={onToggleSidebar}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 border ${isSidebarOpen
              ? 'bg-green-50 border-green-200 text-green-600'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            <Filter size={18} />
            <span className="text-sm font-medium">Filters</span>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-1">
              <div className="flex items-center flex-nowrap overflow-x-auto scrollbar-hide text-gray-500 text-xs sm:text-sm pb-1">
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center shrink-0">
                    {index > 0 && <span className="mx-2 text-gray-300">/</span>}
                    {index === breadcrumbs.length - 1 ? (
                      <span className="font-semibold text-gray-700 truncate max-w-[120px] sm:max-w-[200px] md:max-w-[250px]">
                        {crumb.title}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className={`
                          transition-colors duration-150
                          font-medium
                          hover:text-green-600
                          ${index === 0 ? 'text-green-600' : ''}
                        `}
                      >
                        {crumb.title}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Integrated Search Input */}
        <div className="w-full md:max-w-[500px] lg:max-w-[600px] flex-1">
          <SearchInput className="w-full" />
        </div>

        {/* Right Side: View Mode and Quick Links */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-3">
            <Link className="text-green-600 border-b border-green-200 hover:border-green-600 transition-all text-xs font-semibold whitespace-nowrap" href={paths.marketplace.recentRfQ}>
              RFQs
            </Link>
            <Link className="text-green-600 border-b border-green-200 hover:border-green-600 transition-all text-xs font-semibold whitespace-nowrap" href={paths.marketplace.allCp}>
              Products
            </Link>
          </div>

          <div className="hidden md:flex gap-1.5 p-1 bg-white rounded-lg border border-gray-100">
            <button
              onClick={() => setIsGridView(true)}
              className={`p-1.5 rounded-md transition-all duration-200 ${isGridView
                ? 'bg-[#E0E0E0] text-green-600 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
                }`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setIsGridView(false)}
              className={`p-1.5 rounded-md transition-all duration-200 ${!isGridView
                ? 'bg-[#E0E0E0] text-green-600 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
                }`}
              title="List View"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNav;



interface Crumb {
  title: string;
  href: string;
}

// Basic breadcrumb generator - typically this should be in a utility
const generateBreadcrumb = (pathname: string): Crumb[] => {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [{ title: 'Home', href: '/' }];

  let currentPath = '';
  parts.forEach((part) => {
    currentPath += `/${part}`;
    // Cleanup part for display (remove hyphens, capitalize)
    const title = part.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    crumbs.push({ title, href: currentPath });
  });

  return crumbs;
};