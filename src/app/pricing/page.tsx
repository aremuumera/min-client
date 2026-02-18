"use client";

import * as React from 'react';
import { PlansTable } from '@/components/core/pricing/plans-table';
import { PricingBadgesPreview } from '@/components/core/pricing/badges';
import { Faqs } from '@/components/core/pricing/faqs';
import { Divider } from '@/components/ui/divider';
import { Button } from '@/components/ui/button';
import { Logo } from '@/utils/logo';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <main>
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo height={40} />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button>
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-col items-center py-4">
        <PricingBadgesPreview />
      </div>
      <PlansTable />
      <Divider />
      <Faqs />
    </main>
  );
}
