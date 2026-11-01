'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, Copy, Eye, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui';
import { paths } from '@/config/paths';
import { formatCompanyNameForUrl } from '@/utils/url-formatter';

/** After publishing: the link to the product page, ready to view, copy or share */
export function ListingSaved({ id, name }: { id: string; name: string }) {
  const url = `${typeof window === 'undefined' ? '' : window.location.origin}/dashboard/products/details/${id}/${formatCompanyNameForUrl(name) || 'product-details'}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: name, url });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') await copy();
    }
  };
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-xl border border-hairline bg-canvas px-6 py-12 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-green text-white">
        <Check className="h-8 w-8" aria-hidden />
      </span>
      <h2 className="text-xl font-medium text-ink">{name} is live</h2>
      <p className="text-sm text-steel">Buyers can find it on the marketplace now.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <a href={url} target="_blank" rel="noopener noreferrer"><Button startIcon={<Eye className="h-4 w-4" aria-hidden />}>View product</Button></a>
        <Button variant="outlined" onClick={copy} startIcon={<Copy className="h-4 w-4" aria-hidden />}>Copy link</Button>
        {typeof navigator !== 'undefined' && 'share' in navigator && <Button variant="outlined" onClick={share} startIcon={<Share2 className="h-4 w-4" aria-hidden />}>Share</Button>}
      </div>
      <Link href={paths.dashboard.products.list}><Button variant="text">Go to my listings</Button></Link>
    </div>
  );
}
