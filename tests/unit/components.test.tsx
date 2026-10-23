import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusBadge, statusTone, statusLabel } from '@/components/ui/status-badge';
import { CopyableId } from '@/components/ui/copyable-id';
import { DataTable } from '@/components/ui/data-table';
import { FormField } from '@/components/ui/form-field';
import { QuantityInput } from '@/components/ui/quantity-input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatQuantity } from '@/lib/format';

/* Design-system components (docs/new/frontend/testing/frontend-testing.md §1) */

describe('StatusBadge', () => {
  it('maps backend statuses to one tone each', () => {
    expect(statusTone('ACTIVE')).toBe('success');
    expect(statusTone('pending_approval')).toBe('warning');
    expect(statusTone('QUARANTINED')).toBe('error');
    expect(statusTone('SOMETHING_NEW')).toBe('neutral');
    expect(statusLabel('PENDING_APPROVAL')).toBe('Pending approval');
    render(<StatusBadge status="REVOKED" />);
    expect(screen.getByText('Revoked').closest('[data-tone]')).toHaveAttribute('data-tone', 'error');
  });
});

describe('CopyableId', () => {
  it('shows the full id with its hyphens and copies it', async () => {
    const id = '935dc217-daa9-4e33-9b04-60996aa29181';
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<CopyableId value={id} label="Batch ID" />);
    expect(screen.getByText(id)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Copy Batch ID' }));
    expect(writeText).toHaveBeenCalledWith(id);
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });
});

describe('DataTable', () => {
  const columns = [
    { key: 'code', header: 'Code', cell: (r: { id: string; code: string; qty: string }) => r.code, mobile: 'title' as const },
    { key: 'qty', header: 'Quantity', cell: (r: { id: string; code: string; qty: string }) => r.qty, align: 'right' as const },
  ];
  it('renders a table and the phone cards; rows are clickable and keyboard reachable', async () => {
    const onRowClick = vi.fn();
    render(<DataTable caption="Batches" columns={columns} rows={[{ id: 'a', code: 'MB-2026-000001', qty: '20.5 MT' }]} getRowId={(r) => r.id} onRowClick={onRowClick} />);
    const table = screen.getByRole('table');
    expect(within(table).getByText('MB-2026-000001')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Batches' })).toBeInTheDocument();
    const row = within(table).getAllByRole('row')[1];
    row.focus();
    await userEvent.keyboard('{Enter}');
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });
  it('loading, empty and error states', () => {
    const { rerender } = render(<DataTable caption="Batches" columns={columns} rows={undefined} loading getRowId={(r) => r.id} />);
    expect(screen.getByLabelText('Loading Batches')).toHaveAttribute('aria-busy', 'true');
    rerender(<DataTable caption="Batches" columns={columns} rows={[]} getRowId={(r) => r.id} empty={{ title: 'No batches yet' }} />);
    expect(screen.getByText('No batches yet')).toBeInTheDocument();
    const onRetry = vi.fn();
    rerender(<DataTable caption="Batches" columns={columns} rows={[]} getRowId={(r) => r.id} error="The server is down" onRetry={onRetry} />);
    expect(screen.getByText('The server is down')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('FormField', () => {
  it('links the label, and shows the error for screen readers', () => {
    render(
      <FormField label="Batch code" htmlFor="code" required error="Code already used">
        <input id="code" />
      </FormField>,
    );
    const input = screen.getByLabelText(/Batch code/);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'code-error');
    expect(screen.getByRole('alert')).toHaveTextContent('Code already used');
  });
});

describe('quantities', () => {
  it('QuantityInput keeps an exact string with at most 6 decimals', async () => {
    const values: string[] = [];
    const onChange = vi.fn((v: string) => values.push(v));
    render(<QuantityInput aria-label="Quantity" value="" onChange={onChange} unit="MT" />);
    const input = screen.getByLabelText('Quantity');
    await userEvent.type(input, '1a');
    expect(onChange).toHaveBeenCalledWith('1');
    expect(values).not.toContain('1a');
    expect(screen.getByText('MT')).toBeInTheDocument();
  });
  it('formatQuantity never goes through a float', () => {
    expect(formatQuantity('120.500000', 'MT')).toBe('120.5 MT');
    expect(formatQuantity('1234567.000001')).toBe('1,234,567.000001');
    expect(formatQuantity('0.100000')).toBe('0.1');
    expect(formatQuantity(null)).toBe('—');
  });
});

describe('ConfirmDialog', () => {
  it('asks for a reason before a destructive action', async () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog open title="Quarantine device?" tone="error" confirmLabel="Quarantine" reason={{ label: 'Reason', minLength: 5 }} onConfirm={onConfirm} onClose={() => undefined} />);
    const confirm = screen.getByRole('button', { name: 'Quarantine' });
    expect(confirm).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Reason'), 'Seal broken');
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith('Seal broken');
  });
});
