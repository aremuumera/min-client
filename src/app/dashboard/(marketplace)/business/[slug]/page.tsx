
import React from 'react';
import CompanyProfileView from '@/components/marketplace/pages/company-profile-view';

export default async function CompanyProfilePage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    return <CompanyProfileView slug={slug} />;
}
