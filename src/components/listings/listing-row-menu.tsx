'use client';

import * as React from 'react';
import Link from 'next/link';
import { MoreVertical } from 'lucide-react';

import { Menu, MenuItem } from '@/components/ui/menu';
import { actionsFor, isNonMineral, type Listing, type ListingAction } from '@/lib/listings';

import { ACTION_WORDS } from './listing-detail-sheet';

/**
 * The ⋮ menu on a row of My listings (owner's decision 2026-11-06): only the actions the listing's
 * status allows. Each opens the listing panel on its own confirm step, so the checks stay in one place.
 */
export function ListingRowMenu({ listing, editHref, onAction, onAddBatch }: { listing: Listing; editHref: string; onAction: (action: ListingAction) => void; onAddBatch: () => void }) {
  const actions = actionsFor(listing.status);
  const canAddBatch = !isNonMineral(listing) && listing.status !== 'archived' && listing.status !== 'closed';
  return (
    // the row opens the panel on click; the menu must not
    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="flex justify-end">
      <Menu
        align="end"
        usePortal
        trigger={
          <button type="button" aria-label={`Actions for ${listing.product_name}`} className="flex h-9 w-9 items-center justify-center rounded-md text-steel transition-colors hover:bg-surface hover:text-ink">
            <MoreVertical className="h-4 w-4" aria-hidden />
          </button>
        }
      >
        {listing.status !== 'archived' && (
          <MenuItem as={Link} href={editHref}>
            Edit
          </MenuItem>
        )}
        {actions.map((a) => (
          <MenuItem key={a} onClick={() => onAction(a)} disabled={(a === 'publish' || a === 'relist') && !listing.locationId} className={ACTION_WORDS[a].tone === 'error' ? 'text-semantic-error-text' : undefined}>
            {ACTION_WORDS[a].button}
          </MenuItem>
        ))}
        {canAddBatch && <MenuItem onClick={onAddBatch}>Add a batch</MenuItem>}
      </Menu>
    </div>
  );
}
