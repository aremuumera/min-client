import { useCallback, useState } from 'react';

/*
 * Idempotency keys for creates (backend `idempotent()`): one key per user action, reused when the
 * same action is retried (double tap, network retry), new after it succeeded. The backend then never
 * creates the record twice.
 */
export const newIdempotencyKey = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

export const idempotencyHeaders = (key: string) => ({ 'Idempotency-Key': key });

/** const { key, done } = useIdempotencyKey(); …mutation({ ...body, idempotencyKey: key }); on success: done() */
export function useIdempotencyKey() {
  const [key, setKey] = useState(newIdempotencyKey);
  const done = useCallback(() => setKey(newIdempotencyKey()), []);
  return { key, done };
}
