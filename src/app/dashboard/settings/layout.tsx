'use client'
import { SettingsSideNav } from "@/components/dashboard/settings/side-nav";

// export default function SettingsLayout({ children }: { children: React.ReactNode }) {
//     return (
//         <div className="flex flex-col md:row gap-12">
//             <SettingsSideNav />
//             <div className="flex-1 min-w-0">
//                 {children}
//             </div>
//         </div>
//     );
// }
import * as React from 'react';
import { Box } from '@/components/ui/box';
import { Stack } from '@/components/ui/stack';
// import { SideNav } from './side-nav';

// import { SideNav } from '@/components/dashboard/settings/side-nav';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="max-w-7xl mx-auto p-4 lg:p-10 w-full animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-12">
                <SettingsSideNav />
                <div className="flex-1 min-w-0">
                    {children}
                </div>
            </div>
        </div>
    );
}
