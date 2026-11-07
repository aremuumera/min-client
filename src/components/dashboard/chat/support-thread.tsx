'use client';

import * as React from 'react';
import Link from 'next/link';
import { FileText, Paperclip, X } from 'lucide-react';
import { Button, DropdownSelect, EmptyState, ErrorState, FormField, PageHeader, StatusBadge, Textarea } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { formatDateTime } from '@/lib/format';
import { supportHelp } from '@/lib/help/support';
import { compressImages } from '@/lib/images/compress';
import { useSse } from '@/lib/realtime/use-sse';
import { MAX_SUPPORT_FILES, type SupportMessage } from '@/lib/support';
import { useGetListingsQuery } from '@/redux/features/listings/listings_api';
import {
  useGetMySupportMessagesQuery,
  useGetMySupportQuery,
  useLazyGetMySupportMessagesQuery,
  useReadMySupportMutation,
  useSendSupportMessageMutation,
} from '@/redux/features/support/support_api';
import { useGetMyTradeInquiriesQuery, useGetReceivedInquiriesQuery } from '@/redux/features/trade/trade_api';

function Bubble({ message }: { message: SupportMessage }) {
  const mine = message.senderSide === 'COMPANY';
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] space-y-1 rounded-2xl border px-4 py-2 text-sm md:max-w-[65%] ${mine ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
        <p className="text-xs font-bold text-gray-500">{message.senderName}</p>
        {message.text && <p className="whitespace-pre-wrap break-words text-gray-900">{message.text}</p>}
        {message.attachments.map((file) => (
          <a key={file.url} href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 break-all text-xs font-medium text-emerald-700 hover:underline">
            <FileText className="h-3 w-3 shrink-0" aria-hidden />
            {file.name}
          </a>
        ))}
        {message.link && (
          <Link href={message.link.type === 'TRADE' ? `/dashboard/trade/details/${message.link.id}` : `/dashboard/products/details/${message.link.id}`} className="block break-all text-xs font-medium text-emerald-700 hover:underline">
            About {message.link.type === 'TRADE' ? 'trade' : 'listing'} {message.link.id}
          </Link>
        )}
        {message.createdAt && <p className="text-[11px] text-gray-400">{formatDateTime(message.createdAt)}</p>}
      </div>
    </div>
  );
}

function Composer() {
  const [text, setText] = React.useState('');
  const [files, setFiles] = React.useState<File[]>([]);
  const [about, setAbout] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const { key, done } = useIdempotencyKey();
  const [send, { isLoading }] = useSendSupportMessageMutation();
  const sent = useGetMyTradeInquiriesQuery({ limit: 50 });
  const received = useGetReceivedInquiriesQuery({ limit: 50 });
  const listings = useGetListingsQuery({ mine: true, limit: 50 });
  const nameOf = (inq: any) => inq.product?.product_name || inq.item_name || inq.mineral_tag || 'Trade';
  const options = [
    ...[...(sent.data?.data ?? []), ...(received.data?.data ?? [])].map((inq: any) => ({ value: `TRADE:${inq.external_id}`, label: `Trade: ${nameOf(inq)} (${inq.external_id})` })),
    ...(listings.data?.data ?? []).map((l) => ({ value: `LISTING:${l.id}`, label: `Listing: ${l.product_name}` })),
  ];

  const addFiles = async (picked: FileList | null) => {
    if (!picked) return;
    const next = [...files, ...(await compressImages(picked))];
    if (next.length > MAX_SUPPORT_FILES) setError(`You can attach up to ${MAX_SUPPORT_FILES} files to a message.`);
    setFiles(next.slice(0, MAX_SUPPORT_FILES));
  };

  const submit = async () => {
    setError(null);
    const form = new FormData();
    if (text.trim()) form.append('text', text.trim());
    if (about) {
      const [type, id] = about.split(':');
      form.append('linkType', type);
      form.append('linkId', id);
    }
    files.forEach((f) => form.append('files', f));
    try {
      await send({ form, idempotencyKey: key }).unwrap();
      done();
      setText('');
      setFiles([]);
      setAbout('');
    } catch (err) {
      // The draft stays, so nothing is lost
      setError(toApiError(err).message);
    }
  };

  return (
    <div className="flex-none space-y-3 border-t border-gray-200 bg-white p-3 sm:p-4">
      <FormField htmlFor="support-message" label="Your message">
        <Textarea id="support-message" value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={4000} placeholder="Write to MINMEG" />
      </FormField>
      {options.length > 0 && (
        <FormField htmlFor="support-about" label="About" optional info="Point staff at the trade or listing this is about.">
          <DropdownSelect id="support-about" aria-label="About" value={about} onValueChange={setAbout} placeholder="Nothing specific" searchable options={options} />
        </FormField>
      )}
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs">
              <span className="max-w-40 truncate">{f.name}</span>
              <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, n) => n !== i))} className="p-1 text-gray-500 hover:text-gray-900">
                <X className="h-3 w-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center justify-between gap-2">
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
          <Paperclip className="h-4 w-4" aria-hidden />
          Attach files
          <input type="file" multiple className="sr-only" onChange={(e) => { void addFiles(e.target.files); e.target.value = ''; }} />
        </label>
        <Button disabled={(!text.trim() && !files.length) || isLoading} onClick={submit}>{isLoading ? 'Sending…' : 'Send'}</Button>
      </div>
    </div>
  );
}

/** The company's conversation with MINMEG, behind the Admin tab of Trade Chat */
export function SupportThread() {
  const conversation = useGetMySupportQuery(undefined, { refetchOnMountOrArgChange: true });
  const latest = useGetMySupportMessagesQuery({ limit: 30 }, { refetchOnMountOrArgChange: true });
  const [loadOlder, older] = useLazyGetMySupportMessagesQuery();
  const [read] = useReadMySupportMutation();
  const [earlier, setEarlier] = React.useState<SupportMessage[]>([]);
  const [hasEarlier, setHasEarlier] = React.useState<boolean | null>(null);
  const bottom = React.useRef<HTMLDivElement>(null);
  const unread = conversation.data?.data?.unread ?? 0;

  useSse('/notifications/stream', (e) => {
    if (e.event === 'support') {
      void conversation.refetch();
      void latest.refetch();
    }
  });
  React.useEffect(() => {
    if (unread > 0) void read();
  }, [unread, read]);
  const newest = latest.data?.data.rows[0]?.id;
  React.useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [newest]);

  const rows = latest.data?.data.rows ?? [];
  const canLoadEarlier = hasEarlier ?? latest.data?.data.hasMore ?? false;
  const showEarlier = async () => {
    const oldest = earlier[earlier.length - 1]?.id ?? rows[rows.length - 1]?.id;
    const page = await loadOlder({ before: oldest, limit: 30 }).unwrap();
    setEarlier([...earlier, ...page.data.rows]);
    setHasEarlier(page.data.hasMore);
  };
  const seen = new Set(rows.map((m) => m.id));
  const all = [...rows, ...earlier.filter((m) => !seen.has(m.id))].reverse();
  const status = conversation.data?.data?.status;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-none border-b border-gray-200 bg-white px-3 pt-3 sm:px-6">
        <PageHeader title="MINMEG Support" help={supportHelp} description="Write to MINMEG staff at any time, about anything." meta={status ? <StatusBadge status={status} /> : undefined} />
      </div>
      <div className="flex-auto space-y-3 overflow-y-auto bg-gray-50 p-3 sm:p-6">
        {latest.isError ? (
          <ErrorState description={toApiError(latest.error).message} onRetry={latest.refetch} />
        ) : latest.isLoading ? (
          <p className="text-sm text-gray-500">Loading messages…</p>
        ) : !all.length ? (
          <EmptyState title="No messages yet" description="Send your first message below. Staff will answer here." />
        ) : (
          <>
            {canLoadEarlier && (
              <div className="flex justify-center">
                <Button variant="outlined" size="sm" disabled={older.isFetching} onClick={showEarlier}>{older.isFetching ? 'Loading…' : 'Load earlier messages'}</Button>
              </div>
            )}
            {all.map((m) => <Bubble key={m.id} message={m} />)}
          </>
        )}
        <div ref={bottom} />
      </div>
      <Composer />
    </div>
  );
}
