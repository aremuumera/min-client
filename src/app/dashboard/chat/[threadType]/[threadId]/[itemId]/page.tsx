'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { ThreadView } from '@/components/dashboard/chat/thread-view';

export default function ChatThreadPage() {
  const params = useParams();
  const threadId = params?.threadId as string;

  return <ThreadView threadId={threadId} />;
}
