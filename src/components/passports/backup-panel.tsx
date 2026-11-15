'use client';

import * as React from 'react';
import { Alert, Button, CopyableId, DownloadButton, StatusBadge, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { formatDate, formatDateTime } from '@/lib/format';
import { backupLabel, backupTone, type RecoveryLink } from '@/lib/passport-backups';
import { useCreateRecoveryLinkMutation, useGetPassportBackupsQuery } from '@/redux/features/passports/passports_api';

const size = (n: number | null) => (n === null ? '' : n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

/**
 * Decision #140: the independent backup. Each published version of a passport is copied to a store
 * outside MINMEG, so it stays readable even if MINMEG is not. The owner sees the copy of each
 * version, can take it back, and can get a link that reads straight from the store for 7 days.
 */
export function BackupPanel({ passportId, passportCode }: { passportId: string; passportCode: string }) {
  const q = useGetPassportBackupsQuery(passportId);
  const [createLink, linkState] = useCreateRecoveryLinkMutation();
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();
  const [link, setLink] = React.useState<RecoveryLink | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const d = q.data?.data;
  if (!d) return null;

  const getLink = async (versionId: string, versionNumber: number) => {
    setError(null);
    if (!(await confirm({ title: `Get a recovery link for version ${versionNumber}?`, description: 'The link reads the copy straight from the backup store for 7 days, without MINMEG. Anyone who has the link can read the passport, so keep it safe.', confirmLabel: 'Get the link' }))) return;
    try {
      setLink((await createLink({ id: passportId, versionId, idempotencyKey: key }).unwrap()).data);
      done();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  return (
    <section className="space-y-3 border-t border-gray-200 pt-4" aria-label="Independent backup" data-testid="passport-backup">
      <h4 className="text-sm font-bold text-gray-900">Independent backup</h4>
      {!d.configured ? (
        <p className="text-sm text-gray-500">MINMEG copies each published version to a separate store, so your passport stays readable even if MINMEG is not. The store is not switched on yet, so there is no copy.</p>
      ) : (
        <>
          <p className="text-sm text-gray-500">Each published version is copied to a separate store ({d.provider}), outside MINMEG&apos;s own systems, a few minutes after you publish. Your passport stays readable even if MINMEG is not.</p>
          {error && <Alert severity="error">{error}</Alert>}
          {!d.backups.length && <p className="text-sm text-gray-500">No copy yet. A published version is copied within a few minutes.</p>}
          {!!d.backups.length && (
            <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
              {d.backups.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm" data-testid={`backup-v${b.versionNumber}`}>
                  <div className="min-w-0">
                    <span className="font-medium text-gray-900">Version {b.versionNumber}</span>{' '}
                    <StatusBadge tone={backupTone(b)}>{backupLabel(b)}</StatusBadge>
                    <p className="text-xs text-gray-500">{b.status === 'DELIVERED' ? `Copied ${formatDateTime(b.deliveredAt)} · ${size(b.sizeBytes)}` : b.gaveUp ? 'MINMEG could not copy this version and has been told.' : 'MINMEG is working on it.'}</p>
                  </div>
                  {b.status === 'DELIVERED' && (
                    <div className="flex flex-wrap gap-2">
                      <DownloadButton path={`/certificates/${passportId}/backups/${b.passportVersionId}/download`} fileName={`${passportCode}-v${b.versionNumber}-backup.zip`} variant="text">Download the copy</DownloadButton>
                      {d.directLinks && <Button size="sm" variant="text" loading={linkState.isLoading} onClick={() => getLink(b.passportVersionId, b.versionNumber)} data-testid="backup-recovery-link">Get a recovery link</Button>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {link && (
            <div className="space-y-1 rounded-lg border border-gray-200 p-3 text-sm" data-testid="backup-link">
              <p className="font-medium text-gray-900">Recovery link for version {link.versionNumber}, valid until {formatDate(link.expiresAt)}</p>
              <CopyableId value={link.url} />
              <p className="text-xs text-gray-500">It opens the copy at {link.provider} without MINMEG. To check the file, compare its SHA-256 with this fingerprint:</p>
              <CopyableId value={link.contentHash} />
            </div>
          )}
        </>
      )}
      {dialog}
    </section>
  );
}
