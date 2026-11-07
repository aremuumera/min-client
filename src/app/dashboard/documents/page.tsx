'use client';

import * as React from 'react';
import { Archive, FolderPlus, Pencil, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button, DataTable, FilterBar, DropdownSelect, PageHeader, PaginationBar, StatusBadge, useConfirm } from '@/components/ui';
import { FileDetailSheet } from '@/components/documents/file-detail-sheet';
import { FolderFormSheet, type FolderForm } from '@/components/documents/folder-form-sheet';
import { FolderTree, type FolderChoice } from '@/components/documents/folder-tree';
import { UploadSheet } from '@/components/documents/upload-sheet';
import { DocumentsTabs } from '@/components/documents/documents-tabs';
import { paths } from '@/config/paths';
import { toApiError } from '@/lib/api/errors';
import { formatDate } from '@/lib/format';
import { documentsHelp } from '@/lib/help/documents';
import { RequireAccess } from '@/lib/permissions';
import { FILE_CLASSES, flattenFolders, formatBytes, label, type VaultFile } from '@/lib/vault';
import { useArchiveFolderMutation, useGetFilesQuery, useGetFolderTreeQuery } from '@/redux/features/vault/vaultApi';

/*
 * Documents: the company's vault (docs/new/frontend/implementation/step-2.3-shared-resources-vault.md B1).
 * Folders on the left (a select on phones), the files of the chosen folder on the right.
 */
const STATUS_FILTERS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'QUARANTINED', label: 'Quarantined' },
];

function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function DocumentsPage() {
  const tree = useGetFolderTreeQuery();
  const [archiveFolder, archiveState] = useArchiveFolderMutation();
  const { confirm, dialog } = useConfirm();

  const [folder, setFolder] = React.useState<FolderChoice>('all');
  const [search, setSearch] = React.useState('');
  const [fileClass, setFileClass] = React.useState('');
  const [status, setStatus] = React.useState('ACTIVE');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const debounced = useDebounced(search.trim());
  React.useEffect(() => setPage(1), [folder, debounced, fileClass, status]);

  const files = useGetFilesQuery({ page, limit, search: debounced, fileClass, status, folderId: folder === 'all' ? undefined : folder });
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [folderForm, setFolderForm] = React.useState<FolderForm>(null);

  const current = folder !== 'all' && folder !== 'root' ? flattenFolders(tree.data?.data.folders ?? []).find((f) => f.id === folder) ?? null : null;
  const filterCount = (fileClass ? 1 : 0) + (status !== 'ACTIVE' ? 1 : 0);

  const archiveCurrent = async () => {
    if (!current) return;
    const ok = await confirm({
      title: `Archive ${current.name}?`,
      description: 'The folder, its sub-folders and the files in them are archived. Archived files can be restored one by one.',
      confirmLabel: 'Archive folder',
      tone: 'error',
    });
    if (!ok) return;
    try {
      await archiveFolder(current.id).unwrap();
      toast.success(`${current.name} archived`);
      setFolder('all');
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Documents"
        help={documentsHelp}
        description="Your company's secure vault. Only your company can open these files until you share them."
        actions={
          <>
            <Button variant="outlined" onClick={() => setFolderForm({ mode: 'create', parentId: current?.id ?? null })} startIcon={<FolderPlus className="h-4 w-4" aria-hidden />}>
              New folder
            </Button>
            <Button onClick={() => setUploading(true)} startIcon={<Upload className="h-4 w-4" aria-hidden />}>
              Upload
            </Button>
          </>
        }
      />

      <DocumentsTabs current={paths.dashboard.documents.list} />

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <aside className="min-w-0">
          <FolderTree tree={tree.data?.data} loading={tree.isLoading} value={folder} onChange={setFolder} />
          {current && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="text" color="secondary" onClick={() => setFolderForm({ mode: 'edit', folder: current })} startIcon={<Pencil className="h-4 w-4" aria-hidden />}>
                Edit folder
              </Button>
              <Button size="sm" variant="text" color="secondary" onClick={archiveCurrent} loading={archiveState.isLoading} startIcon={<Archive className="h-4 w-4" aria-hidden />}>
                Archive folder
              </Button>
            </div>
          )}
        </aside>

        <section className="min-w-0" aria-label="Files">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name"
            activeCount={filterCount}
            onClear={() => {
              setFileClass('');
              setStatus('ACTIVE');
            }}
          >
            <DropdownSelect aria-label="Kind of document" value={fileClass} onValueChange={setFileClass} options={FILE_CLASSES.map((c) => ({ value: c, label: label(c) }))} placeholder="All kinds" className="md:w-44" />
            <DropdownSelect aria-label="Status" value={status} onValueChange={setStatus} options={STATUS_FILTERS} className="md:w-40" />
          </FilterBar>

          <DataTable<VaultFile>
            caption="Files"
            rows={files.isError ? undefined : files.data?.data}
            loading={files.isLoading}
            error={files.isError ? toApiError(files.error).message : undefined}
            onRetry={files.refetch}
            empty={
              debounced || filterCount
                ? { title: 'No file matches', description: 'Change the search or the filters.' }
                : { title: 'No documents here yet', description: 'Upload licences, contracts, assays and certificates to keep them safe and share them when needed.', action: <Button onClick={() => setUploading(true)}>Upload</Button> }
            }
            getRowId={(r) => r.id}
            onRowClick={(r) => setSelectedId(r.id)}
            selectedId={selectedId}
            columns={[
              {
                key: 'name',
                header: 'Name',
                mobile: 'title',
                className: 'min-w-[220px]',
                cell: (r) => (
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{r.displayName}</p>
                    <p className="text-xs text-steel">{r.extension?.toUpperCase() ?? r.mimeType}</p>
                  </div>
                ),
              },
              { key: 'kind', header: 'Kind', mobile: 'subtitle', cell: (r) => label(r.fileClass) },
              { key: 'size', header: 'Size', align: 'right', cell: (r) => formatBytes(r.sizeBytes) },
              { key: 'access', header: 'Who can open it', cell: (r) => label(r.accessMode) },
              { key: 'uploaded', header: 'Uploaded', cell: (r) => formatDate(r.uploadedAt ?? r.createdAt) },
              { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
          <PaginationBar
            meta={files.data?.meta}
            page={page}
            onPage={setPage}
            limit={limit}
            onLimit={(n) => {
              setLimit(n);
              setPage(1);
            }}
          />
        </section>
      </div>

      <FileDetailSheet fileId={selectedId} onClose={() => setSelectedId(null)} />
      <UploadSheet open={uploading} folderId={current?.id ?? null} onClose={() => setUploading(false)} />
      <FolderFormSheet form={folderForm} onClose={() => setFolderForm(null)} />
      {dialog}
    </div>
  );
}

export default function Page() {
  return (
    <RequireAccess teamKey="documents">
      <DocumentsPage />
    </RequireAccess>
  );
}
