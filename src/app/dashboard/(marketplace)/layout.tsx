'use client';

import React, { useState } from 'react';
import SideBar from '@/components/marketplace/layout/sidebar';
import TopNav from '@/components/marketplace/layout/top-nav';
import { ViewModeProvider } from '@/contexts/view-product-mode';

export default function MarketplaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <ViewModeProvider>
            <div className="flex flex-col h-full bg-gray-50 overflow-hidden relative">
                <div className="flex flex-1 overflow-hidden relative">
                    {/* Backdrop for Desktop & Mobile */}
                    {sidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-110 transition-opacity duration-300"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}

                    {/* Sidebar Drawer (Unified for Desktop and Mobile) */}
                    <div
                        className={`fixed inset-y-0 left-0 w-[280px] sm:w-[300px] bg-white z-150 shadow-2xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                    >
                        <SideBar variant="mobile" onClose={() => setSidebarOpen(false)} />
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                        <div className="sticky -top-20 z-40 bg-white  border-b border-gray-100">
                            <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} isSidebarOpen={sidebarOpen} />
                        </div>
                        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
                            {children}
                        </main>
                    </div>
                </div>
            </div>
        </ViewModeProvider>
    );
}
