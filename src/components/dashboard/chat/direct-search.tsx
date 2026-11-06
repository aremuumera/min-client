'use client';

import * as React from 'react';
import { Input } from '@/components/ui';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { X as XIcon } from '@phosphor-icons/react/dist/ssr/X';

/*
 * The chat search (owner's question, 2026-11-06): it filters the company's own trade chats already loaded
 * in the list, as you type. Nothing is sent to a server. Trade chat is hub and spoke, so every chat is with
 * the MINMEG trade desk and searching "users" found nothing useful; it now matches what tells chats apart.
 */

/** The fields of a chat in the list the search reads (trade_chat_service builds them) */
export interface SearchableChat {
  itemTitle?: string;
  itemType?: string;
  conversationId?: string;
  itemId?: string;
  tradeRef?: string;
  aliasText?: string;
  roleTag?: string;
  lastMessage?: string | { content?: string } | null;
  metadata?: Record<string, unknown> | null;
}

/** The words a chat can be found by: product or mineral, exact trade / room / inquiry IDs, alias, status, purchase or sale, last message */
function searchTextOf(thread: SearchableChat): string {
  const m = thread?.metadata ?? {};
  const last = typeof thread?.lastMessage === 'string' ? thread.lastMessage : thread?.lastMessage?.content;
  return [
    thread?.itemTitle,
    thread?.itemType,
    thread?.conversationId,
    thread?.itemId,
    thread?.tradeRef,
    thread?.aliasText,
    thread?.roleTag,
    m.status,
    m.current_stage_slug,
    m.current_sub_status,
    m.mineral_tag,
    m.inquiry_id,
    m.rfq_offer_id,
    m.trade_ref,
    last,
  ]
    .filter((v) => typeof v === 'string' && v)
    .join(' \u0001 ')
    .toLowerCase()
    .replace(/[_]+/g, ' ');
}

/** Does the chat match every word typed (in any order)? */
export function chatMatches(thread: SearchableChat, query: string): boolean {
  // "in_transit", "in transit" and "In Transit" are the same search
  const words = query.trim().toLowerCase().replace(/[_]+/g, ' ').split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = searchTextOf(thread);
  return words.every((w) => text.includes(w));
}

interface ChatSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export function DirectSearch({ query, onQueryChange }: ChatSearchProps) {
  return (
    <div className="mr-2 pt-2">
      <Input
        type="search"
        aria-label="Search your chats"
        placeholder="Search product, trade ID, status"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && query) {
            e.stopPropagation();
            onQueryChange('');
          }
        }}
        startAdornment={<MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />}
        endAdornment={
          query ? (
            <button type="button" aria-label="Clear the search" className="flex items-center text-neutral-500 hover:text-neutral-800" onClick={() => onQueryChange('')}>
              <XIcon size={14} />
            </button>
          ) : null
        }
      />
    </div>
  );
}
