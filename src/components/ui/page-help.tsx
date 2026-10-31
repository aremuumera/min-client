'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Info, Lightbulb } from 'lucide-react';
import { SideSheet } from './side-sheet';

export interface PageHelpLink {
  label: string;
  /** Omitted for a page that is not built yet */
  href?: string;
  /** How that page relates to this one */
  why: string;
  /** e.g. "Coming in step 2.5" when there is no href yet */
  note?: string;
}

export interface PageHelpContent {
  /** The page name, as in its header */
  title: string;
  /** What the page is for, in a few sentences */
  purpose: string;
  /** A real-world case the page handles */
  example: { title: string; steps: string[] };
  /** Other pages this one feeds or depends on */
  links?: PageHelpLink[];
  /** Rules worth knowing before changing anything */
  goodToKnow?: string[];
}

/**
 * The (i) button next to a page title: opens what the page is for, a real-world example, the pages it
 * connects to and the rules to know. Content lives with the feature (e.g. lib/help/master-data.ts).
 */
export function PageHelp({ content }: { content: PageHelpContent }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`About this page: ${content.title}`}
        aria-haspopup="dialog"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-steel hover:bg-surface-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 md:h-9 md:w-9"
      >
        <Info className="h-5 w-5" aria-hidden />
      </button>
      <SideSheet open={open} onClose={() => setOpen(false)} title={`About ${content.title}`} subtitle="What this page is for and how it fits">
        <div className="flex flex-col gap-6 text-sm text-ink">
          <section>
            <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[1px] text-steel">What it is for</h3>
            <p className="leading-relaxed">{content.purpose}</p>
          </section>

          <section className="rounded-xl bg-surface-feature p-4">
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-ink">
              <Lightbulb className="h-4 w-4 text-primary-pressed" aria-hidden />
              Example: {content.example.title}
            </h3>
            <ol className="list-decimal space-y-1.5 pl-5 leading-relaxed">
              {content.example.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </section>

          {!!content.links?.length && (
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[1px] text-steel">How it connects</h3>
              <ul className="flex flex-col divide-y divide-hairline rounded-xl border border-hairline">
                {content.links.map((l) => (
                  <li key={l.label}>
                    {l.href ? (
                      <Link href={l.href} onClick={() => setOpen(false)} className="flex min-h-11 items-start gap-3 px-3 py-2.5 hover:bg-surface">
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-brand-green-dark">{l.label}</span>
                          <span className="block text-steel">{l.why}</span>
                        </span>
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-steel" aria-hidden />
                      </Link>
                    ) : (
                      <div className="px-3 py-2.5">
                        <span className="block font-medium text-ink">
                          {l.label}
                          {l.note && <span className="ml-2 text-xs font-normal text-muted">{l.note}</span>}
                        </span>
                        <span className="block text-steel">{l.why}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!!content.goodToKnow?.length && (
            <section>
              <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[1px] text-steel">Good to know</h3>
              <ul className="list-disc space-y-1.5 pl-5 leading-relaxed text-slate">
                {content.goodToKnow.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </SideSheet>
    </>
  );
}
