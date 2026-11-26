'use client';

import * as React from 'react';
import { CopyableId } from '@/components/ui/copyable-id';
import { useAuthIdentity } from '@/hooks/use-auth-identity';

/*
 * 6E (owner, 2026-11-25): a company's own MINMEG company ID, with a copy button. Other companies ask for
 * it when they share a document or hand goods over; until now no screen showed it. Team members see
 * their company's ID (the account owner's), exactly as stored, never shortened (rule 8).
 */
export function CompanyIdCard({ className = '' }: { className?: string }) {
  const { effectiveUserId } = useAuthIdentity();
  if (!effectiveUserId) return null;
  return (
    <section className={`rounded-xl border border-gray-200 bg-white p-4 ${className}`}>
      <h2 className="text-sm font-semibold text-gray-900">Your company ID</h2>
      <p className="mt-0.5 text-xs text-gray-500">Give this to another company when they share documents with you or hand goods over to you on MINMEG.</p>
      <div className="mt-2">
        <CopyableId value={String(effectiveUserId)} />
      </div>
    </section>
  );
}
