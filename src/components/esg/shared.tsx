'use client';

import * as React from 'react';
import { Alert, Button, ConfirmDialog, DropdownSelect, FormField, Input, Modal } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import type { UnitOption, Verification } from '@/lib/esg';
import { formatDate, formatDateTime } from '@/lib/format';
import { useGetUnitOptionsQuery } from '@/redux/features/esg/esg_api';
import { useGetFilesQuery } from '@/redux/features/vault/vaultApi';

/* What carbon and ESG assessments share (step 2.10): unit and document pickers, sending to MINMEG, the verifier box */
export const DECIMAL = /^\d{1,16}(\.\d{1,8})?$/;
export const CODE = /^[A-Z][A-Z0-9_]{1,63}$/;

export function useUnits() {
  const units = useGetUnitOptionsQuery();
  const all = units.data?.data ?? [];
  const emissions = all.filter((u) => u.measurementType?.code === 'EMISSIONS');
  const label = (u: UnitOption) => `${u.name ?? u.code} (${u.symbol})`;
  const symbol = (id: string | null | undefined) => all.find((u) => u.id === id)?.symbol ?? '';
  return { all, emissions, label, symbol };
}

/** The company's own documents */
export function useFileOptions() {
  const files = useGetFilesQuery({ limit: 100, page: 1 });
  return (files.data?.data ?? []).map((f) => ({ value: f.id, label: f.displayName }));
}

/** Send an assessment to MINMEG, with the independent verifier's report when there is one */
export function SendForm({ code, onSend, onClose }: { code: string; onSend: (body: Record<string, unknown>) => Promise<unknown>; onClose: () => void }) {
  const files = useFileOptions();
  const [f, setF] = React.useState({ name: '', standard: '', file: '', on: '' });
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const problem = !!f.name.trim() !== !!f.file ? 'The verifier’s name and their report go together.' : null;
  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await onSend(f.file ? { verifierName: f.name.trim(), statementFileId: f.file, ...(f.standard.trim() ? { verificationStandard: f.standard.trim() } : {}), ...(f.on ? { verifierVerifiedOn: f.on } : {}) } : {});
      onClose();
    } catch (err) {
      setConfirming(false);
      setError(toApiError(err).message);
    }
    setBusy(false);
  };
  return (
    <Modal open onClose={onClose} size="md">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Send to MINMEG</h3>
          <p className="mt-1 text-sm text-gray-500">MINMEG confirms a result only against an independent verifier’s report. Attach it now if you have it; MINMEG can also attach one it receives directly.</p>
        </div>
        {error && <Alert severity="error">{error}</Alert>}
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="cs-name" label="Verifier" optional info="The independent firm that checked it, for example Bureau Veritas Nigeria">
            <Input id="cs-name" value={f.name} onChange={(e) => set({ name: e.target.value })} maxLength={255} />
          </FormField>
          <FormField htmlFor="cs-standard" label="Standard they used" optional info="For example ISO 14067:2018, ISO 14064-3 or the IRMA assurance process">
            <Input id="cs-standard" value={f.standard} onChange={(e) => set({ standard: e.target.value })} maxLength={255} />
          </FormField>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="cs-file" label="Their report" optional>
            <DropdownSelect id="cs-file" aria-label="Their report" value={f.file} placeholder={files.length ? 'Choose' : 'No files in your documents'} options={files} onValueChange={(v) => set({ file: v })} searchable={files.length > 8} />
          </FormField>
          <FormField htmlFor="cs-on" label="Verified on" optional>
            <Input id="cs-on" type="date" value={f.on} onChange={(e) => set({ on: e.target.value })} />
          </FormField>
        </div>
        {problem && <p className="text-sm text-gray-500">{problem}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!!problem} onClick={() => setConfirming(true)}>Send</Button>
        </div>
      </div>
      <ConfirmDialog open={confirming} title={`Send ${code} to MINMEG?`} description="MINMEG confirms it or returns it with notes. You can't change it while MINMEG looks at it." confirmLabel="Send" loading={busy} onConfirm={submit} onClose={() => setConfirming(false)} />
    </Modal>
  );
}

/** Who checked it, and when MINMEG confirmed it */
export function VerificationBox({ v }: { v: Verification }) {
  if (!v.verifierName && !v.confirmedAt) return null;
  return (
    <div className="space-y-1 rounded-lg border border-gray-200 p-3 text-sm" aria-label="Verification">
      {v.verifierName && (
        <p className="text-gray-700">
          Checked by <span className="font-semibold text-gray-900">{v.verifierName}</span>
          {v.verificationStandard ? ` against ${v.verificationStandard}` : ''}
          {v.verifierVerifiedOn ? `, ${formatDate(v.verifierVerifiedOn)}` : ''}
        </p>
      )}
      {v.confirmedAt && <p className="text-gray-700">Confirmed by MINMEG {formatDateTime(v.confirmedAt)}{v.notes ? `: ${v.notes}` : ''}</p>}
    </div>
  );
}
