'use client';

import * as React from 'react';
import { Package, Truck } from 'lucide-react';
import {
  Button,
  IconButton,
  Input,
  StatusBadge,
  CopyableId,
  ConfirmDialog,
  SideSheet,
  EmptyState,
  ErrorState,
  NoAccess,
  PageHeader,
  FormField,
  KeyValueList,
  Timeline,
  StatTile,
  QuantityInput,
  DataTable,
  FilterBar,
} from '@/components/ui';
import { formatQuantity, formatDateTime } from '@/lib/format';
import { toast } from '@/components/core/toaster';

interface Row {
  id: string;
  batchCode: string;
  material: string;
  quantity: string;
  status: string;
  updatedAt: string;
}

const ROWS: Row[] = [
  { id: '935dc217-daa9-4e33-9b04-60996aa29181', batchCode: 'MB-2026-000001', material: 'Tin concentrate (cassiterite), Jos Plateau', quantity: '20.500000', status: 'ACTIVE', updatedAt: '2026-10-23T09:12:00Z' },
  { id: '4b1c2d3e-4f5a-4b60-8c71-9d2e3f4a5b62', batchCode: 'MB-2026-000002', material: 'Lithium ore', quantity: '1250.000000', status: 'QUARANTINED', updatedAt: '2026-10-22T16:40:00Z' },
  { id: 'ad1e2f3a-4b5c-4d60-8e71-9f2a3b4c5d64', batchCode: 'MB-2026-000003', material: 'Columbite', quantity: '7.125000', status: 'PENDING_APPROVAL', updatedAt: '2026-10-21T08:05:00Z' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[1px] text-steel">{title}</h2>
      {children}
    </section>
  );
}

export function Gallery() {
  const [confirm, setConfirm] = React.useState(false);
  const [sheet, setSheet] = React.useState<Row | null>(null);
  const [qty, setQty] = React.useState('20.5');
  const [search, setSearch] = React.useState('');
  const [state, setState] = React.useState<'rows' | 'loading' | 'empty' | 'error'>('rows');

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 lg:px-8">
      <PageHeader
        title="MINMEG design system"
        description="Every component, in its states. Resize the window: phone < 768px, tablet 768–1023px, desktop ≥ 1024px."
        meta={<StatusBadge status="ACTIVE" />}
        actions={
          <>
            <Button variant="outlined" color="secondary">Secondary</Button>
            <Button startIcon={<Package className="h-4 w-4" />}>Register batch</Button>
          </>
        }
      />

      <Section title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="outlined" color="secondary">Secondary</Button>
          <Button variant="outlined">Outlined green</Button>
          <Button variant="text">Text</Button>
          <Button color="error">Danger</Button>
          <Button color="secondary">Dark</Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <IconButton aria-label="Shipments"><Truck className="h-5 w-5" /></IconButton>
        </div>
      </Section>

      <Section title="Status badges">
        <div className="flex flex-wrap gap-2">
          {['ACTIVE', 'VERIFIED', 'PENDING_APPROVAL', 'IN_TRANSIT', 'QUARANTINED', 'REVOKED', 'DRAFT', 'ARCHIVED'].map((s) => <StatusBadge key={s} status={s} />)}
          <StatusBadge tone="dark">Anchored on-chain</StatusBadge>
        </div>
      </Section>

      <Section title="Stat tiles">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Batches" value="1,284" hint="+12 this week" icon={<Package className="h-5 w-5" />} />
          <StatTile label="In transit" value="38" hint="4 delayed" icon={<Truck className="h-5 w-5" />} />
          <StatTile label="Stock" value={formatQuantity('48210.250000', 'MT')} />
          <StatTile label="Proofs anchored" value="99.2%" hint="last 30 days" dark />
        </div>
      </Section>

      <Section title="Data table (cards on phones)">
        <div className="mb-3 flex flex-wrap gap-2">
          {(['rows', 'loading', 'empty', 'error'] as const).map((s) => (
            <Button key={s} size="sm" variant={state === s ? 'contained' : 'outlined'} color={state === s ? 'primary' : 'secondary'} onClick={() => setState(s)}>
              {s}
            </Button>
          ))}
        </div>
        <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search batches" activeCount={1} onClear={() => undefined}>
          <select aria-label="Status" className="h-11 rounded-lg border border-hairline-strong bg-canvas px-3 text-base text-ink md:text-sm">
            <option>All statuses</option>
            <option>Active</option>
          </select>
        </FilterBar>
        <DataTable<Row>
          caption="Batches"
          rows={state === 'rows' ? ROWS.filter((r) => r.batchCode.toLowerCase().includes(search.toLowerCase())) : state === 'empty' ? [] : undefined}
          loading={state === 'loading'}
          error={state === 'error' ? 'The server did not answer (request 839c2e45-1baa-4612-a63f-ae97346fac01).' : undefined}
          onRetry={() => setState('rows')}
          empty={{ title: 'No batches yet', description: 'Register the first batch from a mine site.', action: <Button>Register batch</Button> }}
          getRowId={(r) => r.id}
          onRowClick={setSheet}
          selectedId={sheet?.id}
          columns={[
            { key: 'code', header: 'Batch', cell: (r) => r.batchCode, mobile: 'title' },
            { key: 'material', header: 'Material', cell: (r) => r.material, mobile: 'subtitle', className: 'min-w-[200px]' },
            { key: 'qty', header: 'Quantity', cell: (r) => formatQuantity(r.quantity, 'MT'), align: 'right' },
            { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
            { key: 'updated', header: 'Updated', cell: (r) => formatDateTime(r.updatedAt) },
          ]}
        />
      </Section>

      <Section title="Form">
        <div className="grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Batch code" htmlFor="f-code" required help="Unique, e.g. MB-2026-000004">
            <Input id="f-code" placeholder="MB-2026-000004" />
          </FormField>
          <FormField label="Quantity" htmlFor="f-qty" required error={qty === '' ? 'Enter the quantity' : undefined}>
            <QuantityInput id="f-qty" value={qty} onChange={setQty} unit="MT" />
          </FormField>
          <FormField label="Supplier reference" htmlFor="f-ref" error="This reference is already used by MB-2026-000001">
            <Input id="f-ref" defaultValue="JOS-0042" error />
          </FormField>
          <FormField label="Location" htmlFor="f-loc">
            <Input id="f-loc" disabled defaultValue="Jos Plateau mine, Gate 2" />
          </FormField>
        </div>
      </Section>

      <Section title="Details and history">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-hairline p-4 md:p-6">
            <KeyValueList
              columns={2}
              items={[
                { label: 'Batch ID', value: <CopyableId value={ROWS[0].id} />, wide: true },
                { label: 'Batch code', value: ROWS[0].batchCode },
                { label: 'Status', value: <StatusBadge status="ACTIVE" /> },
                { label: 'Material', value: ROWS[0].material, wide: true },
                { label: 'Current quantity', value: formatQuantity(ROWS[0].quantity, 'MT') },
                { label: 'Data hash', value: <CopyableId value="0x8f2c4a1be97d03556c2f1a0d4e6b7c8d9e0f1a2b3c4d5e6f708192a3b4c5d6e7" /> },
              ]}
            />
          </div>
          <div className="rounded-lg border border-hairline p-4 md:p-6">
            <Timeline
              entries={[
                { id: '1', title: 'Quantity adjusted (+0.5 MT)', at: '2026-10-23T09:12:00Z', actor: 'Amina Bello (supplier)', tone: 'success' },
                { id: '2', title: 'Quarantine released', at: '2026-10-22T16:40:00Z', actor: 'MINMEG staff', description: 'Assay certificate SON-CAL-2026-0441 checked.', tone: 'warning' },
                { id: '3', title: 'Quarantined', at: '2026-10-21T08:05:00Z', actor: 'MINMEG staff', description: 'Seal number did not match the dispatch record.', tone: 'error' },
                { id: '4', title: 'Batch registered', at: '2026-10-20T07:00:00Z', actor: 'Amina Bello (supplier)' },
              ]}
            />
          </div>
        </div>
      </Section>

      <Section title="States">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-hairline"><EmptyState title="No shipments yet" description="Shipments appear here once a trade is agreed." /></div>
          <div className="rounded-lg border border-hairline"><ErrorState description="Network error: check your connection." onRetry={() => undefined} /></div>
          <div className="rounded-lg border border-hairline"><NoAccess /></div>
        </div>
      </Section>

      <Section title="Layers">
        <div className="flex flex-wrap gap-3">
          <Button color="error" onClick={() => setConfirm(true)}>Quarantine device…</Button>
          <Button variant="outlined" color="secondary" onClick={() => setSheet(ROWS[0])}>Open side sheet</Button>
          <Button variant="outlined" color="secondary" onClick={() => toast.success('Batch MB-2026-000004 registered')}>Success toast</Button>
          <Button variant="outlined" color="secondary" onClick={() => toast.error('Batch MB-2026-000001 has only 2.5 MT available')}>Error toast</Button>
        </div>
      </Section>

      <ConfirmDialog
        open={confirm}
        title="Quarantine this device?"
        description="Its keys are revoked at once and data from it is refused."
        tone="error"
        confirmLabel="Quarantine"
        reason={{ label: 'Reason', placeholder: 'What happened?', minLength: 5 }}
        onConfirm={() => setConfirm(false)}
        onClose={() => setConfirm(false)}
      />
      <SideSheet
        open={!!sheet}
        onClose={() => setSheet(null)}
        title={sheet?.batchCode ?? ''}
        subtitle={sheet?.material}
        footer={
          <>
            <Button variant="outlined" color="secondary" onClick={() => setSheet(null)}>Close</Button>
            <Button>Edit batch</Button>
          </>
        }
      >
        {sheet && (
          <KeyValueList
            items={[
              { label: 'Batch ID', value: <CopyableId value={sheet.id} /> },
              { label: 'Status', value: <StatusBadge status={sheet.status} /> },
              { label: 'Quantity', value: formatQuantity(sheet.quantity, 'MT') },
              { label: 'Updated', value: formatDateTime(sheet.updatedAt) },
            ]}
          />
        )}
      </SideSheet>
    </main>
  );
}
