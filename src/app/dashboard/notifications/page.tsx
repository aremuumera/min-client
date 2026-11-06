'use client';

import * as React from 'react';
import { Button, DropdownSelect, FilterBar, PageHeader, PaginationBar } from '@/components/ui';
import { InboxRow, useLiveInbox } from '@/components/notifications/inbox';
import { toApiError } from '@/lib/api/errors';
import { notificationsHelp } from '@/lib/help/notifications';
import { CATEGORY_TEXT, needsAck, PRIORITY_TEXT } from '@/lib/notifications';
import { useGetInboxQuery, useReadAllMutation } from '@/redux/features/notifications/notifications_api';

/* Notifications (step 2.13a, decision #113): the company's inbox. Chat messages stay with the chat. */
// CHAT is a settings topic only (chat message emails); no inbox notice has it
const CATEGORIES = Object.entries(CATEGORY_TEXT).filter(([value]) => value !== 'CHAT').map(([value, label]) => ({ value, label }));
const PRIORITIES = (['CRITICAL', 'HIGH', 'NORMAL'] as const).map((p) => ({ value: p, label: PRIORITY_TEXT[p] }));

export default function NotificationsPage() {
  useLiveInbox();
  const [unreadOnly, setUnreadOnly] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [priority, setPriority] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  React.useEffect(() => setPage(1), [unreadOnly, category, priority]);
  const list = useGetInboxQuery({ page, limit, unreadOnly: unreadOnly === 'true', category, priority });
  const [readAll, readAllState] = useReadAllMutation();
  const items = list.data?.data ?? [];
  const m = list.data?.meta;
  // notices waiting for an acknowledgement stay at the top
  const sorted = [...items.filter(needsAck), ...items.filter((n) => !needsAck(n))];
  return (
    <div>
      <PageHeader
        title="Notifications"
        help={notificationsHelp}
        description="Everything MINMEG tells your company. New notices appear at once."
        actions={m?.unread ? <Button variant="outlined" loading={readAllState.isLoading} onClick={() => readAll(category ? { category } : {}).unwrap().catch(() => undefined)}>Mark all as read</Button> : undefined}
      />
      <FilterBar activeCount={(unreadOnly ? 1 : 0) + (category ? 1 : 0) + (priority ? 1 : 0)} onClear={() => { setUnreadOnly(''); setCategory(''); setPriority(''); }}>
        <DropdownSelect aria-label="Show" value={unreadOnly} onValueChange={setUnreadOnly} options={[{ value: 'true', label: 'Unread only' }]} placeholder="All notices" className="md:w-44" />
        <DropdownSelect aria-label="Topic" value={category} onValueChange={setCategory} options={CATEGORIES} placeholder="All topics" className="md:w-56" />
        <DropdownSelect aria-label="Importance" value={priority} onValueChange={setPriority} options={PRIORITIES} placeholder="Any importance" className="md:w-44" />
      </FilterBar>
      {list.isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : list.error ? (
        <p className="text-sm text-semantic-error-text">{toApiError(list.error).message}</p>
      ) : !sorted.length ? (
        <p className="rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-500">No notifications{unreadOnly || category || priority ? ' match these filters' : ' yet'}.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white" aria-label="Notifications" data-testid="inbox-page">
          {sorted.map((n) => <InboxRow key={n.id} n={n} />)}
        </ul>
      )}
      <PaginationBar meta={m ? { currentPage: m.page, totalPages: m.totalPages, totalItems: m.total } : undefined} page={page} onPage={setPage} limit={limit} onLimit={(n) => { setLimit(n); setPage(1); }} />
    </div>
  );
}
