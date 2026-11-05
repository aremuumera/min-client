'use client';

import * as React from 'react';
import { ExternalLink } from 'lucide-react';
import { Alert, Button, CopyableId, StatusBadge } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';
import { CHECK_TEXT, NETWORK_TEXT, type ChainCheck, type ProofSubject } from '@/lib/proof';
import { useCheckOnChainMutation, useGetChainChecksQuery, useGetInclusionQuery, useGetRecordProofsQuery } from '@/redux/features/proof/proof_api';

/*
 * The proof of a published or confirmed record (step 2.11c, decision #111 D3): in words, the
 * fingerprint MINMEG sealed, where it is on the blockchain, and "Check it now". Never keys, fees or
 * MINMEG's queue.
 */
function ChainLine({ check }: { check: ChainCheck }) {
  const on = check.metadata?.onChain;
  return (
    <div className="space-y-1 text-sm" data-testid="chain-check">
      <p className={check.status === 'VERIFIED' ? 'text-gray-900' : 'text-semantic-error-text'}>
        {CHECK_TEXT[check.status] ?? check.status} · checked {formatDateTime(check.verifiedAt ?? check.createdAt)}
        {check.confirmations !== null ? ` · ${check.confirmations} confirmations` : ''}
      </p>
      {on?.blockNumber && <p className="text-xs text-gray-500">Network {NETWORK_TEXT[check.metadata?.network ?? ''] ?? check.metadata?.network} · block {on.blockNumber}{on.anchoredAt ? ` · written ${formatDateTime(on.anchoredAt)}` : ''}</p>}
      {on?.transactionHash && <p className="break-all font-mono text-xs text-gray-500">{on.transactionHash}</p>}
      {on?.explorerUrl && (
        <a href={on.explorerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          See it on Polygonscan <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      )}
    </div>
  );
}

function Inclusion({ proofId }: { proofId: string }) {
  const [open, setOpen] = React.useState(false);
  const inclusion = useGetInclusionQuery(proofId, { skip: !open });
  const i = inclusion.data?.data;
  return (
    <div className="space-y-2">
      <Button size="sm" variant="text" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? 'Hide' : 'Show'} how this record is included</Button>
      {open && (inclusion.isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : !i ? (
        <p className="text-sm text-gray-500">{inclusion.error ? toApiError(inclusion.error).message : 'Not available'}</p>
      ) : (
        <div className="space-y-2 rounded-lg border border-gray-200 p-3 text-xs text-gray-700" data-testid="inclusion">
          <p>This record is position {i.leafIndex} of batch {i.batchCode}. Its fingerprint, combined step by step with the hashes below, gives the batch root written on the blockchain.</p>
          <p>Root <CopyableId value={i.rootHash} /></p>
          <ol className="list-decimal space-y-1 pl-5">
            {i.proofPath.map((s, n) => (
              <li key={n} className="break-all">{s.position === 'LEFT' ? 'On the left' : 'On the right'}: <span className="font-mono">{s.hash}</span></li>
            ))}
          </ol>
          <p className="text-gray-500">{i.howToVerify}</p>
        </div>
      ))}
    </div>
  );
}

/** The latest proof of one record: subjectType PASSPORT_VERSION, CERTIFICATE_VERSION, COMPLIANCE_ASSESSMENT, ESG_ASSESSMENT or CARBON_ASSESSMENT */
export function ProofSection({ subjectType, subjectId }: { subjectType: ProofSubject; subjectId: string }) {
  const proofs = useGetRecordProofsQuery({ subjectType, subjectId });
  const proof = proofs.data?.data[0];
  const checks = useGetChainChecksQuery(proof?.id ?? '', { skip: !proof?.anchoring.onChain });
  const [check, checkState] = useCheckOnChainMutation();
  const [error, setError] = React.useState<string | null>(null);
  const last = checks.data?.data[0];
  const state: { label: string; tone: 'success' | 'warning' | 'error' | 'neutral'; text: string } = !proof
    ? { label: 'Not protected yet', tone: 'neutral', text: 'MINMEG seals a record when it is published, issued or confirmed.' }
    : proof.status === 'INVALIDATED'
      ? { label: 'Seal withdrawn', tone: 'error', text: `MINMEG withdrew this seal${proof.invalidationReason ? `: ${proof.invalidationReason}` : ''}.` }
      : proof.anchoring.onChain
        ? { label: 'On the blockchain', tone: 'success', text: 'MINMEG sealed this record and wrote its fingerprint on the public blockchain. Anyone can check that it has not changed since.' }
        : { label: 'Sealed by MINMEG', tone: 'warning', text: 'MINMEG recorded this record’s fingerprint. It is waiting to be written on the blockchain.' };
  return (
    <section className="space-y-3 rounded-lg border border-gray-200 p-3" aria-label="Proof" data-testid="proof-section">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Proof</h4>
        <StatusBadge tone={state.tone} data-proof={!proof ? 'NONE' : proof.status === 'INVALIDATED' ? 'WITHDRAWN' : proof.anchoring.onChain ? 'ON_CHAIN' : 'SEALED'}>{state.label}</StatusBadge>
      </div>
      {proofs.isLoading ? <p className="text-sm text-gray-500">Loading…</p> : <p className="text-sm text-gray-700">{state.text}</p>}
      {error && <Alert severity="error">{error}</Alert>}
      {proof && (
        <>
          <p className="text-xs text-gray-500">Fingerprint ({proof.hashAlgorithm}) <CopyableId value={proof.dataHash} /> · sealed {formatDateTime(proof.createdAt)}</p>
          {proof.anchoring.onChain && (
            <>
              {last ? <ChainLine check={last} /> : <p className="text-sm text-gray-500">Not checked on the blockchain yet.</p>}
              <Button size="sm" variant="outlined" loading={checkState.isLoading} onClick={async () => {
                setError(null);
                try {
                  await check(proof.id).unwrap();
                } catch (err) {
                  setError(toApiError(err).message);
                }
              }}>Check it now</Button>
              {proof.anchoringMode === 'MERKLE_BATCH' && <Inclusion proofId={proof.id} />}
            </>
          )}
        </>
      )}
    </section>
  );
}
