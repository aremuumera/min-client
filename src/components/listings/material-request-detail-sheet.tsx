'use client';

import Link from 'next/link';
import { Alert, Button, CopyableId, KeyValueList, SideSheet, Skeleton, StatusBadge } from '@/components/ui';
import { paths } from '@/config/paths';
import { toApiError } from '@/lib/api/errors';
import { formatDate } from '@/lib/format';
import { materialRequestLabel, materialRequestTone, type MaterialRequest } from '@/lib/listings';
import { useGetMaterialRequestQuery } from '@/redux/features/listings/listings_api';

/* MINMEG's answer comes first, because that is what the supplier opened this for */
function Answer({ request }: { request: MaterialRequest }) {
  if (request.status === 'PENDING') return <Alert severity="info">MINMEG is reviewing this request. You get a notification when there is an answer.</Alert>;
  if (request.status === 'REFUSED') {
    return (
      <Alert severity="error">
        <p className="font-medium">MINMEG did not add this material</p>
        <p className="mt-1">{request.reviewReason}</p>
      </Alert>
    );
  }
  return (
    <Alert severity="success">
      <p className="font-medium">{request.material?.name ?? request.requestedName} is on the material list</p>
      <p className="mt-1">You can now choose it on a listing. Every supplier can use it too.</p>
      {request.reviewReason && <p className="mt-1">MINMEG says: {request.reviewReason}</p>}
    </Alert>
  );
}

export function MaterialRequestDetailSheet({ requestId, onClose }: { requestId: string | null; onClose: () => void }) {
  const detail = useGetMaterialRequestQuery(requestId ?? '', { skip: !requestId });
  const request = detail.data?.data.id === requestId ? detail.data?.data : undefined;

  return (
    <SideSheet
      open={!!requestId}
      onClose={onClose}
      title={request?.requestedName ?? 'Material request'}
      subtitle={request && <StatusBadge tone={materialRequestTone(request.status)}>{materialRequestLabel(request.status)}</StatusBadge>}
      footer={
        request?.status === 'APPROVED' ? (
          <Link href={paths.dashboard.products.create}>
            <Button>Create a listing</Button>
          </Link>
        ) : undefined
      }
    >
      {detail.isError ? (
        <Alert severity="error">{toApiError(detail.error).message}</Alert>
      ) : !request ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="flex flex-col gap-5">
          <Answer request={request} />
          <KeyValueList
            items={[
              { label: 'Material you asked for', value: request.requestedName },
              ...(request.material ? [{ label: 'Name on the material list', value: request.material.name }] : []),
              { label: 'Where you said it belongs', value: request.suggestedCategory?.name ?? 'Not sure' },
              { label: 'Your note', value: request.note },
              { label: 'Sent', value: formatDate(request.createdAt) },
              { label: 'Answered', value: request.reviewedAt ? formatDate(request.reviewedAt) : 'Not yet' },
              { label: 'Request ID', value: <CopyableId value={request.id} /> },
            ]}
          />
        </div>
      )}
    </SideSheet>
  );
}
