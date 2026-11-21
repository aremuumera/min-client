'use client';

import * as React from 'react';
import { CopyableId, StatusBadge } from '@/components/ui';
import { SIGNATURE_LABEL, signatureTone } from '@/lib/company-signature';
import { formatDateTime } from '@/lib/format';
import { useGetCompanySignatureQuery } from '@/redux/features/proof/proof_api';

/**
 * Decision #143: the company key's signature on the published version, for the owner and staff.
 * Anyone can check it: recover the address from the signed text and the signature (EIP-191) and
 * compare it with the key's address. The public sees only "signed" and whether it holds.
 */
export function CompanySignatureBlock({ passportId }: { passportId: string }) {
  const q = useGetCompanySignatureQuery(passportId);
  const [open, setOpen] = React.useState(false);
  const s = q.data?.data.signature;
  if (!s) return null;
  return (
    <section className="space-y-2 rounded-lg border border-gray-200 p-3 text-sm" aria-label="Company signature" data-testid="company-signature">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={signatureTone(s.status)}>{SIGNATURE_LABEL[s.status]}</StatusBadge>
        {s.keyNumber && <span className="text-gray-500">Key {s.keyNumber}{s.signedAt ? ` · ${formatDateTime(s.signedAt)}` : ''}</span>}
      </div>
      {s.status === 'COMPROMISED' && <p className="text-gray-500">This version was signed after the moment the key may have been stolen, so the signature is not trusted. MINMEG&apos;s own seal and proof still hold.</p>}
      {s.address && <CopyableId value={s.address} label="Address" />}
      {s.message && (
        <button type="button" className="text-xs font-medium text-primary underline" onClick={() => setOpen((x) => !x)}>{open ? 'Hide' : 'Show'} what was signed</button>
      )}
      {open && s.message && (
        <div className="space-y-1 text-xs text-gray-500">
          <pre className="whitespace-pre-wrap break-all rounded bg-gray-50 p-2 font-mono text-gray-900">{s.message}</pre>
          <p className="break-all font-mono">{s.signature}</p>
          <p>To check it anywhere: recover the address from this text and signature ({s.standard}) and compare it with the address above.</p>
        </div>
      )}
    </section>
  );
}
