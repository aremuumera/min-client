'use client';

import React from 'react';
import { DynamicLayout } from '@/components/dashboard/layout/layout';
import { AuthGuard } from '@/providers/auth-guard';
import { ChatProvider } from '@/providers/chat-provider';
// import { ChatProvider } from '@/components/dashboard/chat/chat_com/chat_context';

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
