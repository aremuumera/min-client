'use client';

import * as React from 'react';
import { DataTable, DropdownSelect, FilterBar, PageHeader, PaginationBar, SideSheet, StatusBadge } from '@/components/ui';
import { CertificateDetail } from '@/components/passports/certificate-detail';
import { toApiError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';
import { certificatesHelp } from '@/lib/help/passports';
import { CERTIFICATE_STATUS_TEXT, certificateTone, type Certificate } from '@/lib/passports';
import { RequireAccess } from '@/lib/permissions';
import { useGetCertificatesQuery, useGetCertificateTypesQuery } from '@/redux/features/passports/passports_api';

/* Certificates (step 2.9d): the MINMEG certificates the company holds or may read */
function CertificatesPage() {
  const [type, setType] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  React.useEffect(() => setPage(1), [type, search]);
  const types = useGetCertificateTypesQuery({});
  const q = search.trim();
  const list = useGetCertificatesQuery({ page, limit, certificateType: type, ...(q.length >= 2 ? { q } : {}) });
  const [selected, setSelected] = React.useState<Certificate | null>(null);
  return (
    <div>
      <PageHeader title="Certificates" help={certificatesHelp} description="MINMEG's certificates about your goods, your shipments and your business, and those shared with you. Download each as a PDF." />
      <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search by certificate code" activeCount={type ? 1 : 0} onClear={() => setType('')}>
        <DropdownSelect aria-label="Kind" value={type} onValueChange={setType} options={(types.data?.data ?? []).map((t) => ({ value: t.code, label: t.name }))} placeholder="All kinds" className="md:w-56" />
      </FilterBar>
      <DataTable<Certificate>
        caption="Certificates"
        rows={list.isError ? undefined : list.data?.data}
        loading={list.isLoading || list.isUninitialized}
        error={list.isError ? toApiError(list.error).message : undefined}
        onRetry={list.refetch}
        empty={{ title: 'No certificates yet', description: 'MINMEG issues them once it has checked an inspection, a lab result, a compliance check, a shipment or your business.' }}
        getRowId={(r) => r.id}
        onRowClick={setSelected}
        columns={[
          { key: 'code', header: 'Certificate', mobile: 'title', cell: (r) => (<div><p className="font-medium text-ink">{r.certificateType?.name}</p><p className="text-sm text-steel">{r.certificateCode}</p></div>) },
          { key: 'issued', header: 'Issued', mobile: 'subtitle', cell: (r) => (r.publishedVersion?.issuedAt ? formatDateTime(r.publishedVersion.issuedAt) : '—') },
          { key: 'until', header: 'Valid until', cell: (r) => (r.publishedVersion?.expiresAt ? formatDateTime(r.publishedVersion.expiresAt) : 'No end date') },
          { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={certificateTone(r)}>{r.status === 'ACTIVE' ? 'Issued' : CERTIFICATE_STATUS_TEXT[r.status]}</StatusBadge> },
        ]}
      />
      <PaginationBar meta={list.data?.meta} page={page} onPage={setPage} limit={limit} onLimit={(n) => { setLimit(n); setPage(1); }} />
      {selected && (
        <SideSheet open onClose={() => setSelected(null)} title={selected.certificateCode} subtitle={selected.certificateType?.name}>
          <CertificateDetail certificateId={selected.id} />
        </SideSheet>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <RequireAccess role={['buyer', 'supplier', 'buyer_supplier']} teamKey="passports">
      <CertificatesPage />
    </RequireAccess>
  );
}
