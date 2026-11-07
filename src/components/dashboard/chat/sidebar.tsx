'use client';

import * as React from 'react';
import { paths } from '@/config/paths';
import { Box, Button, IconButton, Stack, Typography, Drawer } from '@/components/ui';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { X as XIcon } from '@phosphor-icons/react/dist/ssr/X';
import { ChatTeardropText } from '@phosphor-icons/react/dist/ssr/ChatTeardropText';

import { useMediaQuery } from '@/hooks/use-media-query';

import { DirectSearch, chatMatches } from './direct-search';
import { ThreadItem } from './thread-item';
import { ConversationTypeFilter } from './type_filter';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSse } from '@/lib/realtime/use-sse';
import { useGetMySupportQuery } from '@/redux/features/support/support_api';

interface SidebarProps {
  conversations: any[];
  currentConversationId?: string;
  currentThreadId?: string;
  messages: any[];
  onCloseMobile: () => void;
  onSelectContact: (id: string) => void;
  onSelectConversation: (type: any, id: any, itemId: any) => void;
  openDesktop: boolean;
  openMobile: boolean;
  threads?: any[];
}

export function Sidebar({
  messages,
  onCloseMobile,
  onSelectContact,
  openDesktop,
  openMobile,
  conversations,
  currentConversationId,
  onSelectConversation,
  currentThreadId,
}: SidebarProps) {
  const mdUp = useMediaQuery('up', 'md');
  // console.log('conversations', conversations);
  const content = (
    <SidebarContent
      conversations={conversations}
      closeOnSelectConversation={!mdUp}
      currentConversationId={currentConversationId}
      messages={messages}
      onClose={onCloseMobile}
      onSelectContact={onSelectContact}
      onSelectConversation={onSelectConversation}
    />
  );

  if (mdUp) {
    return (
      <Box
        style={{
          borderRight: '1px solid #e0e0e0',
          flex: '0 0 auto',
          marginLeft: openDesktop ? 0 : '-350px',
          position: 'relative',
          transition: 'margin 225ms cubic-bezier(0.0, 0, 0.2, 1) 0ms',
          width: '320px',
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <Drawer onClose={onCloseMobile} open={openMobile}>
      {content}
    </Drawer>
  );
}

function SidebarContent({
  conversations,
  currentConversationId,
  messages,
  onClose,
  onSelectContact,
  onSelectConversation,
  closeOnSelectConversation = true,
}: {
  conversations: any[];
  currentConversationId?: string;
  messages: any[];
  onClose: () => void;
  onSelectContact: (id: string) => void;
  onSelectConversation: (type: any, id: any, itemId: any) => void;
  closeOnSelectConversation?: boolean;
}) {
  // If you want to persist the search states, you can move it to the Sidebar component or a context.
  // Otherwise, the search states will be reset when the window size changes between mobile and desktop.
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedType, setSelectedType] = React.useState('all');

  // Auto-set filter based on current conversation
  // React.useEffect(() => {
  //   if (currentConversationId) {
  //     const activeConv = conversations.find(c => c.conversationId === currentConversationId);
  //     // Fallback: treat 'trade' as 'product' since 'trade' isn't a tab
  //     const effectiveType = activeConv?.itemType === 'trade' ? 'product' : activeConv?.itemType;

  //     if (effectiveType && effectiveType !== selectedType && ['product', 'rfq', 'business', 'admin'].includes(effectiveType)) {
  //       setSelectedType(effectiveType);
  //     }
  //   }
  // }, [currentConversationId, conversations, selectedType]);

  // Calculate UNREAD conversation counts by type
  const support = useGetMySupportQuery(undefined, { refetchOnMountOrArgChange: true });
  const supportUnread = support.data?.data?.unread ?? 0;
  useSse('/notifications/stream', (e) => {
    if (e.event === 'support') void support.refetch();
  });
  const pathname = usePathname();

  const conversationCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: 0,
      product: 0,
      rfq: 0,
      business: 0,
      admin: 0,
    };

    conversations?.forEach((conv: any) => {
      const unread = conv.unreadCount || 0;
      if (conv.itemType && counts[conv.itemType] !== undefined) {
        counts[conv.itemType] += unread;
        counts.all += unread;
      }
    });

    counts.admin = supportUnread;
    counts.all += supportUnread;

    return counts;
  }, [conversations, supportUnread]);

  // Filter conversations based on selected type and search
  const filteredConversations = React.useMemo(() => {
    let result = conversations || [];

    // Apply type filter
    if (selectedType !== 'all') {
      result = result.filter((conv: any) => {
        // Fallback: treat 'trade' as 'product' since 'trade' isn't explicitly in the tabs
        const effectiveType = conv.itemType === 'trade' ? 'product' : conv.itemType;
        return effectiveType === selectedType;
      });
    }

    // The search: product, trade ID, alias, status, last message (direct-search.tsx)
    if (searchQuery.trim()) result = result.filter((thread: any) => chatMatches(thread, searchQuery));

    return result;
  }, [conversations, selectedType, searchQuery]);

  const handleThreadSelect = React.useCallback(
    (threadType: any, threadId: any, itemId: any) => {
      onSelectConversation?.(threadType, threadId, itemId);

      if (closeOnSelectConversation) {
        onClose?.();
      }
    },
    [onSelectConversation, onClose, closeOnSelectConversation]
  );

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Stack direction="row" spacing={2} style={{ alignItems: 'center', flex: '0 0 auto', paddingLeft: '0.5rem' }}>
        <Typography style={{ flex: '1 1 auto', paddingTop: '1rem' }} variant="h5">
          Chats
        </Typography>
        {/* <IconButton onClick={onClose} aria-label="close" className='md:hidden '>
          <XIcon />
        </IconButton> */}
      </Stack>

      <Stack pt={1} pb={1} px={2} spacing={2}>
        <DirectSearch query={searchQuery} onQueryChange={setSearchQuery} />
        <ConversationTypeFilter
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          conversationCounts={conversationCounts}
        />
      </Stack>
      <Stack spacing={2} style={{ flex: '1 1 auto', overflowY: 'auto', padding: '0.5rem' }}>
        <Stack
          component="ul"
          spacing={1}
          style={{ display: 'flex', listStyle: 'none', margin: 0, paddingLeft: 0 }}
        >
          {(selectedType === 'all' || selectedType === 'admin') && (!searchQuery.trim() || chatMatches({ itemTitle: 'MINMEG Support', itemType: 'support', lastMessage: support.data?.data?.lastMessagePreview }, searchQuery)) && (
            <li>
              <Link
                href="/dashboard/chat/support"
                className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${pathname === '/dashboard/chat/support' ? 'border-emerald-200 bg-emerald-50' : 'border-transparent hover:bg-gray-50'}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">MD</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-gray-900">MINMEG Support</span>
                  <span className="block truncate text-xs text-gray-500">{support.data?.data?.lastMessagePreview || 'Contact MINMEG'}</span>
                </span>
                {supportUnread > 0 && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">{supportUnread}</span>}
              </Link>
            </li>
          )}
          {selectedType === 'admin' ? null : filteredConversations?.length > 0 ? (
            filteredConversations?.map((thread, i) => (
              <ThreadItem
                active={currentConversationId === thread.conversationId}
                key={i}
                onSelect={() => {
                  handleThreadSelect(thread.itemType, thread.conversationId, thread.itemId);
                }}
                thread={thread}
                messages={messages}
              />
            ))
          ) : (
            <li className="flex flex-col items-center justify-center py-12 px-4 text-center my-auto w-full">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100/80 shadow-sm">
                <ChatTeardropText size={28} weight="duotone" />
              </div>
              <Typography variant="subtitle2" className="font-bold text-gray-900 text-sm mb-1">
                {searchQuery.trim()
                  ? 'No chats match your search'
                  : selectedType === 'all'
                  ? 'No conversations yet'
                  : `No ${selectedType.toUpperCase()} conversations`}
              </Typography>
              <Typography variant="caption" className="text-gray-500 max-w-[220px] leading-relaxed text-xs">
                {searchQuery.trim()
                  ? 'Try a product, part of a trade ID, a status, Buyer #1 or Supplier #1.'
                  : selectedType === 'all'
                  ? 'Your active trade inquiries and messages will appear here.'
                  : `Trade inquiries related to ${selectedType} will show up in this section.`}
              </Typography>
            </li>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
