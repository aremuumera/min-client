'use client';

import * as React from 'react';
import { paths } from '@/config/paths';
import { Box, Button, IconButton, Stack, Typography, Drawer } from '@/components/ui';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { X as XIcon } from '@phosphor-icons/react/dist/ssr/X';

import { useMediaQuery } from '@/hooks/use-media-query';

import { DirectSearch } from '../direct-search';
import { ThreadItem } from '../thread-item';
import { ConversationTypeFilter } from './type_filter';

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
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [selectedType, setSelectedType] = React.useState('product');

  // Calculate UNREAD conversation counts by type
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

    return counts;
  }, [conversations]);

  // Filter conversations based on selected type and search
  const filteredConversations = React.useMemo(() => {
    let result = conversations || [];

    // Apply type filter
    if (selectedType !== 'all') {
      result = result.filter((conv: any) => conv.itemType === selectedType);
    }

    // Apply search filter if active
    if (searchFocused && searchQuery) {
      result = result.filter((contact: any) => {
        return (
          contact.itemTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.otherUserName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.itemType?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    return result;
  }, [conversations, selectedType, searchFocused, searchQuery]);

  const typeShit = ['product', 'rfq', 'business', 'admin'];

  const handleSearchChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;

      setSearchQuery(value);

      if (!value) {
        setSearchResults([]);
        return;
      }

      const results = conversations.filter((contact: any) => {
        return (
          contact.itemTitle.toLowerCase().includes(value.toLowerCase()) ||
          contact.otherUserName.toLowerCase().includes(value.toLowerCase()) ||
          contact.itemType.toLowerCase().includes(value.toLowerCase())
        );
      });

      setSearchResults(results as any);
    },
    [conversations]
  );

  const handleSearchClickAway = React.useCallback(() => {
    if (searchFocused) {
      setSearchFocused(false);
      setSearchQuery('');
    }
  }, [searchFocused]);

  const handleSearchFocus = React.useCallback(() => {
    setSearchFocused(true);
  }, []);

  const handleSearchSelect = React.useCallback(
    (contact: any) => {
      onSelectContact?.(contact.id);

      setSearchFocused(false);
      setSearchQuery('');
    },
    [onSelectContact]
  );

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
        <IconButton onClick={onClose} aria-label="close" className='md:hidden '>
          <XIcon />
        </IconButton>
      </Stack>

      <Stack pt={1} pb={1} px={2} spacing={2}>
        <DirectSearch
          isFocused={searchFocused}
          onChange={handleSearchChange}
          onClickAway={handleSearchClickAway}
          onFocus={handleSearchFocus}
          onSelect={handleThreadSelect}
          query={searchQuery}
          results={searchResults}
        />
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
          style={{ display: searchFocused ? 'none' : 'flex', listStyle: 'none', margin: 0, paddingLeft: 0 }}
        >
          {filteredConversations?.length > 0 ? (
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
            <Stack component="li" spacing={1} sx={{ display: 'flex', listStyle: 'none', m: 0, p: 0 }}>
              <Typography variant="subtitle2" sx={{ textAlign: 'center', pt: '60px' }}>
                No conversations at this time...
              </Typography>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
