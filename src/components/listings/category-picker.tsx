'use client';

import * as React from 'react';
import { DropdownSelect, FormField } from '@/components/ui';
import { FIELD_INFO } from '@/lib/help/listing-fields';
import { categoryChain, type CategoryNode } from '@/lib/listings';

const LABELS = ['Main category', 'Category', 'Sub-category'];

/** Main category, then each level below it until there are no more. onChange gets the lowest one, or '' until it is reached */
export function CategoryPicker({ roots, value, error, onChange }: { roots: readonly CategoryNode[]; value: string; error?: string; onChange: (leafId: string) => void }) {
  const [chain, setChain] = React.useState<string[]>(() => categoryChain(roots, value));
  React.useEffect(() => {
    if (value && !chain.length) setChain(categoryChain(roots, value));
  }, [roots, value, chain.length]);

  const levels: { options: readonly CategoryNode[]; selected: string }[] = [];
  let options: readonly CategoryNode[] = roots;
  for (let depth = 0; options.length; depth++) {
    const selected = chain[depth] ?? '';
    levels.push({ options, selected });
    options = options.find((n) => n.id === selected)?.children ?? [];
  }

  const choose = (depth: number, id: string) => {
    const next = [...chain.slice(0, depth), ...(id ? [id] : [])];
    setChain(next);
    const node = levels[depth].options.find((n) => n.id === id);
    onChange(node && !node.children.length ? id : '');
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {levels.map((level, depth) => (
        <FormField
          key={depth}
          label={LABELS[depth] ?? `Level ${depth + 1}`}
          htmlFor={`listing-category-${depth}`}
          required
          info={depth === 0 ? FIELD_INFO.mainCategory : FIELD_INFO.category}
          error={depth === levels.length - 1 ? error : undefined}
        >
          <DropdownSelect id={`listing-category-${depth}`} value={level.selected} onValueChange={(id) => choose(depth, id)} options={level.options.map((n) => ({ value: n.id, label: n.name }))} placeholder="Choose one" />
        </FormField>
      ))}
    </div>
  );
}
