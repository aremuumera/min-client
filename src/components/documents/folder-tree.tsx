'use client';

import * as React from 'react';
import { ChevronRight, Folder, FolderOpen, Inbox, Layers } from 'lucide-react';
import { DropdownSelect, Skeleton } from '@/components/ui';
import { cn } from '@/utils/helper';
import { flattenFolders, type FolderNode, type FolderTree as Tree } from '@/lib/vault';

/** 'all' = every file; 'root' = files outside any folder; otherwise a folder id */
export type FolderChoice = 'all' | 'root' | string;

/** The vault's folders with file counts: a tree from tablet up, a select on phones */
export function FolderTree({ tree, loading, value, onChange }: { tree?: Tree; loading: boolean; value: FolderChoice; onChange: (v: FolderChoice) => void }) {
  const [open, setOpen] = React.useState<Set<string>>(new Set());
  const folders = (tree?.folders ?? []).filter((f) => f.status === 'ACTIVE');
  const flat = flattenFolders(folders);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const row = (key: FolderChoice, title: string, count: number | undefined, icon: React.ReactNode, depth = 0, expander?: React.ReactNode) => (
    <div className="flex items-center" style={{ paddingLeft: depth * 16 }}>
      {expander ?? <span className="w-7 shrink-0" aria-hidden />}
      <button
        type="button"
        onClick={() => onChange(key)}
        aria-current={value === key ? 'true' : undefined}
        className={cn('flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-left text-sm', value === key ? 'bg-brand-green-soft font-medium text-brand-green-dark' : 'text-ink hover:bg-surface')}
      >
        {icon}
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {count !== undefined && <span className="text-xs text-steel">{count}</span>}
      </button>
    </div>
  );

  const node = (n: FolderNode, depth: number): React.ReactNode => {
    const kids = n.children.filter((c) => c.status === 'ACTIVE');
    const isOpen = open.has(n.id);
    return (
      <li key={n.id}>
        {row(
          n.id,
          n.name,
          n.fileCount,
          value === n.id ? <FolderOpen className="h-4 w-4 shrink-0" aria-hidden /> : <Folder className="h-4 w-4 shrink-0 text-steel" aria-hidden />,
          depth,
          kids.length ? (
            <button type="button" onClick={() => toggle(n.id)} aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${n.name}`} aria-expanded={isOpen} className="flex h-10 w-7 shrink-0 items-center justify-center text-steel">
              <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} aria-hidden />
            </button>
          ) : undefined,
        )}
        {kids.length > 0 && isOpen && <ul>{kids.map((k) => node(k, depth + 1))}</ul>}
      </li>
    );
  };

  if (loading)
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );

  return (
    <>
      <div className="md:hidden">
        <DropdownSelect
          aria-label="Folder"
          value={value}
          onValueChange={onChange}
          options={[
            { value: 'all', label: 'All documents' },
            { value: 'root', label: 'Not in a folder' },
            ...flat.map((f) => ({ value: f.id, label: `${' '.repeat(f.depth)}${f.name} (${f.fileCount})` })),
          ]}
        />
      </div>
      <nav aria-label="Folders" className="hidden md:block">
        <ul className="flex flex-col gap-0.5">
          <li>{row('all', 'All documents', undefined, <Layers className="h-4 w-4 shrink-0 text-steel" aria-hidden />)}</li>
          <li>{row('root', 'Not in a folder', tree?.rootFileCount, <Inbox className="h-4 w-4 shrink-0 text-steel" aria-hidden />)}</li>
          {folders.map((f) => node(f, 0))}
        </ul>
      </nav>
    </>
  );
}
