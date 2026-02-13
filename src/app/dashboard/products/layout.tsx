'use client';

import React, { useState } from 'react';
import SideBar from '@/components/marketplace/layout/sidebar';
import TopNav from '@/components/marketplace/layout/top-nav';
import { ViewModeProvider } from '@/contexts/view-product-mode';
import { Menu } from 'lucide-react';

export default function DashboardProductsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <ViewModeProvider>
            <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
                {/* Mobile Header with menu button */}
                <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between z-20">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-semibold text-gray-800">Marketplace</span>
                    <div className="w-8"></div> {/* Spacer for center alignment */}
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                    {/* Sidebar Desktop */}
                    <div className="hidden md:block h-full z-10">
                        <SideBar variant="desktop" />
                    </div>

                    {/* Sidebar Mobile */}
                    {/* Backdrop */}
                    {sidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black/50 z-30 md:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}

                    {/* Drawer */}
                    <div
                        className={`fixed inset-y-0 left-0 w-[280px] bg-white z-40 transform transition-transform duration-300 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                    >
                        <SideBar variant="mobile" onClose={() => setSidebarOpen(false)} />
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                        <TopNav />
                        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
                            {children}
                        </main>
                    </div>
                </div>
            </div>
        </ViewModeProvider>
    );
}
