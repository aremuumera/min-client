'use client';

import { useParams, useRouter } from 'next/navigation';
import { Alert, PageHeader, Skeleton } from '@/components/ui';
import { RfqForm } from '@/components/rfqs/rfq-form';
import { paths } from '@/config/paths';
import { useAuthIdentity } from '@/hooks/use-auth-identity';
import { toApiError } from '@/lib/api/errors';
import { myRfqsHelp } from '@/lib/help/rfqs';
import { canEditRfq, type Rfq } from '@/lib/rfqs';
import { RequireAccess } from '@/lib/permissions';
import { useGetRfqDetailsForbuyQuery } from '@/redux/features/buyer-rfq/rfq-api';

/* Edit RFQ (step 2.6b): the same form as New RFQ */
export default function Page() {
  const { listedRfqId } = useParams<{ listedRfqId: string }>();
  const router = useRouter();
  const { effectiveUserId } = useAuthIdentity();
  const detail = useGetRfqDetailsForbuyQuery({ rfqId: listedRfqId }, { refetchOnMountOrArgChange: true });
  const rfq = (detail.data as { data?: Rfq } | undefined)?.data;
  const back = () => router.push(paths.dashboard.rfqs.list);
  return (
    <RequireAccess role={['buyer', 'buyer_supplier']} teamKey="rfq">
      <PageHeader title={rfq ? `Edit ${rfq.rfqProductName}` : 'Edit RFQ'} help={myRfqsHelp} />
      {detail.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : detail.isError || !rfq ? (
        <Alert severity="error">{toApiError(detail.error).message}</Alert>
      ) : !canEditRfq(rfq.status) ? (
        <Alert severity="info">This RFQ can no longer be edited.</Alert>
      ) : (
        effectiveUserId && <RfqForm key={rfq.rfqId} buyerId={effectiveUserId} rfq={rfq} onDone={back} onCancel={back} />
      )}
    </RequireAccess>
  );
}
