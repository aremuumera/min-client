'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '@/redux/hooks';
import { config } from '@/lib/config';
import { subscribeSse, type SseEvent } from './sse';

/**
 * useSse('/notifications/stream', (e) => …) — subscribes while the component is mounted.
 * `path` is relative to the API base URL; null = not subscribed.
 */
export function useSse(path: string | null, onEvent: (e: SseEvent) => void) {
  const token = useAppSelector((s) => s.auth.token);
  const tokenRef = useRef(token);
  const handler = useRef(onEvent);
  // keep the latest token and handler without reconnecting
  useEffect(() => {
    tokenRef.current = token;
    handler.current = onEvent;
  });
  const [status, setStatus] = useState<'connecting' | 'open' | 'retrying' | 'closed'>('closed');

  useEffect(() => {
    if (!path) return;
    return subscribeSse({
      url: `${config.api.baseUrl}${path}`,
      getToken: () => tokenRef.current || (typeof window !== 'undefined' ? localStorage.getItem('chimpstate') : null),
      onEvent: (e) => handler.current(e),
      onStatus: setStatus,
    });
  }, [path]);

  return status;
}
