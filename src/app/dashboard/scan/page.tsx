'use client';

import * as React from 'react';
import Link from 'next/link';
import { Alert, Button, CopyableId, KeyValueList, PageHeader, QrScanner, StatusBadge } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { scanHelp } from '@/lib/help/traceability';
import { RequireAccess } from '@/lib/permissions';
import { CODE_STATUS_LABELS, SCAN_RESULT_TEXT, UNIT_STATUS_LABELS, currentPosition, unitTypeLabel, type ScanResult } from '@/lib/traceability';
import { useLazyResolveCodeQuery } from '@/redux/features/traceability/traceability_api';

function ScanPage() {
  const [round, setRound] = React.useState(0);
  const [result, setResult] = React.useState<ScanResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [resolve, { isFetching }] = useLazyResolveCodeQuery();
  const onResult = React.useCallback(
    async (value: string) => {
      setError(null);
      setResult(null);
      // The place makes the scan more useful to MINMEG, but a scan works without it
      const where = await currentPosition().catch(() => ({}));
      try {
        setResult((await resolve({ value, ...where }).unwrap()).data);
      } catch (err) {
        setError(toApiError(err).message);
      }
    },
    [resolve],
  );
  const s = result?.subject;
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Scan a code" help={scanHelp} description="Check that a MINMEG label is genuine, and see the goods it belongs to." />
      {!result && !error ? (
        <QrScanner key={round} onResult={onResult} />
      ) : (
        <div className="space-y-4">
          {error && <Alert severity="error">{error}</Alert>}
          {result && (
            <>
              <Alert severity={result.genuine ? 'success' : 'error'}>{SCAN_RESULT_TEXT[result.result]}</Alert>
              {result.identifier && (
                <KeyValueList
                  items={[
                    { label: 'Reference', value: <CopyableId value={result.identifier.publicReference} />, wide: true },
                    { label: 'Code status', value: <StatusBadge status={result.identifier.status}>{CODE_STATUS_LABELS[result.identifier.status] ?? result.identifier.status}</StatusBadge> },
                    ...(s?.batch ? [{ label: 'Batch', value: s.batch.batchCode }] : []),
                    ...(s?.handlingUnit ? [{ label: 'Unit', value: `${unitTypeLabel(s.handlingUnit.unitType)}${s.handlingUnit.serialNumber ? ` ${s.handlingUnit.serialNumber}` : ''} · ${UNIT_STATUS_LABELS[s.handlingUnit.status] ?? s.handlingUnit.status}${s.handlingUnit.sealed ? ' · sealed' : ''}` }] : []),
                    ...(s?.shipment ? [{ label: 'Shipment', value: <Link className="text-primary underline" href={`/dashboard/shipments?shipment=${s.shipment.id}`}>{s.shipment.shipmentNumber}</Link> }] : []),
                  ]}
                />
              )}
              {result.identifier && !s?.batch && !s?.shipment && <p className="text-sm text-steel">You are not part of a trade on these goods, so only the status of the code is shown.</p>}
            </>
          )}
          <Button disabled={isFetching} onClick={() => { setResult(null); setError(null); setRound((r) => r + 1); }}>Scan another</Button>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <RequireAccess role={['buyer', 'supplier', 'buyer_supplier', 'inspector']} teamKey="traceability">
      <ScanPage />
    </RequireAccess>
  );
}
