'use client';

import * as React from 'react';
import { Alert, Button, DownloadButton, StatTile } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { bulk, jobIsMoving, JOB_STATUS_TEXT, type BulkItem, type BulkJob } from '@/lib/bulk';

/**
 * One bulk job from its check to its result (decision #128): what the check found, the button that
 * starts it for real, its progress, and the rows that failed. `noun` names what a row is.
 */
export function BulkJobPanel({ job: initial, token, noun, verb, onFinished }: { job: BulkJob; token: string | null; noun: string; verb: string; onFinished?: (job: BulkJob) => void }) {
  const [job, setJob] = React.useState(initial);
  const [bad, setBad] = React.useState<BulkItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const finished = React.useRef(false);

  // while the job moves on its own, ask for its state every 1.5 s
  React.useEffect(() => {
    if (!jobIsMoving(job)) return;
    const timer = setTimeout(() => bulk.job(job.id, token).then(setJob).catch((e) => setError(toApiError(e).message)), 1500);
    return () => clearTimeout(timer);
  }, [job, token]);

  // the rows to look at: those the check refused, then those the run could not do
  React.useEffect(() => {
    const result = job.status === 'CHECKED' && job.checkInvalid ? 'INVALID' : job.status === 'COMPLETED' && job.failed ? 'FAILED' : null;
    if (!result) return setBad([]);
    bulk.items(job.id, result, token).then(setBad).catch(() => setBad([]));
  }, [job.id, job.status, job.checkInvalid, job.failed, token]);

  React.useEffect(() => {
    if (finished.current || !['COMPLETED', 'CANCELLED', 'FAILED'].includes(job.status)) return;
    finished.current = true;
    onFinished?.(job);
  }, [job, onFinished]);

  const act = async (what: () => Promise<BulkJob>) => {
    setBusy(true);
    setError(null);
    try {
      setJob(await what());
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setBusy(false);
    }
  };
  const checking = job.status === 'CHECK_QUEUED' || job.status === 'CHECKING';
  const running = job.status === 'QUEUED' || job.status === 'RUNNING';
  const plural = (n: number) => `${n.toLocaleString('en')} ${noun}${n === 1 ? '' : 's'}`;

  return (
    <div className="space-y-4" data-testid="bulk-job" data-status={job.status}>
      {error && <Alert severity="error">{error}</Alert>}
      {checking && <Alert severity="info">Checking {plural(job.total)}: {(job.checkValid + job.checkInvalid).toLocaleString('en')} done. Nothing is saved during the check.</Alert>}
      {running && <Alert severity="info">Working: {job.processed.toLocaleString('en')} of {job.total.toLocaleString('en')} done. You can close this; it carries on.</Alert>}
      {job.status === 'FAILED' && <Alert severity="error">{job.error ?? 'The job stopped because of an error.'}</Alert>}
      {job.status === 'CANCELLED' && <Alert severity="warning">Cancelled. {job.succeeded ? `${plural(job.succeeded)} had already been done and stay done.` : 'Nothing was changed.'}</Alert>}

      {job.status === 'CHECKED' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile label="Ready" value={job.checkValid.toLocaleString('en')} hint={`of ${plural(job.total)}`} />
            <StatTile label="With a problem" value={job.checkInvalid.toLocaleString('en')} hint={job.checkInvalid ? 'See below' : 'None'} />
          </div>
          <Alert severity={job.checkInvalid ? 'warning' : 'success'}>
            {job.checkValid === 0 ? `No ${noun} passed the check, so there is nothing to ${verb}. Correct the problems below and try again.` : job.checkInvalid ? `Nothing is saved yet. You can ${verb} the ${plural(job.checkValid)} that passed and leave the rest out, or correct them first.` : `Nothing is saved yet. All ${plural(job.total)} passed the check.`}
          </Alert>
        </>
      )}
      {job.status === 'COMPLETED' && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Done" value={job.succeeded.toLocaleString('en')} />
            <StatTile label="Failed" value={job.failed.toLocaleString('en')} />
            <StatTile label="Left out" value={job.skipped.toLocaleString('en')} hint="Did not pass the check" />
          </div>
          <Alert severity={job.failed ? 'warning' : 'success'}>{job.failed ? `${plural(job.succeeded)} done. ${plural(job.failed)} could not be done; see below.` : `Finished: ${plural(job.succeeded)} done.`}</Alert>
        </>
      )}

      {!!bad.length && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-ink">{job.status === 'CHECKED' ? 'Problems found' : 'Could not be done'}{bad.length === 50 ? ' (first 50)' : ''}</p>
          <ul className="divide-y divide-hairline rounded-xl border border-hairline text-sm">
            {bad.map((i) => (
              <li key={i.id} className="px-3 py-2">
                <span className="font-medium text-ink">{job.fileName ? `Row ${i.position + 1}` : `Item ${i.position}`}{i.recordCode ? ` (${i.recordCode})` : ''}: </span>
                <span className="text-steel">{i.checkStatus === 'INVALID' ? i.checkMessage : i.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {job.status === 'CHECKED' && job.checkValid > 0 && (
          <Button loading={busy} onClick={() => act(() => bulk.run(job.id, job.checkInvalid > 0, token))} data-testid="bulk-run">
            {verb.charAt(0).toUpperCase() + verb.slice(1)} {plural(job.checkValid)}
          </Button>
        )}
        {(job.status === 'CHECKED' || checking || running) && (
          <Button variant="outlined" color="secondary" disabled={busy} onClick={() => act(() => bulk.cancel(job.id, token))}>Cancel</Button>
        )}
        {!checking && <DownloadButton path={`/bulk-jobs/${job.id}/items.csv`} fileName="rows.csv" variant="text">Every row with its result (CSV)</DownloadButton>}
      </div>
      <p className="text-xs text-steel">{JOB_STATUS_TEXT[job.status]}{job.fileName ? ` · ${job.fileName}` : ''}</p>
    </div>
  );
}
