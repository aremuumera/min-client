'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { ListingForm } from '@/components/listings/listing-form';
import { paths } from '@/config/paths';
import { listingsHelp } from '@/lib/help/listings';
import { RequireAccess } from '@/lib/permissions';

/* New listing (step 2.6 D2) */
export default function Page() {
  const router = useRouter();
  const back = () => router.push(paths.dashboard.products.list);
  return (
    <RequireAccess role={['supplier', 'buyer_supplier']} teamKey="products">
      <PageHeader title="New listing" help={listingsHelp} description="Start with the stock you are selling, then add the details buyers see." />
      <ListingForm listing={null} onDone={back} onCancel={back} />
    </RequireAccess>
  );
}
