'use client';

import * as React from 'react';
import { Alert, Button, Checkbox, ConfirmDialog, DropdownSelect, FormField, Input } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { CATEGORY_TEXT, type NotificationSettings } from '@/lib/notifications';
import { useGetNotificationSettingsQuery, useUpdateNotificationSettingsMutation } from '@/redux/features/notifications/notifications_api';

/*
 * Notification settings (step 2.13a, decision #113 D5): email and push per category, quiet hours,
 * language, MINMEG updates. In-app notices always arrive; critical ones always arrive, even in
 * quiet hours (platform rule). Team members read their company's settings; the owner changes them.
 */
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const ZONES = ['Africa/Lagos', 'Africa/Accra', 'Africa/Johannesburg', 'Africa/Nairobi', 'Africa/Kinshasa', 'Europe/London', 'Europe/Brussels', 'Asia/Dubai', 'Asia/Shanghai', 'America/New_York', 'UTC'];

export function NotificationSettingsForm() {
  const query = useGetNotificationSettingsQuery();
  const [save, { isLoading }] = useUpdateNotificationSettingsMutation();
  const s = query.data?.data;
  const [draft, setDraft] = React.useState<NotificationSettings['notifications'] | null>(null);
  const [announcements, setAnnouncements] = React.useState(true);
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  React.useEffect(() => {
    if (s) {
      setDraft(s.notifications);
      setAnnouncements(s.announcementsEnabled);
    }
  }, [s]);
  if (query.isLoading || !draft || !s) return <p className="text-sm text-gray-500">{query.error ? toApiError(query.error).message : 'Loading…'}</p>;
  const editable = s.editable;
  const on = (cat: string, ch: 'email' | 'push') => draft.categories[cat]?.[ch] !== false;
  const setCat = (cat: string, ch: 'email' | 'push', v: boolean) => setDraft({ ...draft, categories: { ...draft.categories, [cat]: { ...draft.categories[cat], [ch]: v } } });
  const q = draft.quietHours;
  const problem = q.enabled && (!HHMM.test(q.start) || !HHMM.test(q.end)) ? 'Quiet hours: times as HH:mm, for example 22:00.' : null;
  const submit = async () => {
    setError(null);
    setSaved(false);
    try {
      await save({ channels: draft.channels, categories: draft.categories, quietHours: q, locale: draft.locale, announcementsEnabled: announcements }).unwrap();
      setSaved(true);
    } catch (err) {
      setError(toApiError(err).message);
    }
    setConfirming(false);
  };
  return (
    <div className="space-y-8" data-testid="notification-settings">
      {!editable && <Alert severity="info">These are your company’s settings. Only the account owner can change them.</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      {saved && <Alert severity="success">Settings saved.</Alert>}
      <section className="space-y-2">
        <h2 className="text-base font-bold text-gray-900">How you hear from MINMEG</h2>
        <p className="text-sm text-gray-500">Every notice always appears in your notifications here. Critical notices are always emailed too, even during quiet hours.</p>
        <div className="flex flex-wrap gap-6">
          <Checkbox label="Email" checked={draft.channels.email} disabled={!editable} onChange={(e) => setDraft({ ...draft, channels: { ...draft.channels, email: e.target.checked } })} />
          <Checkbox label="Phone notifications" checked={draft.channels.push} disabled={!editable} onChange={(e) => setDraft({ ...draft, channels: { ...draft.channels, push: e.target.checked } })} />
        </div>
      </section>
      <section className="space-y-2">
        <h2 className="text-base font-bold text-gray-900">By topic</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm" aria-label="By topic">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr><th className="p-3">Topic</th><th className="p-3">Email</th><th className="p-3">Phone</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {s.categories.map((cat) => (
                <tr key={cat} data-testid={`setting-${cat}`}>
                  <td className="p-3 text-gray-900">{CATEGORY_TEXT[cat] ?? cat}</td>
                  <td className="p-3"><Checkbox aria-label={`${CATEGORY_TEXT[cat] ?? cat} by email`} checked={on(cat, 'email')} disabled={!editable || !draft.channels.email} onChange={(e) => setCat(cat, 'email', e.target.checked)} /></td>
                  <td className="p-3"><Checkbox aria-label={`${CATEGORY_TEXT[cat] ?? cat} on the phone`} checked={on(cat, 'push')} disabled={!editable || !draft.channels.push} onChange={(e) => setCat(cat, 'push', e.target.checked)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">Quiet hours</h2>
        <Checkbox label="No email or phone notifications during these hours" description="They wait until the quiet hours end. Critical notices still arrive." checked={q.enabled} disabled={!editable} onChange={(e) => setDraft({ ...draft, quietHours: { ...q, enabled: e.target.checked } })} />
        {q.enabled && (
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField htmlFor="qh-start" label="From" required>
              <Input id="qh-start" type="time" value={q.start} disabled={!editable} onChange={(e) => setDraft({ ...draft, quietHours: { ...q, start: e.target.value } })} />
            </FormField>
            <FormField htmlFor="qh-end" label="To" required>
              <Input id="qh-end" type="time" value={q.end} disabled={!editable} onChange={(e) => setDraft({ ...draft, quietHours: { ...q, end: e.target.value } })} />
            </FormField>
            <FormField htmlFor="qh-zone" label="Time zone" required>
              <DropdownSelect id="qh-zone" aria-label="Time zone" value={q.timezone} options={[...new Set([q.timezone, ...ZONES])].map((z) => ({ value: z, label: z.replace('_', ' ') }))} onValueChange={(v) => setDraft({ ...draft, quietHours: { ...q, timezone: v } })} disabled={!editable} />
            </FormField>
          </div>
        )}
      </section>
      <section className="space-y-2">
        <h2 className="text-base font-bold text-gray-900">MINMEG updates</h2>
        <Checkbox label="News and announcements from MINMEG" checked={announcements} disabled={!editable} onChange={(e) => setAnnouncements(e.target.checked)} />
      </section>
      {problem && <p className="text-sm text-gray-500">{problem}</p>}
      {editable && <Button disabled={!!problem} onClick={() => setConfirming(true)}>Save settings</Button>}
      <ConfirmDialog open={confirming} title="Save your notification settings?" description="They apply to your whole company, team members included." confirmLabel="Save" loading={isLoading} onConfirm={submit} onClose={() => setConfirming(false)} />
    </div>
  );
}
