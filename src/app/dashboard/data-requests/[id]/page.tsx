'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ErrorState, KeyValueList, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { DecidePanel } from '@/components/data-requests/decide-panel';
import { paths } from '@/config/paths';
import { toApiError } from '@/lib/api/errors';
import { EVENT_LABEL, ROLE_LABEL, SCOPE_LABEL, dataRequestStatusLabel, dataRequestTone } from '@/lib/data-requests';
import { formatDate, formatDateTime } from '@/lib/format';
import { dataRequestsHelp } from '@/lib/help/passports';
import { RequireAccess } from '@/lib/permissions';
import { useGetDataRequestQuery } from '@/redux/features/passports/passports_api';

const LEVEL = { PUBLIC: 'Public', PARTNERS: 'Partners', PRIVATE: 'Private' } as const;
function show(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/* One data request (decision #137): who asks and why, MINMEG's note, your decision, and what happened */
function DataRequestPage() {
  const { id } = useParams<{ id: string }>();
  const query = useGetDataRequestQuery(id);
  const r = query.data?.data;
  const back = <Link href={paths.dashboard.dataRequests} className="text-sm font-medium text-primary-700 underline">Data requests</Link>;
  if (query.isLoading || query.isUninitialized) return <div className="flex justify-center p-10"><Spinner /></div>;
  if (query.isError || !r) return <div className="space-y-3">{back}<ErrorState description={query.isError ? toApiError(query.error).message : 'Not found'} onRetry={() => void query.refetch()} /></div>;
  const minmegNote = [...r.events].reverse().find((e) => e.type === 'FORWARDED_TO_OWNER')?.note;
  return (
    <div className="space-y-5">
      <PageHeader title={`${r.requester.organization} asks for more of ${r.passportCode ?? 'your passport'}`} help={dataRequestsHelp} breadcrumbs={back} meta={<StatusBadge tone={dataRequestTone(r.status)}>{dataRequestStatusLabel(r.status)}</StatusBadge>} description={`Request ${r.requestCode}. MINMEG checked it before passing it to you.`} />
      <section className="rounded-xl border border-gray-200 p-4" aria-label="Who asks">
        <KeyValueList
          columns={2}
          items={[
            { label: 'Name', value: r.requester.name },
            { label: 'Organisation', value: r.requester.organization },
            { label: 'Email (confirmed)', value: r.requester.email },
            { label: 'They are', value: ROLE_LABEL[r.requester.role] ?? r.requester.role },
            { label: 'Why they need it', value: <span className="whitespace-pre-line">{r.purpose}</span>, wide: true },
            ...(minmegNote ? [{ label: 'Note from MINMEG', value: <span className="whitespace-pre-line">{minmegNote}</span>, wide: true }] : []),
            ...(r.scope ? [{ label: 'You shared', value: r.expiresAt ? `${SCOPE_LABEL[r.scope]}, until ${formatDate(r.expiresAt)}` : SCOPE_LABEL[r.scope] }] : []),
            ...(r.decisionNote ? [{ label: r.status === 'DECLINED' ? 'Reason' : 'Your note', value: r.decisionNote }] : []),
          ]}
        />
      </section>
      <DecidePanel request={r} />
      {r.disclosure && (
        <section className="space-y-3 rounded-xl border border-gray-200 p-4" aria-label="What they see">
          <h3 className="text-sm font-bold text-gray-900">What they see (version {r.disclosure.versionNumber}, copied on {formatDate(r.disclosure.approvedAt)})</h3>
          <ul className="divide-y divide-gray-200">
            {r.disclosure.fields.map((f) => (
              <li key={f.key} className="flex flex-col gap-1 py-2 text-sm sm:flex-row sm:justify-between sm:gap-4">
                <span className="text-gray-500">{f.label} · {LEVEL[f.visibilityLevel]}</span>
                <span className="break-words text-gray-900 sm:text-right">{f.document ? 'A document you hold (the file is not handed out)' : show(f.value)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="space-y-3 rounded-xl border border-gray-200 p-4" aria-label="What happened">
        <h3 className="text-sm font-bold text-gray-900">What happened</h3>
        <ol className="space-y-3" data-testid="data-request-history">
          {r.events.map((e) => (
            <li key={e.id} className="text-sm">
              <span className="font-medium text-gray-900">{e.type === 'DECLINED' ? (e.actorType === 'OWNER' ? 'You declined' : 'MINMEG declined') : e.type === 'REVOKED' ? (e.actorType === 'OWNER' ? 'You ended the access' : 'MINMEG ended the access') : (EVENT_LABEL[e.type] ?? e.type)}</span>
              <span className="text-gray-500"> · {formatDateTime(e.createdAt)}</span>
              {e.note && <p className="whitespace-pre-line break-words text-gray-700">{e.note}</p>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <RequireAccess role={['buyer', 'supplier', 'buyer_supplier']} teamKey="passports">
      <DataRequestPage />
    </RequireAccess>
  );
}
