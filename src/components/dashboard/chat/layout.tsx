import * as React from 'react';

import { ChatView } from './chat-view';

export function Layout({ children }: { children: React.ReactNode }) {
  return <ChatView>{children}</ChatView>;
}
