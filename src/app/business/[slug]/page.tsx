
import React from 'react';
import CompanyProfileView from '@/components/marketplace/pages/company-profile-view';

// This is an Async Server Component in Next.js 15/16
export default async function CompanyProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  return (
    <div className="w-full">
      <CompanyProfileView slug={slug} />
    </div>
  );
}
