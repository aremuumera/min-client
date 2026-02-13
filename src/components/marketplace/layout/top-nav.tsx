
"use client";

import { useViewMode } from '@/contexts/view-product-mode';
import { paths } from '@/config/paths';
import Link from 'next/link';
import { generateMarketplaceBreadcrumbs } from '@/lib/breadcrumbs';
import { useParams, usePathname } from 'next/navigation';
import { LayoutGrid, List } from 'lucide-react';

const TopNav = () => {
  const { isGridView, setIsGridView } = useViewMode();
  const pathname = usePathname();
  const params = useParams();
  const breadcrumbs = generateMarketplaceBreadcrumbs(pathname, params as any);

  return (
    <div className="px-4 py-4 w-full bg-white shadow-sm border-b border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Breadcrumbs and Links */}
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <div className="flex flex-col gap-2">
            {/* Dynamic Breadcrumbs */}
            <div className="flex items-center flex-wrap overflow-hidden text-gray-500 text-xs sm:text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center shrink-0">
                  {index > 0 && <span className="mx-2 text-gray-300">/</span>}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="font-semibold text-gray-700 truncate max-w-[150px] sm:max-w-none">
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

            <div className="flex flex-wrap gap-3 text-xs sm:text-sm pt-2">
              {/* <Link className="text-green-600 underline decoration-green-200 hover:decoration-green-600 transition-all font-medium" href={paths.postYouRfq}>
                Post your RFQ
              </Link> */}
              <Link className="text-green-600 underline decoration-green-200 hover:decoration-green-600 transition-all font-medium" href={paths.marketplace.recentRfQ}>
                View Recent RFQ
              </Link>
              <Link className="text-green-600 underline decoration-green-200 hover:decoration-green-600 transition-all font-medium" href={paths.marketplace.allCp}>
                View All Products
              </Link>
            </div>
          </div>
        </div>

        {/* View Mode Buttons */}
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => setIsGridView(true)}
            className={`p-2 rounded-md transition-all duration-200 ${isGridView
              ? 'bg-green-50 text-green-600 border border-green-200 shadow-sm'
              : 'text-gray-400 hover:text-gray-600 border border-transparent hover:border-gray-200'
              }`}
            title="Grid View"
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setIsGridView(false)}
            className={`p-2 rounded-md transition-all duration-200 ${!isGridView
              ? 'bg-green-50 text-green-600 border border-green-200 shadow-sm'
              : 'text-gray-400 hover:text-gray-600 border border-transparent hover:border-gray-200'
              }`}
            title="List View"
          >
            <List size={20} />
          </button>
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