import * as React from 'react';
import { cn } from '@/utils/helper';
import { flagOf, type MarketBrief } from '@/lib/markets';

/*
 * MarketMark — a market shown as its picture (uploaded by staff) or, without one, its flag, then its
 * name. Used wherever a template or standard shows which markets it is for (decision #142).
 * A market is a label: it does not say the market's authorities approve anything.
 */
export function MarketMark({ market, showName = true, size = 'sm', className }: { market: Pick<MarketBrief, 'code' | 'name' | 'countryCode' | 'imageUrl'>; showName?: boolean; size?: 'sm' | 'md'; className?: string }) {
  const flag = flagOf(market.countryCode);
  const box = size === 'md' ? 'h-8 w-8 text-xl' : 'h-5 w-5 text-sm';
  return (
    <span className={cn('inline-flex max-w-full items-center gap-1.5 rounded-full border border-hairline bg-canvas py-0.5 pl-1 text-xs font-medium text-ink', showName ? 'pr-2' : 'pr-1', className)} title={market.name} data-testid={`market-${market.code}`}>
      {market.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- a small picture from the image store
        <img src={market.imageUrl} alt="" className={cn('shrink-0 rounded-full object-cover', box)} />
      ) : (
        <span aria-hidden className={cn('flex shrink-0 items-center justify-center rounded-full bg-surface leading-none', box, !flag && 'text-[9px] font-bold text-steel')}>{flag || market.code.slice(0, 2)}</span>
      )}
      {showName ? <span className="truncate">{market.name}</span> : <span className="sr-only">{market.name}</span>}
    </span>
  );
}

/** Several markets in a row; nothing when there are none */
export function MarketMarks({ markets, className }: { markets: Array<Pick<MarketBrief, 'code' | 'name' | 'countryCode' | 'imageUrl'>> | undefined; className?: string }) {
  if (!markets?.length) return null;
  return <span className={cn('flex flex-wrap gap-1', className)}>{markets.map((m) => <MarketMark key={m.code} market={m} />)}</span>;
}
