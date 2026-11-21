'use client';

import * as React from 'react';
import { Alert, Button, DownloadButton, DropdownSelect, FileDropZone, FormField, SideSheet, Switch } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { bulk, type BulkJob, type ImportKind, type ImportPreview } from '@/lib/bulk';
import { useAppSelector } from '@/redux/hooks';
import { BulkJobPanel } from './bulk-job-panel';

export interface ImportSheetProps {
  kind: ImportKind;
  open: boolean;
  onClose: () => void;
  /** Called when a job finished, so the list behind can reload */
  onImported?: () => void;
  /** Passports: the published passport templates to choose from */
  templates?: { value: string; label: string }[];
}

const TEXT: Record<ImportKind, { title: string; noun: string; intro: string }> = {
  batches: { title: 'Import batches', noun: 'batch', intro: 'Register many batches at once from a spreadsheet. One row is one batch.' },
  passports: { title: 'Import passports', noun: 'passport', intro: 'Make the passports of many batches at once from a spreadsheet. One row is one passport; the row names the batch by its code.' },
};

/**
 * Import from a spreadsheet in three steps (decision #128): choose the file, say which column is
 * which, then look at the check before anything is saved.
 */
export function ImportSheet({ kind, open, onClose, onImported, templates = [] }: ImportSheetProps) {
  const token = useAppSelector((s) => (s.auth as { token?: string | null }).token ?? null);
  const [file, setFile] = React.useState<File | null>(null);
  const [templateId, setTemplateId] = React.useState('');
  const [publish, setPublish] = React.useState(false);
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const [mapping, setMapping] = React.useState<Record<string, string>>({});
  const [job, setJob] = React.useState<BulkJob | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const t = TEXT[kind];
  const needsTemplate = kind === 'passports';
  const extra = needsTemplate ? { templateId, publish: publish ? 'true' : undefined } : {};

  const reset = () => {
    setFile(null);
    setPreview(null);
    setMapping({});
    setJob(null);
    setError(null);
  };
  const close = () => {
    reset();
    onClose();
  };
  const run = async (what: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await what();
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setBusy(false);
    }
  };
  const read = (f: File) =>
    run(async () => {
      setFile(f);
      const p = await bulk.preview(kind, f, extra, token);
      setPreview(p);
      setMapping(p.suggestedMapping);
    });
  const missing = preview?.fields.filter((f) => f.required && !mapping[f.key]) ?? [];
  const columns = (preview?.headers ?? []).map((h) => ({ value: h, label: h }));

  return (
    <SideSheet open={open} onClose={close} title={t.title} subtitle={job ? 'Step 3 of 3: check, then import' : preview ? 'Step 2 of 3: which column is which' : 'Step 1 of 3: the file'} size="lg">
      <div className="space-y-5" data-testid={`import-${kind}`}>
        {error && <Alert severity="error">{error}</Alert>}

        {!preview && !job && (
          <>
            <p className="text-sm text-steel">{t.intro} Nothing is saved until you have seen the check.</p>
            {needsTemplate && (
              <>
                <FormField label="Passport template" htmlFor="import-template" required>
                  <DropdownSelect id="import-template" value={templateId} onValueChange={setTemplateId} options={templates} placeholder="Choose the template" />
                </FormField>
                <Switch label="Publish the passports" description="Each passport is checked against the template and published. Off: they are saved as drafts for you to finish." checked={publish} onChange={(e) => setPublish(e.target.checked)} />
              </>
            )}
            {(!needsTemplate || templateId) && (
              <div className="flex flex-wrap gap-2">
                <DownloadButton path={`/imports/${kind}/template`} params={{ format: 'xlsx', ...(needsTemplate ? { templateId } : {}) }} fileName={`${kind}-template.xlsx`} data-testid="import-template-xlsx">Template (Excel)</DownloadButton>
                <DownloadButton path={`/imports/${kind}/template`} params={{ format: 'csv', ...(needsTemplate ? { templateId } : {}) }} fileName={`${kind}-template.csv`} variant="text">Template (CSV)</DownloadButton>
              </div>
            )}
            <FileDropZone label="Spreadsheet to import" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={busy || (needsTemplate && !templateId)} hint={needsTemplate && !templateId ? 'Choose the passport template first' : busy ? 'Reading the file…' : 'Excel (.xlsx) or CSV. The first row holds the column names. Up to 10,000 rows and 10 MB.'} onFiles={(files) => read(files[0])} />
          </>
        )}

        {preview && !job && file && (
          <>
            <p className="text-sm text-steel"><span className="font-medium text-ink">{file.name}</span>: {preview.totalRows.toLocaleString('en')} row{preview.totalRows === 1 ? '' : 's'}. We matched the columns we recognised. Change any that are wrong.</p>
            <div className="divide-y divide-hairline rounded-xl border border-hairline">
              {preview.fields.map((f) => (
                <div key={f.key} className="grid gap-2 px-3 py-2.5 sm:grid-cols-2 sm:items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{f.label}{f.required && <span className="text-semantic-error-text"> *</span>}</p>
                    <p className="text-xs text-steel">{f.hint}</p>
                  </div>
                  <DropdownSelect aria-label={`Column for ${f.label}`} value={mapping[f.key] ?? ''} onValueChange={(v) => setMapping((m) => { const next = { ...m }; if (v) next[f.key] = v; else delete next[f.key]; return next; })} options={columns} placeholder="Not in the file" error={f.required && !mapping[f.key]} />
                </div>
              ))}
            </div>
            {!!missing.length && <Alert severity="warning">Choose a column for: {missing.map((f) => f.label).join(', ')}.</Alert>}
            <div className="flex flex-wrap gap-2">
              <Button loading={busy} disabled={!!missing.length || !preview.totalRows} onClick={() => run(async () => setJob(await bulk.start(kind, file, { ...extra, mapping: JSON.stringify(mapping) }, token)))} data-testid="import-check">Check the file</Button>
              <Button variant="outlined" color="secondary" disabled={busy} onClick={reset}>Choose another file</Button>
            </div>
          </>
        )}

        {job && (
          <>
            <BulkJobPanel job={job} token={token} noun={t.noun} verb="import" onFinished={(j) => j.succeeded > 0 && onImported?.()} />
            <Button variant="text" onClick={reset}>Import another file</Button>
          </>
        )}
      </div>
    </SideSheet>
  );
}
