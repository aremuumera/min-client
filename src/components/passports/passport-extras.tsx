'use client';

import * as React from 'react';
import { Alert, Button, Checkbox, ConfirmDialog, CopyableId, DropdownSelect, FormField, Input, Modal, StatusBadge, Textarea, Timeline, type TimelineEntry } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { valueText, words, type MetadataEntry, type PassportVersion, type RecordHistoryItem, type TemplateField, type VersionField } from '@/lib/passports';
import { numberText } from '@/lib/traceability';
import {
  useAddPassportMaterialMutation,
  useGetPassportMaterialChoicesQuery,
  useGetRecordHistoryQuery,
  useGetRelationshipTreeQuery,
  useGetVisibilityPoliciesQuery,
  useRemovePassportMaterialMutation,
  useSetPassportMetadataMutation,
  useSetPassportValuesBulkMutation,
} from '@/redux/features/passports/passports_api';
import { useGetUnitChoicesQuery } from '@/redux/features/batches/batches_api';

/*
 * Step 2.9e: the rest of a passport (and a certificate's trail).
 *  - what it is made of: add and remove materials on an open version
 *  - extra details (metadata): only the owner and MINMEG see them unless a visibility says otherwise
 *  - fill several typed values at once
 *  - history and linked records, for passports and certificates
 */

/** Typed input for one field, by its kind */
export function TypedInput({ id = 'value-input', label = 'Value', def, value, onChange }: { id?: string; label?: string; def: { dataType: string; enumValues?: string[] | null } | undefined; value: string; onChange: (v: string) => void }) {
  const type = def?.dataType ?? 'STRING';
  if (type === 'ENUM') return <DropdownSelect id={id} aria-label={label} value={value} placeholder="Choose" options={(def?.enumValues ?? []).map((v) => ({ value: v, label: v }))} onValueChange={onChange} />;
  if (type === 'BOOLEAN') return <DropdownSelect id={id} aria-label={label} value={value} placeholder="Choose" options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} onValueChange={onChange} />;
  if (type === 'OBJECT' || type === 'ARRAY') return <Textarea id={id} aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} rows={4} placeholder={type === 'ARRAY' ? '["a", "b"]' : '{"key": "value"}'} />;
  return (
    <Input
      id={id}
      aria-label={label}
      type={type === 'DATE' ? 'date' : type === 'DATETIME' ? 'datetime-local' : 'text'}
      inputMode={type === 'NUMBER' || type === 'INTEGER' ? 'decimal' : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function parseTyped(type: string, raw: string): unknown {
  const v = raw.trim();
  if (type === 'NUMBER' || type === 'INTEGER') return Number(v);
  if (type === 'BOOLEAN') return v === 'true';
  if (type === 'DATETIME') return new Date(v).toISOString();
  if (type === 'OBJECT' || type === 'ARRAY') return JSON.parse(v);
  return v;
}

// =========================== materials ===========================
function AddMaterial({ version, onClose }: { version: PassportVersion; onClose: () => void }) {
  const materials = useGetPassportMaterialChoicesQuery();
  const units = useGetUnitChoicesQuery();
  const [add, { isLoading }] = useAddPassportMaterialMutation();
  const { key, done } = useIdempotencyKey();
  const [materialId, setMaterialId] = React.useState('');
  const [role, setRole] = React.useState('');
  const [percentage, setPercentage] = React.useState('');
  const [quantity, setQuantity] = React.useState('');
  const [unitId, setUnitId] = React.useState('');
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const materialOptions = (materials.data?.data ?? []).map((m) => ({ value: m.id, label: `${m.name} (${m.code})` }));
  const unitOptions = (units.data?.data ?? []).map((u) => ({ value: u.id, label: `${u.name ?? u.code} (${u.symbol})` }));
  const pct = percentage.trim() ? Number(percentage) : null;
  const problem = !materialId
    ? 'Choose the material.'
    : pct !== null && !(pct >= 0 && pct <= 100)
      ? 'The share is a number from 0 to 100.'
      : quantity.trim() && !/^\d{1,16}(\.\d{1,8})?$/.test(quantity.trim())
        ? 'The quantity is a number, with at most 8 decimals.'
        : quantity.trim() && !unitId
          ? 'Choose the unit of the quantity.'
          : null;
  const submit = async () => {
    setError(null);
    try {
      await add({
        versionId: version.id,
        idempotencyKey: key,
        materialId,
        ...(role.trim() ? { role: role.trim().toUpperCase() } : {}),
        ...(pct !== null ? { percentage: pct } : {}),
        ...(quantity.trim() ? { quantity: quantity.trim(), unitId } : {}),
      }).unwrap();
      done();
      onClose();
    } catch (err) {
      setConfirming(false);
      setError(toApiError(err).message);
    }
  };
  return (
    <Modal open onClose={onClose} size="md">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Add a material</h3>
          <p className="mt-1 text-sm text-gray-500">What this passport says the goods are made of. Declared by your company.</p>
        </div>
        {error && <Alert severity="error">{error}</Alert>}
        <FormField htmlFor="pm-material" label="Material" required>
          <DropdownSelect id="pm-material" aria-label="Material" value={materialId} placeholder="Choose" options={materialOptions} onValueChange={setMaterialId} searchable={materialOptions.length > 8} />
        </FormField>
        <FormField htmlFor="pm-role" label="Role" optional info="What part it plays, for example PRIMARY, CATHODE or CASING. A material can be listed once per role.">
          <Input id="pm-role" value={role} onChange={(e) => setRole(e.target.value)} maxLength={64} />
        </FormField>
        <FormField htmlFor="pm-percentage" label="Share of the whole (%)" optional info="All shares together can't be more than 100 %.">
          <Input id="pm-percentage" inputMode="decimal" value={percentage} onChange={(e) => setPercentage(e.target.value)} />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="pm-quantity" label="Quantity" optional>
            <Input id="pm-quantity" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </FormField>
          <FormField htmlFor="pm-unit" label="Unit" optional info="Needed with a quantity. It must measure what the material is measured in.">
            <DropdownSelect id="pm-unit" aria-label="Unit" value={unitId} placeholder="Choose" options={unitOptions} onValueChange={setUnitId} searchable={unitOptions.length > 8} />
          </FormField>
        </div>
        {problem && <p className="text-sm text-gray-500">{problem}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!!problem} onClick={() => setConfirming(true)}>Add material</Button>
        </div>
      </div>
      <ConfirmDialog open={confirming} title="Add this material?" description={version.status === 'VALIDATED' ? 'The checked version goes back to draft: check it again before publishing.' : undefined} confirmLabel="Add" loading={isLoading} onConfirm={submit} onClose={() => setConfirming(false)} />
    </Modal>
  );
}

/** What the passport says the goods are made of; editable on an open version */
export function MaterialsSection({ version, editable }: { version: PassportVersion; editable: boolean }) {
  const units = useGetUnitChoicesQuery(undefined, { skip: !version.materials.some((m) => m.unitId) });
  const [adding, setAdding] = React.useState(false);
  const [removing, setRemoving] = React.useState<string | null>(null);
  const [remove, removeState] = useRemovePassportMaterialMutation();
  const [error, setError] = React.useState<string | null>(null);
  if (!version.materials.length && !editable) return null;
  const symbol = (id: string | null) => (units.data?.data ?? []).find((u) => u.id === id)?.symbol ?? '';
  return (
    <section className="space-y-2" aria-label="Made of">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Made of</h4>
        {editable && <Button size="sm" variant="outlined" onClick={() => setAdding(true)}>Add material</Button>}
      </div>
      {error && <Alert severity="error">{error}</Alert>}
      {!version.materials.length ? (
        <p className="text-sm text-gray-500">No materials listed.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {version.materials.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 p-3" data-testid={`pmaterial-${m.material?.code ?? m.materialId}`}>
              <div className="min-w-0 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">{m.material ? `${m.material.name} (${m.material.code})` : m.materialId}</p>
                <p>
                  {[m.role ? words(m.role) : null, m.percentage != null ? `${numberText(String(m.percentage))} %` : null, m.quantity ? `${numberText(m.quantity)} ${symbol(m.unitId)}`.trim() : null].filter(Boolean).join(' · ') || 'No share or quantity given'}
                </p>
              </div>
              {editable && <Button size="sm" variant="text" onClick={() => setRemoving(m.id)}>Remove</Button>}
            </li>
          ))}
        </ul>
      )}
      {adding && <AddMaterial version={version} onClose={() => setAdding(false)} />}
      <ConfirmDialog
        open={!!removing}
        title="Remove this material?"
        confirmLabel="Remove"
        tone="error"
        loading={removeState.isLoading}
        onConfirm={async () => {
          setError(null);
          try {
            if (removing) await remove(removing).unwrap();
          } catch (err) {
            setError(toApiError(err).message);
          }
          setRemoving(null);
        }}
        onClose={() => setRemoving(null)}
      />
    </section>
  );
}

// =========================== extra details (metadata) ===========================
type DetailRow = { key: string; text: string; original?: unknown; description: string; visibilityPolicyId: string; hashIncluded: boolean };
const KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_.-]{0,119}$/;

function DetailsForm({ version, onClose }: { version: PassportVersion; onClose: () => void }) {
  const policies = useGetVisibilityPoliciesQuery();
  const [save, { isLoading }] = useSetPassportMetadataMutation();
  const [rows, setRows] = React.useState<DetailRow[]>(() =>
    version.metadata.map((m) => ({ key: m.key, text: valueText(m.value), original: m.value, description: m.description ?? '', visibilityPolicyId: m.visibilityPolicyId ?? '', hashIncluded: !!m.hashIncluded })),
  );
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const policyOptions = (policies.data?.data ?? []).filter((p) => p.active && p.code !== 'CUSTOM' && p.code !== 'ADMIN').map((p) => ({ value: p.id, label: p.name }));
  const set = (i: number, patch: Partial<DetailRow>) => setRows((list) => list.map((r, n) => (n === i ? { ...r, ...patch } : r)));
  const keys = rows.map((r) => r.key.trim());
  const problem = rows.some((r) => !KEY_PATTERN.test(r.key.trim()))
    ? 'Each name starts with a letter and uses letters, digits, _ . or - (no spaces).'
    : new Set(keys).size !== keys.length
      ? 'Each name once.'
      : rows.some((r) => !r.text.trim())
        ? 'Each detail needs a value.'
        : null;
  const submit = async () => {
    setError(null);
    try {
      await save({
        versionId: version.id,
        entries: rows.map((r, order) => ({
          key: r.key.trim(),
          // an untouched value keeps its kind (a number stays a number)
          value: r.original !== undefined && valueText(r.original) === r.text ? r.original : r.text.trim(),
          description: r.description.trim() || null,
          order,
          ...(r.visibilityPolicyId ? { visibilityPolicyId: r.visibilityPolicyId } : {}),
          hashIncluded: r.hashIncluded,
        })),
      }).unwrap();
      onClose();
    } catch (err) {
      setConfirming(false);
      setError(toApiError(err).message);
    }
  };
  return (
    <Modal open onClose={onClose} size="lg">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Extra details</h3>
          <p className="mt-1 text-sm text-gray-500">Details the template has no field for. Only your company and MINMEG see them, unless you choose who else may.</p>
        </div>
        {error && <Alert severity="error">{error}</Alert>}
        {!rows.length && <p className="text-sm text-gray-500">No extra details. Saving with none removes them all.</p>}
        {rows.map((r, i) => (
          <fieldset key={i} className="space-y-3 rounded-lg border border-gray-200 p-3" aria-label={`Detail ${i + 1}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField htmlFor={`md-key-${i}`} label="Name" required info="For example shipping.mark or lotNote">
                <Input id={`md-key-${i}`} value={r.key} onChange={(e) => set(i, { key: e.target.value })} maxLength={120} />
              </FormField>
              <FormField htmlFor={`md-value-${i}`} label="Value" required>
                <Input id={`md-value-${i}`} value={r.text} onChange={(e) => set(i, { text: e.target.value })} />
              </FormField>
            </div>
            <FormField htmlFor={`md-description-${i}`} label="Note" optional>
              <Input id={`md-description-${i}`} value={r.description} onChange={(e) => set(i, { description: e.target.value })} maxLength={2000} />
            </FormField>
            <FormField htmlFor={`md-visibility-${i}`} label="Who may see it" optional info="Empty: only your company and MINMEG.">
              <DropdownSelect id={`md-visibility-${i}`} aria-label="Who may see it" value={r.visibilityPolicyId} placeholder="Only your company and MINMEG" options={policyOptions} onValueChange={(v) => set(i, { visibilityPolicyId: v })} />
            </FormField>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Checkbox label="Protect it with the passport's seal" description="Any later change to it would show." checked={r.hashIncluded} onChange={(e) => set(i, { hashIncluded: e.target.checked })} />
              <Button size="sm" variant="text" onClick={() => setRows((list) => list.filter((_, n) => n !== i))}>Remove detail {i + 1}</Button>
            </div>
          </fieldset>
        ))}
        <Button size="sm" variant="outlined" disabled={rows.length >= 100} onClick={() => setRows((list) => [...list, { key: '', text: '', description: '', visibilityPolicyId: '', hashIncluded: false }])}>Add a detail</Button>
        {problem && <p className="text-sm text-gray-500">{problem}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!!problem} onClick={() => setConfirming(true)}>Save details</Button>
        </div>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Save the extra details?"
        description={`This replaces all of this version's extra details with the ${rows.length} shown.${version.status === 'VALIDATED' ? ' The checked version goes back to draft: check it again before publishing.' : ''}`}
        confirmLabel="Save"
        loading={isLoading}
        onConfirm={submit}
        onClose={() => setConfirming(false)}
      />
    </Modal>
  );
}

/** A version's extra details (the server leaves out those the reader may not see) */
export function DetailsSection({ version, editable }: { version: PassportVersion; editable: boolean }) {
  const policies = useGetVisibilityPoliciesQuery(undefined, { skip: !editable });
  const [editing, setEditing] = React.useState(false);
  if (!version.metadata.length && !editable) return null;
  const policyName = (id?: string) => {
    const policy = (policies.data?.data ?? []).find((p) => p.id === id);
    return !policy || policy.code === 'OWNER' ? undefined : policy.name;
  };
  const sorted: MetadataEntry[] = [...version.metadata].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return (
    <section className="space-y-2" aria-label="Extra details">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Extra details</h4>
        {editable && <Button size="sm" variant="outlined" onClick={() => setEditing(true)}>{version.metadata.length ? 'Edit details' : 'Add details'}</Button>}
      </div>
      {!sorted.length ? (
        <p className="text-sm text-gray-500">No extra details.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {sorted.map((m) => (
            <li key={m.id} className="p-3 text-sm" data-testid={`pdetail-${m.key}`}>
              <p className="font-semibold text-gray-900">{m.key}</p>
              <p className="break-words text-gray-700">{valueText(m.value)}</p>
              {m.description && <p className="text-xs text-gray-500">{m.description}</p>}
              {editable && (
                <p className="text-xs text-gray-500">
                  Visible to {policyName(m.visibilityPolicyId) ?? 'your company and MINMEG'}
                  {m.hashIncluded ? ' · protected by the seal' : ''}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      {editing && <DetailsForm version={version} onClose={() => setEditing(false)} />}
    </section>
  );
}

// =========================== fill several at once ===========================
/** Typed values for several fields in one go; values from readings, results or documents are set one by one */
export function FillSeveral({ version, defs }: { version: PassportVersion; defs: TemplateField[] }) {
  const fields = version.fields.filter((f) => !f.dynamic && f.dataType !== 'FILE' && (!f.value || f.value.sourceType === 'USER'));
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Record<string, string>>({});
  const [failures, setFailures] = React.useState<Record<string, string>>({});
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [save, { isLoading }] = useSetPassportValuesBulkMutation();
  const { key, done } = useIdempotencyKey();
  if (fields.length < 2) return null;
  const start = () => {
    setDraft(Object.fromEntries(fields.map((f) => [f.fieldId, f.value ? valueText(f.value.value) : ''])));
    setFailures({});
    setError(null);
    setNotice(null);
    setOpen(true);
  };
  const changed = (f: VersionField) => (draft[f.fieldId] ?? '').trim() !== '' && (draft[f.fieldId] ?? '') !== (f.value ? valueText(f.value.value) : '');
  const chosen = fields.filter(changed);
  const submit = async () => {
    setError(null);
    const items: Record<string, unknown>[] = [];
    for (const f of chosen) {
      try {
        items.push({ fieldId: f.fieldId, sourceType: 'USER', value: parseTyped(f.dataType, draft[f.fieldId]) });
      } catch {
        setConfirming(false);
        return setError(`${f.label}: that is not valid for this kind of value.`);
      }
    }
    try {
      const result = (await save({ versionId: version.id, items, idempotencyKey: key }).unwrap()).data;
      done();
      setConfirming(false);
      const failed = Object.fromEntries(result.items.filter((i) => i.status === 'FAILED' && i.fieldId).map((i) => [i.fieldId as string, i.error ?? 'Not saved']));
      setFailures(failed);
      if (!result.failed) return setOpen(false);
      setNotice(`${result.saved} saved; ${result.failed} need fixing.`);
    } catch (err) {
      setConfirming(false);
      setError(toApiError(err).message);
    }
  };
  return (
    <>
      <Button size="sm" variant="outlined" onClick={start}>Fill several</Button>
      {open && (
        <Modal open onClose={() => setOpen(false)} size="lg">
          <div className="space-y-4 p-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Fill several values</h3>
              <p className="mt-1 text-sm text-gray-500">Type the values you know; empty ones are left as they are. Typed values show as declared by your company. For a value from a reading, a lab or inspection result or a document, use Fill in on that field.</p>
            </div>
            {error && <Alert severity="error">{error}</Alert>}
            {notice && <Alert severity="warning">{notice}</Alert>}
            {fields.map((f) => (
              <FormField key={f.fieldId} htmlFor={`bulk-${f.key}`} label={f.label} required={f.required} optional={!f.required} info={failures[f.fieldId] ? undefined : f.group ?? undefined}>
                <TypedInput id={`bulk-${f.key}`} label={f.label} def={defs.find((d) => d.id === f.fieldId) ?? { dataType: f.dataType, enumValues: null }} value={draft[f.fieldId] ?? ''} onChange={(v) => setDraft((d) => ({ ...d, [f.fieldId]: v }))} />
                {failures[f.fieldId] && <p className="mt-1 text-sm text-semantic-error-text">{failures[f.fieldId]}</p>}
              </FormField>
            ))}
            <div className="flex justify-end gap-2">
              <Button variant="outlined" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={!chosen.length} onClick={() => setConfirming(true)}>Save {chosen.length || ''} value{chosen.length === 1 ? '' : 's'}</Button>
            </div>
          </div>
          <ConfirmDialog
            open={confirming}
            title={`Save ${chosen.length} value${chosen.length === 1 ? '' : 's'}?`}
            description={`Those that pass the field's rules are saved; any that don't are shown for you to fix.${version.status === 'VALIDATED' ? ' The checked version goes back to draft: check it again before publishing.' : ''}`}
            confirmLabel="Save"
            loading={isLoading}
            onConfirm={submit}
            onClose={() => setConfirming(false)}
          />
        </Modal>
      )}
    </>
  );
}

// =========================== history and linked records ===========================
function historyTone(code: string | undefined): TimelineEntry['tone'] {
  if (!code) return 'neutral';
  if (/SUSPENDED|REVOKED|DISQUALIFIED/.test(code)) return 'error';
  if (/INVALIDATED|EXPIRED|DISCARDED/.test(code)) return 'warning';
  if (/PUBLISHED|REINSTATED/.test(code)) return 'success';
  return 'neutral';
}

/** Only owners and MINMEG are told who acted */
const ACTOR_TEXT: Record<string, string> = { ADMIN: 'By MINMEG', SUPPLIER: 'By the company', BUYER: 'By the company', INSPECTOR: 'By the inspector', SYSTEM: 'By MINMEG (automatic)' };

function historyEntry(item: RecordHistoryItem): TimelineEntry {
  const data = item.data ?? {};
  const version = item.versionNumber ?? (data.versionNumber as number | undefined);
  const reason = (data.reason ?? data.changeReason) as string | undefined;
  const parts = [version ? `Version ${version}` : null, reason ? `Reason: ${reason}` : null].filter(Boolean);
  return { id: item.id, title: item.eventType?.name ?? 'Change', at: item.occurredAt, description: parts.length ? parts.join(' · ') : undefined, actor: item.actorType ? ACTOR_TEXT[item.actorType] ?? words(item.actorType) : undefined, tone: historyTone(item.eventType?.code) };
}

function History({ id }: { id: string }) {
  const history = useGetRecordHistoryQuery(id);
  if (history.isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (history.error) return <Alert severity="error">{toApiError(history.error).message}</Alert>;
  const items = history.data?.data.items ?? [];
  if (!items.length) return <p className="text-sm text-gray-500">Nothing recorded yet.</p>;
  return <Timeline entries={[...items].reverse().map(historyEntry)} />;
}

function LinkedRecords({ id }: { id: string }) {
  const tree = useGetRelationshipTreeQuery(id);
  if (tree.isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (tree.error) return <Alert severity="error">{toApiError(tree.error).message}</Alert>;
  const t = tree.data?.data;
  if (!t) return null;
  const from = (t.lineage ?? []).filter((l) => l.relationshipType === 'DERIVED_FROM');
  const into = (t.lineage ?? []).filter((l) => l.relationshipType === 'DERIVED_INTO');
  const lineageList = (list: typeof from) => (
    <ul className="space-y-1">
      {list.map((l) => (
        <li key={`${l.batchId}-${l.passport.id}`} className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
          <span className="font-medium text-gray-900">{l.passport.passportCode}</span>
          <StatusBadge status={l.passport.status}>{words(l.passport.status)}</StatusBadge>
          <span className="text-xs text-gray-500">{words(l.lineageType)}</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="space-y-3 text-sm" data-testid="linked-records">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">About</p>
        <p className="text-gray-700">{t.subject.label ?? words(t.subject.type)}</p>
        <p className="text-xs text-gray-400"><CopyableId value={t.subject.id} /></p>
      </div>
      {t.source && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Issued from</p>
          <p className="text-gray-700">{words(t.source.type)}</p>
          <p className="text-xs text-gray-400"><CopyableId value={t.source.id} /></p>
        </div>
      )}
      {!!from.length && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Came from</p>
          {lineageList(from)}
        </div>
      )}
      {!!into.length && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Went into</p>
          {lineageList(into)}
        </div>
      )}
      {!!t.relationships.length && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Other links</p>
          <ul className="space-y-1">
            {t.relationships.map((r) => (
              <li key={r.id} className="text-gray-700">
                {words(r.relationshipType)}: {words(r.target.id === id ? r.source.type : r.target.type)} <CopyableId value={r.target.id === id ? r.source.id : r.target.id} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {!t.source && !from.length && !into.length && !t.relationships.length && <p className="text-gray-500">No other records linked that you can see.</p>}
    </div>
  );
}

/** History and linked records of a passport or certificate, each opened on demand */
export function RecordTrail({ id }: { id: string }) {
  const [history, setHistory] = React.useState(false);
  const [links, setLinks] = React.useState(false);
  return (
    <section className="space-y-3" aria-label="History and links">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outlined" aria-expanded={history} onClick={() => setHistory((o) => !o)}>{history ? 'Hide' : 'Show'} history</Button>
        <Button size="sm" variant="outlined" aria-expanded={links} onClick={() => setLinks((o) => !o)}>{links ? 'Hide' : 'Show'} linked records</Button>
      </div>
      {history && <div className="rounded-lg border border-gray-200 p-3" data-testid="record-history"><History id={id} /></div>}
      {links && <div className="rounded-lg border border-gray-200 p-3"><LinkedRecords id={id} /></div>}
    </section>
  );
}
