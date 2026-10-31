'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Download, Eye, FileLock2 } from 'lucide-react';
import { Alert, Button } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { formatBytes, type ShareOpened } from '@/lib/vault';
import { useOpenShareLinkMutation } from '@/redux/features/vault/vaultApi';

/*
 * Opens a signed-in-only share link with this session (step 2.3 B5): the public page on the website
 * has no session, so it sends these links here. Nothing opens until the person clicks, because each
 * open counts towards the link's limit.
 */
export default function Page() {
  const { token } = useParams<{ token: string }>();
  const [open, state] = useOpenShareLinkMutation();
  const [opened, setOpened] = React.useState<ShareOpened | null>(null);
  const [error, setError] = React.useState<string>();

  const run = async () => {
    setError(undefined);
    try {
      setOpened((await open(token).unwrap()).data);
    } catch (err) {
      const apiError = toApiError(err);
      setError(apiError.status === 404 ? 'This link is not valid: it may have expired or been revoked.' : apiError.status === 403 ? 'This link was shared with someone else.' : apiError.message);
    }
  };

  const file = opened && !opened.verificationRequired ? opened : null;
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-feature text-primary-pressed">
        <FileLock2 className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="text-xl font-medium text-ink">A document was shared with you</h1>
      {error && <Alert severity="error" className="w-full text-left">{error}</Alert>}
      {opened?.verificationRequired && <Alert severity="info" className="w-full text-left">This link opens from the email it was sent to, with a code.</Alert>}
      {file ? (
        <>
          <p className="text-sm text-steel">
            {file.file.displayName} · {formatBytes(file.file.sizeBytes)}
          </p>
          <Button asChild startIcon={file.permission === 'DOWNLOAD' ? <Download className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}>
            <a href={file.url} target="_blank" rel="noopener noreferrer">
              {file.permission === 'DOWNLOAD' ? 'Download' : 'View'}
            </a>
          </Button>
          <p className="text-xs text-steel">This button works for a few minutes. After that, open the link again.</p>
        </>
      ) : (
        !opened?.verificationRequired && (
          <>
            <p className="text-sm text-steel">Opening it is recorded for the owner.</p>
            <Button onClick={run} loading={state.isLoading}>
              Open document
            </Button>
          </>
        )
      )}
    </div>
  );
}
