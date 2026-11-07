'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { ListingForm } from '@/components/listings/listing-form';
import { ListingSaved } from '@/components/listings/listing-saved';
import { MaterialRequestLink } from '@/components/listings/material-request-form';
import { paths } from '@/config/paths';
import { listingsHelp } from '@/lib/help/listings';
import { RequireAccess } from '@/lib/permissions';

/* New listing (step 2.6 D2) */
export default function Page() {
  const router = useRouter();
  const back = () => router.push(paths.dashboard.products.list);
  const [published, setPublished] = React.useState<{ id: string; name: string } | null>(null);
  return (
    <RequireAccess role={['supplier', 'buyer_supplier']} teamKey="products">
      <PageHeader title="New listing" help={listingsHelp} description="Start with the stock you are selling, then add the details buyers see." />
      {published ? <ListingSaved id={published.id} name={published.name} /> : <ListingForm listing={null} sitesHref="/dashboard/sites" materialHelp={<MaterialRequestLink />} onDone={(id, live, name) => (live ? setPublished({ id, name }) : back())} onCancel={back} />}
    </RequireAccess>
  );
}
