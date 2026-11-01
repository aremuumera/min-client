'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Alert, Button, FormField, Input, DropdownSelect, SideSheet, Textarea, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { flattenFolders, type FolderNode } from '@/lib/vault';
import { useCreateFolderMutation, useGetFolderTreeQuery, useMoveFolderMutation, useUpdateFolderMutation } from '@/redux/features/vault/vaultApi';

export type FolderForm = { mode: 'create'; parentId: string | null } | { mode: 'edit'; folder: FolderNode } | null;

/** POST /storage/folders, PATCH /storage/folders/:id (+ move when the parent changes). Up to 10 levels. */
export function FolderFormSheet({ form, onClose }: { form: FolderForm; onClose: () => void }) {
  const tree = useGetFolderTreeQuery(undefined, { skip: !form });
  const [create, createState] = useCreateFolderMutation();
  const [update, updateState] = useUpdateFolderMutation();
  const [move, moveState] = useMoveFolderMutation();
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();
  const saving = createState.isLoading || updateState.isLoading || moveState.isLoading;

  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [parentId, setParentId] = React.useState('');
  const [error, setError] = React.useState<string>();
  const [formError, setFormError] = React.useState<string>();

  const editing = form?.mode === 'edit' ? form.folder : null;
  React.useEffect(() => {
    if (!form) return;
    setName(editing?.name ?? '');
    setDescription(editing?.description ?? '');
    setParentId(form.mode === 'create' ? form.parentId ?? '' : form.folder.parentFolderId ?? '');
    setError(undefined);
    setFormError(undefined);
  }, [form, editing]);

  // a folder can't move into itself or below itself
  const options = React.useMemo(() => {
    const all = flattenFolders(tree.data?.data.folders ?? []).filter((f) => f.status === 'ACTIVE');
    const blocked = new Set<string>();
    if (editing) {
      const mark = (n: FolderNode) => {
        blocked.add(n.id);
        n.children.forEach(mark);
      };
      const self = all.find((f) => f.id === editing.id);
      if (self) mark(self);
    }
    return all.filter((f) => !blocked.has(f.id)).map((f) => ({ value: f.id, label: `${' '.repeat(f.depth)}${f.name}` }));
  }, [tree.data, editing]);

  if (!form) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(undefined);
    if (!name.trim()) return setError('Enter a folder name');
    setError(undefined);
    const parentName = options.find((o) => o.value === parentId)?.label.trim();
    const ok = await confirm(
      editing
        ? { title: `Save changes to ${editing.name}?`, confirmLabel: 'Save changes' }
        : { title: `Create the folder ${name.trim()}?`, description: parentName ? `Inside ${parentName}.` : 'At the top of your documents.', confirmLabel: 'Create folder' },
    );
    if (!ok) return;
    try {
      if (editing) {
        await update({ id: editing.id, name: name.trim(), description: description.trim() || null }).unwrap();
        if ((editing.parentFolderId ?? '') !== parentId) await move({ id: editing.id, parentFolderId: parentId || null }).unwrap();
        toast.success('Folder updated');
      } else {
        await create({ parentFolderId: parentId || null, name: name.trim(), description: description.trim() || null, idempotencyKey: key }).unwrap();
        done();
        toast.success(`Folder ${name.trim()} created`);
      }
      onClose();
    } catch (err) {
      const apiError = toApiError(err);
      if (/name/i.test(apiError.message)) setError(apiError.message);
      else setFormError(apiError.message);
    }
  };

  return (
    <SideSheet
      open
      onClose={onClose}
      title={editing ? `Edit ${editing.name}` : 'New folder'}
      subtitle="Folders keep your documents in order, up to 10 levels deep."
      footer={
        <>
          <Button type="button" variant="outlined" color="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="folder-form" loading={saving} disabled={saving}>
            {editing ? 'Save changes' : 'Create folder'}
          </Button>
        </>
      }
    >
      <form id="folder-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        {formError && <Alert severity="error">{formError}</Alert>}
        <FormField label="Name" htmlFor="folder-name" required error={error}>
          <Input id="folder-name" value={name} onChange={(e) => setName(e.target.value)} error={!!error} maxLength={255} autoComplete="off" />
        </FormField>
        <FormField label="Inside" htmlFor="folder-parent">
          <DropdownSelect id="folder-parent" value={parentId} onValueChange={setParentId} options={options} placeholder="Top level" />
        </FormField>
        <FormField label="Description" htmlFor="folder-description">
          <Textarea id="folder-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={2000} />
        </FormField>
      </form>
      {dialog}
    </SideSheet>
  );
}
