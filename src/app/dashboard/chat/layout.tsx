'use client';

import * as React from 'react';

import { ChatView } from '@/components/dashboard/chat/chat-view';

interface ChatLayoutProps {
    children: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
    return <ChatView>{children}</ChatView>;
}
