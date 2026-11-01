'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Alert, Button, DropdownSelect, FormField, Input, SideSheet, StatusBadge, Textarea, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { leafCategories, materialRequestLabel, materialRequestTone, mineralRoot } from '@/lib/listings';
import { useCreateMaterialRequestMutation, useGetCategoryTreeQuery, useGetMaterialRequestsQuery } from '@/redux/features/listings/listings_api';

/* "Can't find your material?" under the material picker: ask MINMEG to add it, and see the answers (decision #98) */
export function MaterialRequestPanel() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [note, setNote] = React.useState('');
  const [error, setError] = React.useState<string>();
  const requests = useGetMaterialRequestsQuery({ limit: 5 });
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
      toast.success('Request sent to MINMEG');
      setOpen(false);
      setName('');
      setCategoryId('');
      setNote('');
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  const rows = requests.data?.data ?? [];
  return (
    <div className="flex flex-col gap-2">
      <div>
        <Button type="button" variant="text" size="sm" onClick={() => setOpen(true)}>Can&apos;t find your material? Ask MINMEG to add it</Button>
      </div>
      {rows.length > 0 && (
        <ul aria-label="Your material requests" className="flex flex-col divide-y divide-hairline rounded-xl border border-hairline text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span className="min-w-0">
                <span className="block font-medium text-ink">{r.material?.name ?? r.requestedName}</span>
                {r.status === 'REFUSED' && r.reviewReason && <span className="block text-xs text-steel">{r.reviewReason}</span>}
                {r.status === 'APPROVED' && <span className="block text-xs text-steel">You can now choose it in the list above</span>}
              </span>
              <StatusBadge tone={materialRequestTone(r.status)}>{materialRequestLabel(r.status)}</StatusBadge>
            </li>
          ))}
        </ul>
      )}
      <SideSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Ask MINMEG to add a material"
        subtitle="We add it to the list so every supplier and buyer uses the same name."
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outlined" color="secondary" onClick={() => setOpen(false)} disabled={sending.isLoading}>Cancel</Button>
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
    </div>
  );
}
