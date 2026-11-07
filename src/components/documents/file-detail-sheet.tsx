'use client';

import * as React from 'react';
import { Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, Button, ConfirmDialog, CopyableId, FormField, Input, KeyValueList, DropdownSelect, SideSheet, Skeleton, StatusBadge, Tab, TabList, TabPanel, Tabs, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';
import { FILE_CLASSES, flattenFolders, formatBytes, label, type FileClass } from '@/lib/vault';
import {
  useContentLinkMutation,
  useDeleteFileMutation,
  useGetFileQuery,
  useGetFolderTreeQuery,
  useMoveFileMutation,
  useSetFileArchivedMutation,
  useUpdateFileMutation,
} from '@/redux/features/vault/vaultApi';
import { AccessLogPanel } from './access-log-panel';
import { FileAccessPanel } from './file-access-panel';
import { ShareLinksPanel } from './share-links-panel';

/** One vault file: details and actions, who can see it, share links and its access log */
export function FileDetailSheet({ fileId, onClose }: { fileId: string | null; onClose: () => void }) {
  const detail = useGetFileQuery(fileId ?? '', { skip: !fileId });
  const tree = useGetFolderTreeQuery(undefined, { skip: !fileId });
  const [contentLink, linkState] = useContentLinkMutation();
  const [updateFile, updateState] = useUpdateFileMutation();
  const [moveFile, moveState] = useMoveFileMutation();
  const [setArchived, archiveState] = useSetFileArchivedMutation();
  const [deleteFile, deleteState] = useDeleteFileMutation();
  const { confirm, dialog } = useConfirm();

  const [tab, setTab] = React.useState('details');
  const [name, setName] = React.useState('');
  const [fileClass, setFileClass] = React.useState<FileClass>('DOCUMENT');
  const [folderId, setFolderId] = React.useState('');
  const [deleting, setDeleting] = React.useState(false);

  const f = detail.data?.data;
  React.useEffect(() => {
    if (!f) return;
    setName(f.displayName);
    setFileClass(f.fileClass);
    setFolderId(f.folderId ?? '');
  }, [f]);
  React.useEffect(() => setTab('details'), [fileId]);

  if (!fileId) return null;

  const folders = flattenFolders(tree.data?.data.folders ?? []).filter((x) => x.status === 'ACTIVE').map((x) => ({ value: x.id, label: `${' '.repeat(x.depth)}${x.name}` }));
  const active = f?.status === 'ACTIVE';
  const changed = !!f && (name.trim() !== f.displayName || fileClass !== f.fileClass);

  const open = async (kind: 'preview' | 'download') => {
    try {
      const res = await contentLink({ id: fileId, kind }).unwrap();
      window.open(res.data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  const save = async () => {
    if (!f || !name.trim()) return;
    if (!(await confirm({ title: `Save changes to ${f.displayName}?`, confirmLabel: 'Save changes' }))) return;
    try {
      await updateFile({ id: f.id, displayName: name.trim(), fileClass }).unwrap();
      toast.success('File updated');
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  const move = async () => {
    if (!f) return;
    const where = folders.find((x) => x.value === folderId)?.label.trim() ?? 'the top level';
    if (!(await confirm({ title: `Move ${f.displayName}?`, description: `To ${where}.`, confirmLabel: 'Move' }))) return;
    try {
      await moveFile({ id: f.id, folderId: folderId || null }).unwrap();
      toast.success(`Moved to ${where}`);
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  const archive = async (archived: boolean) => {
    if (!f) return;
    const ok = await confirm(
      archived
        ? { title: `Archive ${f.displayName}?`, description: 'It leaves your folders and can no longer be opened. You can restore it later.', confirmLabel: 'Archive', tone: 'error' }
        : { title: `Restore ${f.displayName}?`, description: 'Its folder must still be active.', confirmLabel: 'Restore' },
    );
    if (!ok) return;
    try {
      await setArchived({ id: f.id, archived }).unwrap();
      toast.success(archived ? 'File archived' : 'File restored');
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  const remove = async (reason?: string) => {
    if (!f) return;
    try {
      await deleteFile({ id: f.id, reason: reason ?? '' }).unwrap();
      toast.success('File deleted');
      setDeleting(false);
      onClose();
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  return (
    <SideSheet
      open
      onClose={onClose}
      size="lg"
      title={f?.displayName ?? 'Document'}
      subtitle={f ? `${label(f.fileClass)} · ${formatBytes(f.sizeBytes)} · ${f.extension?.toUpperCase() ?? f.mimeType}` : undefined}
      footer={
        f && active ? (
          <>
            <Button variant="outlined" color="secondary" onClick={() => open('download')} loading={linkState.isLoading} startIcon={<Download className="h-4 w-4" aria-hidden />}>
              Download
            </Button>
            <Button onClick={() => open('preview')} loading={linkState.isLoading} startIcon={<Eye className="h-4 w-4" aria-hidden />}>
              Preview
            </Button>
          </>
        ) : undefined
      }
    >
      {detail.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : detail.isError || !f ? (
        <Alert severity="error">{toApiError(detail.error).message}</Alert>
      ) : (
        <Tabs value={tab} onChange={setTab}>
          <TabList className="mb-4 overflow-x-auto" aria-label="File">
            <Tab value="details" label="Details" />
            <Tab value="access" label="Who can see it" />
            <Tab value="share" label={`Share links${f.activeShareLinks ? ` (${f.activeShareLinks})` : ''}`} />
            <Tab value="log" label="Access log" />
          </TabList>

          <TabPanel value="details">
            <div className="flex flex-col gap-5">
              {f.status !== 'ACTIVE' && <Alert severity="warning">This file is {label(f.status).toLowerCase()}.</Alert>}
              {f.retentionStatus !== 'ACTIVE' && <Alert severity="info">{label(f.retentionStatus)} (set by MINMEG): it can&apos;t be deleted.</Alert>}
              <KeyValueList
                columns={2}
                items={[
                  { label: 'File ID', value: <CopyableId value={f.id} />, wide: true },
                  { label: 'Status', value: <StatusBadge status={f.status} /> },
                  { label: 'Folder', value: f.folder?.name ?? 'Top level' },
                  { label: 'Uploaded', value: formatDateTime(f.uploadedAt) },
                  { label: 'Original name', value: f.originalFilename },
                  { label: 'Fingerprint (SHA-256)', value: f.checksum ? <span className="break-all font-mono text-xs">{f.checksum}</span> : null, wide: true },
                ]}
              />

              {active && (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <FormField label="Name" htmlFor="file-name">
                      <Input id="file-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={255} />
                    </FormField>
                    <FormField label="Kind of document" htmlFor="file-class">
                      <DropdownSelect id="file-class" value={fileClass} onValueChange={(v) => setFileClass(v as FileClass)} options={FILE_CLASSES.map((c) => ({ value: c, label: label(c) }))} />
                    </FormField>
                  </div>
                  <Button variant="outlined" className="self-start" onClick={save} disabled={!changed || !name.trim()} loading={updateState.isLoading}>
                    Save changes
                  </Button>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <FormField label="Move to" htmlFor="file-move" className="flex-1">
                      <DropdownSelect id="file-move" value={folderId} onValueChange={setFolderId} options={folders} placeholder="Top level" />
                    </FormField>
                    <Button variant="outlined" onClick={move} disabled={folderId === (f.folderId ?? '')} loading={moveState.isLoading} className="h-11">
                      Move
                    </Button>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-2 border-t border-hairline pt-4 sm:flex-row">
                {f.status === 'ACTIVE' && (
                  <Button variant="outlined" color="secondary" onClick={() => archive(true)} loading={archiveState.isLoading}>
                    Archive
                  </Button>
                )}
                {f.status === 'ARCHIVED' && (
                  <Button variant="outlined" onClick={() => archive(false)} loading={archiveState.isLoading}>
                    Restore
                  </Button>
                )}
                {f.status !== 'DELETED' && (
                  <Button variant="outlined" color="error" onClick={() => setDeleting(true)}>
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </TabPanel>
          <TabPanel value="access">{active ? <FileAccessPanel file={f} /> : <p className="text-sm text-steel">Only active files can be shared.</p>}</TabPanel>
          <TabPanel value="share">{active ? <ShareLinksPanel fileId={f.id} fileName={f.displayName} /> : <p className="text-sm text-steel">Only active files can be shared.</p>}</TabPanel>
          <TabPanel value="log">
            <AccessLogPanel fileId={f.id} ownerOrganizationId={f.ownerOrganizationId} />
          </TabPanel>
        </Tabs>
      )}

      <ConfirmDialog
        open={deleting}
        tone="error"
        title={`Delete ${f?.displayName ?? 'this file'}?`}
        description="It disappears from your documents and its share links stop working. Files under legal hold, or attached as evidence, can't be deleted."
        reason={{ label: 'Reason', placeholder: 'e.g. uploaded the wrong version', minLength: 3 }}
        confirmLabel="Delete file"
        loading={deleteState.isLoading}
        onConfirm={remove}
        onClose={() => setDeleting(false)}
      />
      {dialog}
    </SideSheet>
  );
}
