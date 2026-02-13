'use client';

import * as React from 'react';
import { ChatView } from '@/components/dashboard/chat/chat-view';
import { ChatView as InnerChatView } from '@/components/dashboard/chat/chat_com/chat_view';

export default function ChatThreadPage() {
  return (
    <ChatView>
      <InnerChatView />
    </ChatView>
  );
}
