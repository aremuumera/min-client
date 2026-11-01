'use client';

import { useParams, useRouter } from 'next/navigation';
import { Alert, PageHeader, Skeleton } from '@/components/ui';
import { ListingForm } from '@/components/listings/listing-form';
import { MaterialRequestPanel } from '@/components/listings/material-request-panel';
import { paths } from '@/config/paths';
import { toApiError } from '@/lib/api/errors';
import { listingsHelp } from '@/lib/help/listings';
import { RequireAccess } from '@/lib/permissions';
import { useGetListingQuery } from '@/redux/features/listings/listings_api';

/* Edit a listing (step 2.6 D2). Price and text change freely; stock stays in the batches. */
function EditListing() {
  const router = useRouter();
  const { listedSupplierProductId: id } = useParams<{ listedSupplierProductId: string }>();
  const detail = useGetListingQuery(id);
  const back = () => router.push(paths.dashboard.products.list);
  return (
    <>
      <PageHeader title={detail.data ? `Edit ${detail.data.data.product_name}` : 'Edit listing'} help={listingsHelp} />
      {detail.isLoading ? <Skeleton className="h-96 w-full" /> : detail.isError || !detail.data ? <Alert severity="error">{toApiError(detail.error).message}</Alert> : <ListingForm sitesHref="/dashboard/sites" materialHelp={<MaterialRequestPanel />} key={detail.data.data.id} listing={detail.data.data} onDone={back} onCancel={back} />}
    </>
  );
}

export default function Page() {
  return (
    <RequireAccess role={['supplier', 'buyer_supplier']} teamKey="products">
      <EditListing />
    </RequireAccess>
  );
}
