'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Alert, Button, DropdownSelect, FormField, Input, SideSheet, Textarea, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { MATERIAL_REQUEST_TYPES, allCategories, leafCategories, mineralRoot, type MaterialRequestType } from '@/lib/listings';
import { useCreateMaterialRequestMutation, useGetCategoryTreeQuery } from '@/redux/features/listings/listings_api';

const TEXT: Record<MaterialRequestType, { name: string; nameInfo: string; where: string; whereInfo: string; missing: string; confirm: (n: string) => string; description: string }> = {
  MATERIAL: { name: 'Material name', nameInfo: 'What the material is called, as exactly as you can, such as Beryl Ore.', where: 'Where it belongs', whereInfo: 'The category you think it fits. MINMEG makes the final choice.', missing: 'Enter the name of the material', confirm: (n) => `Ask MINMEG to add ${n}?`, description: "MINMEG reviews it and tells you the answer. You can't list it until then." },
  CATEGORY: { name: 'Category name', nameInfo: 'The category buyers should find it under, such as Rare Earths.', where: 'Goes under', whereInfo: 'The category it would sit inside. MINMEG makes the final choice.', missing: 'Enter the name of the category', confirm: (n) => `Ask MINMEG to add the category ${n}?`, description: 'MINMEG reviews it and tells you the answer.' },
  OTHER: { name: 'What it is about', nameInfo: 'A few words, such as Selling marble by the slab.', where: '', whereInfo: '', missing: 'Say what it is about', confirm: (n) => `Send "${n}" to MINMEG?`, description: 'MINMEG reads it and sends you an answer.' },
};

/* Ask MINMEG for a material or category it can't find, or something else (decisions #98, #99). The answers are on My requests. */
export function MaterialRequestForm({ open, onClose, fixedType }: { open: boolean; onClose: () => void; fixedType?: MaterialRequestType }) {
  const [chosenType, setChosenType] = React.useState<MaterialRequestType>('MATERIAL');
  const type = fixedType ?? chosenType;
  const text = TEXT[type];
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
    if (name.trim().length < 2) return setError(text.missing);
    if (type === 'OTHER' && !note.trim()) return setError('Say what you need from MINMEG');
    setError(undefined);
    const ok = await confirm({ title: text.confirm(name.trim()), description: text.description, confirmLabel: 'Send request' });
    if (!ok) return;
    try {
      await send({ type, name: name.trim(), suggestedCategoryId: type === 'OTHER' ? null : categoryId || null, note: note.trim() || null, idempotencyKey: key.key }).unwrap();
      key.done();
      toast.success('Request sent to MINMEG. You can follow it under My requests in your menu.');
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
        title={fixedType === 'MATERIAL' ? 'Ask MINMEG to add a material' : 'Send MINMEG a request'}
        subtitle="MINMEG keeps one shared list of materials and categories, so everyone uses the same names."
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outlined" color="secondary" onClick={onClose} disabled={sending.isLoading}>Cancel</Button>
            <Button type="button" onClick={submit} loading={sending.isLoading}>Send request</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {error && <Alert severity="error">{error}</Alert>}
          {!fixedType && (
            <FormField label="What you need" htmlFor="request-type" required info="A material or category missing from the lists, or anything else you need from MINMEG.">
              <DropdownSelect
                id="request-type"
                value={type}
                onValueChange={(v) => {
                  setChosenType(v as MaterialRequestType);
                  setCategoryId('');
                }}
                options={MATERIAL_REQUEST_TYPES}
                searchable={false}
              />
            </FormField>
          )}
          <FormField label={text.name} htmlFor="request-name" required info={text.nameInfo}>
            <Input id="request-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={255} autoComplete="off" />
          </FormField>
          {type !== 'OTHER' && (
            <FormField label={text.where} htmlFor="request-category" optional info={text.whereInfo}>
              <DropdownSelect id="request-category" searchable value={categoryId} onValueChange={setCategoryId} options={type === 'CATEGORY' ? allCategories(tree.data?.data ?? []) : root ? leafCategories(root) : []} placeholder="Not sure" />
            </FormField>
          )}
          <FormField label={type === 'OTHER' ? 'Details' : 'Note for MINMEG'} htmlFor="request-note" required={type === 'OTHER'} optional={type !== 'OTHER'} info={type === 'OTHER' ? 'Tell MINMEG what you need. The answer comes back here and by email.' : 'Anything that helps, such as where it is mined or what it is used for.'}>
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
      <MaterialRequestForm open={open} onClose={() => setOpen(false)} fixedType="MATERIAL" />
    </div>
  );
}
