
import React from 'react';
import CompanyProfileView from '@/components/marketplace/pages/company-profile-view';

// This is a Server Component
export default function CompanyProfilePage({ params }: { params: { slug: string } }) {
  // params.slug corresponds to /business/[slug]
  return (
    <div className="w-full">
      <CompanyProfileView slug={params.slug} />
    </div>
  );
}
