'use client';

import Link from 'next/link';
import { paths } from '@/config/paths';

const TABS = [
  { href: paths.dashboard.documents.list, label: 'My documents' },
  { href: paths.dashboard.documents.shared, label: 'Shared with me' },
  { href: paths.dashboard.documents.evidence, label: 'Company evidence' },
];

/** The tabs across the Documents pages */
export function DocumentsTabs({ current }: { current: string }) {
  return (
    <nav aria-label="Documents" className="mb-4 flex gap-1 overflow-x-auto border-b border-hairline">
      {TABS.map((t) =>
        t.href === current ? (
          <span key={t.href} aria-current="page" className="-mb-px shrink-0 border-b-2 border-primary-500 px-4 py-2 text-sm font-medium text-primary-pressed">
            {t.label}
          </span>
        ) : (
          <Link key={t.href} href={t.href} className="shrink-0 px-4 py-2 text-sm font-medium text-steel hover:text-ink">
            {t.label}
          </Link>
        ),
      )}
    </nav>
  );
}
