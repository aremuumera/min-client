'use client';

import * as React from 'react';
import { ExternalLink } from 'lucide-react';
import { Alert, StatusBadge, Switch, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { formatDate } from '@/lib/format';
import { countryName } from '@/lib/rfqs';
import { ORIGIN_SOURCE_TEXT, STEP_TEXT, type Passport, type SupplyChainStep } from '@/lib/passports';
import { useSetSupplyChainMutation } from '@/redux/features/passports/passports_api';

/*
 * The supply chain on a passport (decisions #129, #131, #132): from this passport's batch up to the
 * origin, each step with what happened, when, where it started, what MINMEG verified and, for a
 * handover between companies, the proof of it. Upwards only. Company names follow MINMEG's switch,
 * the passport owner's key and each company's own key. The owner decides whether the public page
 * shows it.
 */

const short = (hash: string | null) => (hash ? `${hash.slice(0, 10)}…${hash.slice(-6)}` : '');

function Step({ step, depth }: { step: SupplyChainStep; depth: number }) {
  const verified = [step.verifiedByMinmeg.origin && 'origin', step.verifiedByMinmeg.batch && 'batch', step.verifiedByMinmeg.inspection && 'inspection'].filter(Boolean) as string[];
  const title = step.step === 'REGISTERED' ? ORIGIN_SOURCE_TEXT[step.source ?? ''] ?? STEP_TEXT.REGISTERED : STEP_TEXT[step.step];
  return (
    <li className={depth ? 'ml-3 border-l border-hairline pl-3' : ''}>
      <div className="rounded-xl border border-hairline p-3" data-testid="supply-chain-step">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{title}</p>
            <p className="text-xs text-steel">
              {formatDate(step.at)}
              {step.material ? ` · ${step.material}` : ''}
              {step.origin ? ` · ${[step.origin.stateRegion, countryName(step.origin.countryCode) || step.origin.countryCode].filter(Boolean).join(', ')}` : ''}
            </p>
          </div>
          {verified.length > 0 && <StatusBadge tone="success">MINMEG verified the {verified.join(', ')}</StatusBadge>}
        </div>
        <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-steel">Company</dt>
            <dd className="text-ink">{step.company ?? 'Not shown'}</dd>
          </div>
          {step.batch && (
            <div>
              <dt className="text-xs text-steel">Batch</dt>
              <dd className="text-ink">{step.batch.batchCode}</dd>
            </div>
          )}
          {step.passport && (
            <div>
              <dt className="text-xs text-steel">Passport</dt>
              <dd className="text-ink">{step.passport.passportCode}</dd>
            </div>
          )}
        </dl>
        {step.handover && (
          <div className="mt-2 rounded-lg bg-surface p-2 text-xs text-slate" data-testid="supply-chain-handover">
            <p>
              Handover {step.handover.anchoredOnBlockchain ? 'on the blockchain' : 'sealed by MINMEG'}
              {step.handover.dataHash ? ` · fingerprint ${short(step.handover.dataHash)}` : ''}
            </p>
            {step.handover.explorerUrl && (
              <a href={step.handover.explorerUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-medium text-primary hover:underline">
                See it on Polygonscan <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            )}
          </div>
        )}
      </div>
      {step.from.length > 0 && (
        <ul className="mt-2 space-y-2" aria-label="Came from">
          {step.from.map((s, i) => (
            <Step key={`${s.at}-${i}`} step={s} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function SupplyChainSection({ passport, owner }: { passport: Passport; owner: boolean }) {
  const chain = passport.supplyChain;
  const [save, saveState] = useSetSupplyChainMutation();
  const [error, setError] = React.useState<string | null>(null);
  const { confirm, dialog } = useConfirm();
  if (!chain) return null;

  const setPublic = async (on: boolean) => {
    const ok = await confirm({
      title: on ? 'Show the supply chain on the public page?' : 'Hide the supply chain from the public page?',
      description: on
        ? 'Anyone who scans or opens this passport’s public page sees each step up to the origin, the companies when MINMEG shows names, and the proof of each handover. Never quantities, sites or batch numbers.'
        : 'The public page keeps showing the passport and its proof, without the supply chain. Signed-in readers still see it.',
      confirmLabel: on ? 'Show it' : 'Hide it',
    });
    if (!ok) return;
    setError(null);
    try {
      await save({ id: passport.id, showSupplyChain: on }).unwrap();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  return (
    <section className="space-y-3" aria-label="Supply chain" data-testid="supply-chain">
      <div>
        <h3 className="text-sm font-semibold text-ink">Supply chain</h3>
        <p className="text-sm text-steel">Where this material came from, step by step back to where it started. Each handover between companies is sealed by MINMEG.</p>
      </div>
      {owner && (
        <div className="space-y-2 rounded-xl border border-hairline p-3">
          <Switch
            label="Show the supply chain on the public page"
            description="Off: the public page shows the passport and its proof without the chain."
            checked={passport.showSupplyChain !== false}
            disabled={saveState.isLoading}
            onChange={(e) => setPublic(e.target.checked)}
            data-testid="supply-chain-public-switch"
          />
          {/* Decision #132: the owner's name key is built in the backend but hidden for now; every company is named.
          <Switch
            label="Show company names"
            checked={passport.showCompanyNames !== false}
            onChange={(e) => save({ id: passport.id, showCompanyNames: e.target.checked })}
          />
          */}
        </div>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      <ul className="space-y-2">
        <Step step={chain} depth={0} />
      </ul>
      {dialog}
    </section>
  );
}
