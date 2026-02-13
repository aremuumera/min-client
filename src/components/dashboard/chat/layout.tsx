import * as React from 'react';

import { ChatView } from './chat_com/chat_view';

export function Layout({ children }: { children: React.ReactNode }) {
  return <ChatView>{children}</ChatView>;
}
