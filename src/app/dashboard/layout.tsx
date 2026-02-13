'use client';

import React from 'react';
import { DynamicLayout } from '@/components/dashboard/layout/layout';
import { AuthGuard } from '@/providers/auth-guard';
import { ChatProvider } from '@/providers/chat-provider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard>
            <ChatProvider>
                <DynamicLayout>
                    {children}
                </DynamicLayout>
            </ChatProvider>
        </AuthGuard>
    );
}
