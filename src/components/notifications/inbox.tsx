'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Button, Popover, StatusBadge } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';
import { CATEGORY_TEXT, isUnread, needsAck, noticeHref, PRIORITY_TEXT, priorityTone, type InboxItem } from '@/lib/notifications';
import { useSse } from '@/lib/realtime/use-sse';
import { cn } from '@/utils/helper';
import { notificationsApi, useAcknowledgeOneMutation, useDismissOneMutation, useGetInboxQuery, useGetUnreadQuery, useReadAllMutation, useReadOneMutation } from '@/redux/features/notifications/notifications_api';
import { useAppDispatch } from '@/redux/hooks';

/*
 * The notification inbox (step 2.13a, decision #113): the bell and the list, live over SSE. Chat
 * messages are not here: they stay with the chat (Firestore).
 */

/** Keeps the inbox fresh: a new notice or a new count from the server refreshes the lists */
export function useLiveInbox() {
  const dispatch = useAppDispatch();
  useSse('/notifications/stream', (e) => {
    if (e.event === 'notification' || e.event === 'unread') dispatch(notificationsApi.util.invalidateTags(['Inbox']));
  });
}

/** One notice: what, when, how important; opening it marks it read and goes to its record */
export function InboxRow({ n, onOpened }: { n: InboxItem; onOpened?: () => void }) {
  const router = useRouter();
  const [read] = useReadOneMutation();
  const [dismiss] = useDismissOneMutation();
  const [ack, ackState] = useAcknowledgeOneMutation();
  const [error, setError] = React.useState<string | null>(null);
  const unread = isUnread(n);
  const open = async () => {
    if (unread) await read(n.id).unwrap().catch(() => undefined);
    const href = noticeHref(n.link);
    if (href) {
      router.push(href);
      onOpened?.();
    }
  };
  return (
    <li className={cn('space-y-1 p-3', unread && 'bg-primary-50/40')} data-testid={`notice-${n.id}`} data-unread={unread ? 'true' : 'false'}>
      <button type="button" onClick={open} className="block w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm text-gray-900', unread ? 'font-bold' : 'font-medium')}>{n.title}</p>
          {n.priority !== 'NORMAL' && n.priority !== 'LOW' && <StatusBadge tone={priorityTone(n.priority)}>{PRIORITY_TEXT[n.priority]}</StatusBadge>}
        </div>
        <p className="text-sm text-gray-600">{n.message}</p>
        <p className="text-xs text-gray-400">{CATEGORY_TEXT[n.category] ?? n.category} · {formatDateTime(n.createdAt)}{unread ? ' · unread' : ''}</p>
      </button>
      {error && <p className="text-xs text-semantic-error-text">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {needsAck(n) && (
          <Button size="sm" loading={ackState.isLoading} onClick={async () => {
            setError(null);
            try {
              await ack(n.id).unwrap();
            } catch (err) {
              setError(toApiError(err).message);
            }
          }}>Acknowledge</Button>
        )}
        {!needsAck(n) && <Button size="sm" variant="text" onClick={() => dismiss(n.id).unwrap().catch((err) => setError(toApiError(err).message))}>Dismiss</Button>}
      </div>
    </li>
  );
}

/** The bell in the header: the unread count and the latest notices */
export function InboxBell() {
  useLiveInbox();
  const [open, setOpen] = React.useState(false);
  const unread = useGetUnreadQuery();
  const latest = useGetInboxQuery({ limit: 8 }, { skip: !open });
  const [readAll, readAllState] = useReadAllMutation();
  const count = unread.data?.data.unread ?? 0;
  const items = latest.data?.data ?? [];
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      position="bottom"
      align="end"
      className="w-[calc(100vw-32px)] sm:w-[400px]"
      trigger={
        <button type="button" onClick={() => setOpen((o) => !o)} aria-label={count ? `Notifications (${count} unread)` : 'Notifications'} data-testid="inbox-bell" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100">
          <Bell size={20} strokeWidth={2.5} />
          {count > 0 && <span className="absolute right-1 top-1 min-w-[18px] rounded-full bg-semantic-error px-1 text-center text-[11px] font-bold leading-[18px] text-white" data-testid="inbox-count">{count > 9 ? '9+' : count}</span>}
        </button>
      }
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <p className="text-sm font-bold text-gray-900">Notifications</p>
        {count > 0 && <Button size="sm" variant="text" loading={readAllState.isLoading} onClick={() => readAll({}).unwrap().catch(() => undefined)}>Mark all as read</Button>}
      </div>
      <div className="max-h-[60vh] overflow-y-auto" data-testid="inbox-popover">
        {latest.isLoading ? (
          <p className="p-4 text-sm text-gray-500">Loading…</p>
        ) : !items.length ? (
          <p className="p-4 text-sm text-gray-500">No notifications yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">{items.map((n) => <InboxRow key={n.id} n={n} onOpened={() => setOpen(false)} />)}</ul>
        )}
      </div>
      <div className="border-t border-gray-200 px-4 py-2 text-right">
        <a href="/dashboard/notifications" className="text-sm font-medium text-primary hover:underline" onClick={() => setOpen(false)}>See all notifications</a>
      </div>
    </Popover>
  );
}
