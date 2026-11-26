'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@/utils/logo';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { config } from '@/lib/config';

/*
 * 4B (owner, 2026-11-25): the page an email's "Unsubscribe" link opens. No sign-in: the link carries the
 * address and its signature, checked by the backend. The person confirms here (a link alone never
 * unsubscribes, so a mail scanner opening it changes nothing). Service emails still arrive.
 */
type Status = { email: string; unsubscribed: boolean; since: string | null };

async function call(path: string, init?: RequestInit): Promise<Status> {
  const res = await fetch(`${config.api.baseUrl}${path}`, init);
  const body = (await res.json().catch(() => null)) as { data?: Status; message?: string; error?: { message?: string } } | null;
  if (!res.ok || !body?.data) throw new Error(body?.error?.message || body?.message || 'Something went wrong. Try again.');
  return body.data;
}

function UnsubscribeForm() {
  const params = useSearchParams();
  const e = params.get('e') ?? '';
  const t = params.get('t') ?? '';
  const [status, setStatus] = React.useState<Status | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!e || !t) {
      setError('This unsubscribe link is not complete. Use the link from the email.');
      return;
    }
    call(`/email/unsubscribe?e=${encodeURIComponent(e)}&t=${encodeURIComponent(t)}`)
      .then(setStatus)
      .catch((err: Error) => setError(err.message));
  }, [e, t]);

  const confirm = async () => {
    setSaving(true);
    setError(null);
    try {
      setStatus(await call('/email/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ e, t }) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (error && !status) return <Alert severity="error">{error}</Alert>;
  if (!status) return <p className="text-sm text-gray-500">Loading…</p>;

  if (status.unsubscribed) {
    return (
      <div className="space-y-3">
        <Alert severity="success" title="You are unsubscribed">
          {status.email} will no longer get MINMEG notices or announcements by email.
        </Alert>
        <p className="text-sm text-gray-600">
          Emails about your account itself (sign-in codes, password resets, invitations) still arrive. Changed your mind? Switch email back on in your{' '}
          <Link href="/dashboard/settings/notifications" className="font-semibold text-primary-600 underline">notification settings</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">
        Stop MINMEG notices and announcements by email to <span className="font-semibold">{status.email}</span>?
      </p>
      <p className="text-sm text-gray-500">You still see everything in the app. Emails about your account itself (sign-in codes, password resets, invitations) still arrive.</p>
      {error && <Alert severity="error">{error}</Alert>}
      <div className="flex flex-wrap gap-3">
        <Button onClick={confirm} loading={saving}>Unsubscribe</Button>
        <Link href="/dashboard/settings/notifications" className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50">
          Choose which emails instead
        </Link>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <main className="min-h-screen bg-white px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo height={48} />
        </div>
        <div className="rounded-xl border border-gray-200 p-6">
          <h1 className="mb-4 text-lg font-bold text-gray-900">Email preferences</h1>
          <React.Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
            <UnsubscribeForm />
          </React.Suspense>
        </div>
      </div>
    </main>
  );
}
