'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Alert, Button, DropdownSelect, FormField, Input, SideSheet, Textarea, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { leafCategories, mineralRoot } from '@/lib/listings';
import { useCreateMaterialRequestMutation, useGetCategoryTreeQuery } from '@/redux/features/listings/listings_api';

/* Ask MINMEG to add a material it can't find (decision #98). The answers are on the Material requests page. */
export function MaterialRequestForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [note, setNote] = React.useState('');
  const [error, setError] = React.useState<string>();
  const tree = useGetCategoryTreeQuery();
  const [send, sending] = useCreateMaterialRequestMutation();
  const key = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();
  const root = mineralRoot(tree.data?.data ?? []);

  const submit = async () => {
    if (name.trim().length < 2) return setError('Enter the name of the material');
    setError(undefined);
    const ok = await confirm({ title: `Ask MINMEG to add ${name.trim()}?`, description: "MINMEG reviews it and tells you the answer. You can't list it until then.", confirmLabel: 'Send request' });
    if (!ok) return;
    try {
      await send({ name: name.trim(), suggestedCategoryId: categoryId || null, note: note.trim() || null, idempotencyKey: key.key }).unwrap();
      key.done();
      toast.success('Request sent to MINMEG. You can follow it under Material requests in your menu.');
      onClose();
      setName('');
      setCategoryId('');
      setNote('');
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  return (
    <>
      <SideSheet
        open={open}
        onClose={onClose}
        title="Ask MINMEG to add a material"
        subtitle="We add it to the list so every supplier and buyer uses the same name."
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outlined" color="secondary" onClick={onClose} disabled={sending.isLoading}>Cancel</Button>
            <Button type="button" onClick={submit} loading={sending.isLoading}>Send request</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {error && <Alert severity="error">{error}</Alert>}
          <FormField label="Material name" htmlFor="request-name" required info="What the material is called, as exactly as you can, such as Beryl Ore.">
            <Input id="request-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={255} autoComplete="off" />
          </FormField>
          <FormField label="Where it belongs" htmlFor="request-category" optional info="The category you think it fits. MINMEG makes the final choice.">
            <DropdownSelect id="request-category" searchable value={categoryId} onValueChange={setCategoryId} options={root ? leafCategories(root) : []} placeholder="Not sure" />
          </FormField>
          <FormField label="Note for MINMEG" htmlFor="request-note" optional info="Anything that helps, such as where it is mined or what it is used for.">
            <Textarea id="request-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={2000} />
          </FormField>
        </div>
      </SideSheet>
      {dialog}
    </>
  );
}

/* The one line under the material picker on the listing form */
export function MaterialRequestLink() {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <Button type="button" variant="text" size="sm" onClick={() => setOpen(true)}>Can&apos;t find your material? Ask MINMEG to add it</Button>
      <MaterialRequestForm open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
