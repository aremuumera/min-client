'use client';

import * as React from 'react';
import Link from 'next/link';
import { AnnouncementStrip, DropdownSelect } from '@/components/ui';
import { useAuthIdentity } from '@/hooks/use-auth-identity';
import { canOpenArea, useActor } from '@/lib/permissions';
import { useSse } from '@/lib/realtime/use-sse';
import { DEFAULT_WINDOW, PRESETS, windowQuery, type Preset, type WindowChoice } from '@/lib/analytics';
import { paths } from '@/config/paths';
import { useGetOverviewQuery } from '@/redux/features/analytics/analytics_api';
import { ActivityTimeline } from './activity-timeline';
import { KeyNumbers, PassportsCard, QuickActions, ShipmentsCard, StockCard } from './overview-cards';
import { RecentTrades, RoleUpgradeNotice, SetupChip, TradeStages, WaitingForYou } from './overview-sections';

/*
 * The merchants overview (decisions #147 to #150; design "Overview per role", direction B with quick
 * actions and trades in progress from A). One page for buyers, suppliers and companies that do both;
 * each part shows only what the role does and what a team member's keys open.
 */
type Role = 'buyer' | 'supplier' | 'buyer_supplier';

export function MerchantOverview() {
  const { user, isBuyer, isDualRole, isTeamMember } = useAuthIdentity();
  const actor = useActor();
  const role: Role = isDualRole ? 'buyer_supplier' : isBuyer ? 'buyer' : 'supplier';
  const [choice, setChoice] = React.useState<WindowChoice>(DEFAULT_WINDOW);
  const q = React.useMemo(() => windowQuery(choice) ?? {}, [choice]);
  const overview = useGetOverviewQuery({ from: q.from, to: q.to, limit: 5 });
  const data = overview.data?.data;
  // a new notice usually means something changed: ask again (REST + SSE, never Firestore for tracking)
  useSse('/notifications/stream', (e) => {
    if (e.event === 'notification') overview.refetch();
  });
  const both = role === 'buyer_supplier';
  const upgrade = !isTeamMember && role !== 'buyer_supplier';

  return (
    <div className="space-y-6 pb-10" data-testid="merchant-overview">
      {/* the premium strip (owner, 2026-11-24): owners only; × hides it until the page is reloaded */}
      {!isTeamMember && (
        <AnnouncementStrip
          data-testid="premium-strip"
          title="Premium is coming to MINMEG."
          message="More team members, more storage and priority help from MINMEG."
          actionLabel="See what's included"
          actionHref={paths.pricing}
        />
      )}
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-medium tracking-tight text-ink md:text-[34px]">Welcome back{user?.firstName ? `, ${user.firstName}` : ''}</h1>
          <p className="mt-1.5 text-base text-slate">{role === 'buyer' ? 'How your buying on MINMEG is going.' : both ? 'How your selling and buying on MINMEG are going.' : 'How your business on MINMEG is going.'}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SetupChip setup={data?.setup ?? null} />
            {upgrade && (
              <Link href={paths.dashboard.becomeASupplier} className="px-1 text-[13px] font-medium text-primary hover:text-primary-pressed">
                {role === 'buyer' ? 'Want to sell too? Become a supplier' : 'Want to buy too? Become a buyer'}
              </Link>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownSelect aria-label="Period" value={choice.preset} onValueChange={(v) => setChoice({ ...DEFAULT_WINDOW, preset: v as Preset })} options={PRESETS.filter((p) => p.value !== 'custom')} className="w-44" />
          {canOpenArea(actor, 'analytics') && (
            <Link href={paths.dashboard.analytics} className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-deep">
              Open analytics
            </Link>
          )}
        </div>
      </section>

      <RoleUpgradeNotice setup={data?.setup ?? null} />
      <QuickActions role={role} />
      <KeyNumbers role={role} q={q} skip={false} waiting={data?.waitingForYou ?? []} />
      <WaitingForYou items={data?.waitingForYou ?? []} isLoading={overview.isLoading} />

      <div className="flex flex-wrap items-start gap-6">
        {data && <TradeStages stages={data.stages} both={both} />}
        {canOpenArea(actor, 'activity') && (
          <div className="min-w-0 flex-[1_1_320px]">
            <ActivityTimeline />
          </div>
        )}
      </div>

      {data && (data.stages.selling || data.stages.buying) && <RecentTrades trades={data.recentTrades} both={both} />}

      <div className="flex flex-wrap items-stretch gap-6">
        {role !== 'buyer' && <StockCard />}
        {role !== 'supplier' && <StockCard received />}
        <ShipmentsCard />
        {role !== 'buyer' && <PassportsCard q={q} skip={false} />}
      </div>
    </div>
  );
}
