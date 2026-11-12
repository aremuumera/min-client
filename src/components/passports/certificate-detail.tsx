'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Alert, Button, ConfirmDialog, CopyableId, FormField, Input, KeyValueList, StatusBadge, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { downloadCertificatePdf } from '@/lib/download-pdf';
import { formatDate, formatDateTime } from '@/lib/format';
import { CERTIFICATE_STATUS_TEXT, certificateTone, statementRows } from '@/lib/passports';
import { useGetCertificateQuery, useGetCertificatesQuery } from '@/redux/features/passports/passports_api';
import { useCreateEmailShareMutation, useGetEmailSharesQuery, useGetGrantsQuery, useRevokeEmailShareMutation, useRevokeGrantMutation } from '@/redux/features/vault/vaultApi';
import { useAppSelector } from '@/redux/hooks';
import { RecordTrail } from './passport-extras';
import { ProofSection } from '@/components/proof/proof-section';

/*
 * Certificates for companies (step 2.9d, decisions #76, #108): MINMEG's formal statements about
 * what it already checked. Only MINMEG issues them. The holder downloads the PDF and shares it by email,
 * read only, until a date (decision #119).
 */
export function useOrgId() {
  const { isTeamMember, ownerUserId, user } = useAppSelector((s) => s.auth);
  return ((isTeamMember ? ownerUserId : user?.id) as string | undefined) ?? null;
}

export function DownloadPdfButton({ id, code, label = 'Download PDF' }: { id: string; code: string; label?: string }) {
  const token = useAppSelector((s) => (s.auth as { token?: string | null }).token ?? null);
  const [busy, setBusy] = React.useState(false);
  return (
    <Button
      size="sm"
      variant="outlined"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await downloadCertificatePdf(id, code, token);
        } catch (err) {
          toast.error(toApiError(err).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {label}
    </Button>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** A share by email lasts at most 90 days (decision #119) */
const MAX_DAYS = 90;
const dayInput = (d: Date) => d.toISOString().slice(0, 10);
const endOf = (day: string) => new Date(`${day}T23:59:00`);

/**
 * Share a certificate or passport, read only, by email (decision #119). If the address is a MINMEG account
 * (an owner, or a team member → their company), that company gets it; otherwise MINMEG emails a link that
 * opens with a code sent to the address. The panel says the same either way. Shares made earlier by
 * company ID still show here and can be removed.
 */
export function SharePanel({ resourceType, resourceId }: { resourceType: 'CERTIFICATE' | 'PASSPORT'; resourceId: string }) {
  const thing = resourceType === 'PASSPORT' ? 'passport' : 'certificate';
  const shares = useGetEmailSharesQuery({ resourceType, resourceId });
  const grants = useGetGrantsQuery({ resourceType, resourceId, limit: 100 });
  const [create, createState] = useCreateEmailShareMutation();
  const [revokeShare, revokeShareState] = useRevokeEmailShareMutation();
  const [revokeGrant, revokeGrantState] = useRevokeGrantMutation();
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();
  const [adding, setAdding] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [until, setUntil] = React.useState(() => dayInput(new Date(Date.now() + 30 * 86400000)));
  const [reason, setReason] = React.useState('');
  const [removing, setRemoving] = React.useState<{ kind: 'share' | 'grant'; id: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const live = (shares.data?.data ?? []).filter((x) => x.status === 'ACTIVE');
  const older = (grants.data?.data ?? []).filter((g) => g.status === 'ACTIVE');
  // the date picker's range, from when the panel opened
  const [{ today, latest }] = React.useState(() => ({ today: dayInput(new Date(Date.now() + 86400000)), latest: dayInput(new Date(Date.now() + (MAX_DAYS - 1) * 86400000)) }));

  const give = async () => {
    setError(null);
    const address = email.trim();
    if (!EMAIL.test(address)) return setError('Enter a valid email address');
    if (!until) return setError('Choose until when they can see it');
    const end = endOf(until);
    if (end.getTime() <= Date.now()) return setError('Choose a date in the future');
    if (end.getTime() > Date.now() + MAX_DAYS * 86400000) return setError(`A share by email can last at most ${MAX_DAYS} days`);
    if (!(await confirm({ title: `Share this ${thing} with ${address}?`, description: `They can read it until ${formatDate(end.toISOString())}. They cannot change or download it. You can remove it at any time.`, confirmLabel: 'Share' }))) return;
    try {
      const res = await create({ resourceType, resourceId, email: address, expiresAt: end.toISOString(), ...(reason.trim() ? { reason: reason.trim() } : {}), idempotencyKey: key }).unwrap();
      done();
      toast.success(res.message ?? "Shared. We've emailed them.");
      setAdding(false);
      setEmail('');
      setReason('');
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  return (
    <section className="space-y-2 border-t border-gray-200 pt-4" aria-labelledby={`share-${resourceId}`}>
      <h4 id={`share-${resourceId}`} className="text-sm font-bold text-gray-900">Shared with</h4>
      {error && <Alert severity="error">{error}</Alert>}
      {(shares.isError || grants.isError) && <Alert severity="error">{toApiError(shares.error ?? grants.error).message}</Alert>}
      {!live.length && !older.length && !shares.isLoading && <p className="text-sm text-gray-500">Not shared with anyone.</p>}
      <ul className="space-y-1">
        {live.map((x) => (
          <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="break-all">
              <span className="font-medium text-gray-900">{x.email}</span> · until {formatDate(x.expiresAt)}
            </span>
            <Button size="sm" variant="text" onClick={() => setRemoving({ kind: 'share', id: x.id })}>Remove</Button>
          </li>
        ))}
        {older.map((g) => (
          <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>
              {g.granteeType === 'ORGANIZATION' ? 'Company' : 'Person'} <CopyableId value={g.granteeId} /> · {g.expiresAt ? `until ${formatDate(g.expiresAt)}` : 'no end date'}
            </span>
            <Button size="sm" variant="text" onClick={() => setRemoving({ kind: 'grant', id: g.id })}>Remove</Button>
          </li>
        ))}
      </ul>
      {adding ? (
        <div className="space-y-3 rounded-lg border border-gray-200 p-3">
          <FormField htmlFor={`share-email-${resourceId}`} label="Email address" required info={`If they have a MINMEG account, their company gets the ${thing}. If not, MINMEG emails them a link that opens with a code sent to that address.`}>
            <Input id={`share-email-${resourceId}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" placeholder="name@company.com" />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField htmlFor={`share-until-${resourceId}`} label="Until" required info={`At most ${MAX_DAYS} days`}>
              <Input id={`share-until-${resourceId}`} type="date" value={until} min={today} max={latest} onChange={(e) => setUntil(e.target.value)} />
            </FormField>
            <FormField htmlFor={`share-reason-${resourceId}`} label="Reason" optional>
              <Input id={`share-reason-${resourceId}`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} placeholder="e.g. due diligence for lot 12" />
            </FormField>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outlined" onClick={() => setAdding(false)}>Cancel</Button>
            <Button size="sm" loading={createState.isLoading} onClick={give}>Share</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outlined" onClick={() => setAdding(true)}>Share by email</Button>
      )}
      <ConfirmDialog
        open={!!removing}
        title="Stop sharing?"
        description="They can no longer open it."
        confirmLabel="Stop sharing"
        tone="error"
        reason={{ label: 'Reason', minLength: 3 }}
        loading={revokeShareState.isLoading || revokeGrantState.isLoading}
        onConfirm={async (why) => {
          if (removing?.kind === 'share') await revokeShare({ id: removing.id, reason: why ?? '' }).unwrap().catch((err) => setError(toApiError(err).message));
          if (removing?.kind === 'grant') await revokeGrant({ id: removing.id, reason: why ?? '' }).unwrap().catch((err) => setError(toApiError(err).message));
          setRemoving(null);
        }}
        onClose={() => setRemoving(null)}
      />
      {dialog}
    </section>
  );
}

/** One certificate: what MINMEG states, when, until when; download and (for the holder) share */
export function CertificateDetail({ certificateId }: { certificateId: string }) {
  const orgId = useOrgId();
  const query = useGetCertificateQuery(certificateId);
  const c = query.data?.data;
  if (query.isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (!c) return <Alert severity="error">{query.error ? toApiError(query.error).message : 'Certificate not found'}</Alert>;
  const v = c.currentVersion;
  return (
    <div className="space-y-4" data-testid={`certificate-${c.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-gray-900">{c.certificateType?.name ?? 'Certificate'} · {c.certificateCode}</p>
          <StatusBadge status={certificateTone(c)}>{c.status === 'ACTIVE' ? (c.issued ? 'Issued by MINMEG' : 'Not issued yet') : CERTIFICATE_STATUS_TEXT[c.status]}</StatusBadge>
        </div>
        {v && <DownloadPdfButton id={c.id} code={c.certificateCode} />}
      </div>
      {!v && <p className="text-sm text-gray-500">{c.status === 'ACTIVE' ? 'Nothing issued yet.' : 'MINMEG has suspended or revoked it, so its content is not shown.'}</p>}
      {v && (
        <>
          <KeyValueList columns={2} items={[{ label: 'Version', value: String(v.versionNumber) }, { label: 'Issued', value: v.issuedAt ? formatDateTime(v.issuedAt) : '—' }, { label: 'Valid until', value: v.expiresAt ? formatDateTime(v.expiresAt) : 'No end date' }]} />
          <section className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">What MINMEG states</h4>
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {statementRows(v.assertionData).map((r, i) => (
                <li key={i} className="grid gap-1 p-2 text-sm sm:grid-cols-[40%_1fr]">
                  <span className="text-gray-500">{r.label}</span>
                  <span className="break-words text-gray-900">{r.value}</span>
                </li>
              ))}
            </ul>
            {v.remarks && <p className="text-sm text-gray-600">MINMEG: {v.remarks}</p>}
          </section>
          {c.holderOrganizationId === orgId && <SharePanel resourceType="CERTIFICATE" resourceId={c.id} />}
        </>
      )}
      {c.publishedVersion && <ProofSection subjectType="CERTIFICATE_VERSION" subjectId={c.publishedVersion.id} publicCode={c.certificateCode} />}
      <RecordTrail id={c.id} />
    </div>
  );
}

/** The certificates on one record (a lab result, an inspection result, a shipment) */
export function CertificatesFor({ subjectId, onOpen }: { subjectId: string; onOpen: (id: string) => void }) {
  const list = useGetCertificatesQuery({ subjectId, limit: 20 });
  return (
    <>
      {(list.data?.data ?? []).map((c) => (
        <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{c.certificateType?.name ?? 'Certificate'}</p>
            <p className="text-xs text-gray-500">{c.certificateCode}{c.publishedVersion?.issuedAt ? ` · issued ${formatDateTime(c.publishedVersion.issuedAt)}` : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={certificateTone(c)}>{c.status === 'ACTIVE' ? 'Issued' : CERTIFICATE_STATUS_TEXT[c.status]}</StatusBadge>
            <Button size="sm" variant="outlined" onClick={() => onOpen(c.id)}>Open</Button>
          </div>
        </li>
      ))}
    </>
  );
}
