import * as React from 'react';
import { PlansTable } from '@/sections/home/pricing/plans-table';
import { Faqs } from '@/sections/home/pricing/faqs';
import { Divider } from '@/components/ui';

export default function PricingPage() {
  return (
    <main>
      <PlansTable />
      <Divider />
      <Faqs />
    </main>
  );
}
