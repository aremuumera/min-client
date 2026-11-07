'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { RfqForm } from '@/components/rfqs/rfq-form';
import { RfqSaved } from '@/components/rfqs/rfq-saved';
import { paths } from '@/config/paths';
import { useAuthIdentity } from '@/hooks/use-auth-identity';
import { myRfqsHelp } from '@/lib/help/rfqs';
import { RequireAccess } from '@/lib/permissions';

/* New RFQ (step 2.6b) */
export default function Page() {
  const router = useRouter();
  const { effectiveUserId } = useAuthIdentity();
  const back = () => router.push(paths.dashboard.rfqs.list);
  const [published, setPublished] = React.useState<{ id: string; name: string } | null>(null);
  return (
    <RequireAccess role={['buyer', 'buyer_supplier']} teamKey="rfq">
      <PageHeader title="New RFQ" help={myRfqsHelp} description="Tell suppliers and MINMEG what you need. It doesn't have to be on any list." />
      {published ? <RfqSaved id={published.id} name={published.name} /> : effectiveUserId && <RfqForm buyerId={effectiveUserId} rfq={null} onDone={(id, live, name) => (live ? setPublished({ id, name }) : back())} onCancel={back} />}
    </RequireAccess>
  );
}
