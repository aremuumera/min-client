/*
 * Live updates over SSE (notifications, the tracking map, alerts). Read with fetch so the token goes
 * in the Authorization header (never in the URL, where logs would keep it). Reconnects with a
 * growing delay (1 s → 30 s) and stops when closed. Firestore stays for chat only.
 */
export interface SseEvent {
  event: string;
  data: unknown;
  id?: string;
}

export interface SseOptions {
  url: string;
  /** Read on every (re)connect, so a refreshed token is used */
  getToken: () => string | null | undefined;
  onEvent: (e: SseEvent) => void;
  onStatus?: (status: 'connecting' | 'open' | 'retrying' | 'closed') => void;
}

/** Splits an SSE text stream into events (handles events split across chunks) */
export function createSseParser(onEvent: (e: SseEvent) => void) {
  let buffer = '';
  return (chunk: string) => {
    buffer += chunk.replace(/\r\n/g, '\n');
    let end: number;
    while ((end = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      let event = 'message';
      let id: string | undefined;
      const data: string[] = [];
      for (const line of block.split('\n')) {
        if (!line || line.startsWith(':')) continue; // comment / keep-alive
        const i = line.indexOf(':');
        const field = i === -1 ? line : line.slice(0, i);
        const value = i === -1 ? '' : line.slice(i + 1).replace(/^ /, '');
        if (field === 'event') event = value;
        else if (field === 'data') data.push(value);
        else if (field === 'id') id = value;
      }
      if (!data.length) continue;
      const raw = data.join('\n');
      let parsed: unknown = raw;
      try {
        parsed = JSON.parse(raw);
      } catch {
        /* plain text data */
      }
      onEvent({ event, data: parsed, id });
    }
  };
}

/** Opens the stream; returns close() */
export function subscribeSse({ url, getToken, onEvent, onStatus }: SseOptions): () => void {
  let closed = false;
  let attempt = 0;
  let controller: AbortController | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const connect = async () => {
    if (closed) return;
    controller = new AbortController();
    onStatus?.(attempt ? 'retrying' : 'connecting');
    try {
      const token = getToken();
      const res = await fetch(url, { headers: { Accept: 'text/event-stream', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, credentials: 'include', signal: controller.signal });
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        // not allowed / not there: retrying would not help
        onStatus?.('closed');
        return;
      }
      if (!res.ok || !res.body) throw new Error(`stream answered ${res.status}`);
      attempt = 0;
      onStatus?.('open');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const parse = createSseParser(onEvent);
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        parse(decoder.decode(value, { stream: true }));
      }
    } catch {
      /* network drop or abort */
    }
    if (closed) return;
    attempt += 1;
    timer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** Math.min(attempt - 1, 5)));
  };

  void connect();
  return () => {
    closed = true;
    if (timer) clearTimeout(timer);
    controller?.abort();
    onStatus?.('closed');
  };
}
