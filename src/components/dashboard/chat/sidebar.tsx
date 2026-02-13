'use client';

import * as React from 'react';
import { paths } from '@/config/paths';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Stack } from '@/components/ui/stack';
import { Typography } from '@/components/ui/typography';
import { Drawer } from '@/components/ui/drawer';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { X as XIcon } from '@phosphor-icons/react/dist/ssr/X';

import { useMediaQuery } from '@/hooks/use-media-query';

import { DirectSearch } from './direct-search';
import { ThreadItem } from './thread-item';

interface SidebarProps {
  contacts: any[];
  currentThreadId?: string;
  messages: Map<string, any[]>;
  onCloseMobile?: () => void;
  onSelectContact?: (contactId: string) => void;
  onSelectThread?: (threadType: string, threadId: string) => void;
  openDesktop?: boolean;
  openMobile?: boolean;
  threads: any[];
}

export function Sidebar({
  contacts,
  currentThreadId,
  messages,
  onCloseMobile,
  onSelectContact,
  onSelectThread,
  openDesktop,
  openMobile,
  threads,
}: SidebarProps) {
  const mdUp = useMediaQuery('up', 'md');

  const content = (
    <SidebarContent
      closeOnGroupClick={!mdUp}
      closeOnThreadSelect={!mdUp}
      contacts={contacts}
      currentThreadId={currentThreadId}
      messages={messages}
      onClose={onCloseMobile}
      onSelectContact={onSelectContact}
      onSelectThread={onSelectThread}
      threads={threads}
    />
  );

  if (mdUp) {
    return (
      <Box
        style={{
          borderRight: '1px solid var(--mui-palette-divider)',
          flex: '0 0 auto',
          marginLeft: openDesktop ? 0 : '-320px',
          position: 'relative',
          transition: 'margin 225ms cubic-bezier(0.0, 0, 0.2, 1) 0ms',
          width: '320px',
        }}
        className="h-full"
      >
        {content}
      </Box>
    );
  }

  return (
    <Drawer onClose={onCloseMobile || (() => { })} open={!!openMobile} className="w-[320px]">
      {content}
    </Drawer>
  );
}

interface SidebarContentProps {
  closeOnGroupClick?: boolean;
  closeOnThreadSelect?: boolean;
  contacts: any[];
  currentThreadId?: string;
  messages: Map<string, any[]>;
  onClose?: () => void;
  onSelectContact?: (contactId: string) => void;
  onSelectThread?: (threadType: string, threadId: string) => void;
  threads: any[];
}

function SidebarContent({
  closeOnGroupClick,
  closeOnThreadSelect,
  contacts,
  currentThreadId,
  messages,
  onClose,
  onSelectContact,
  onSelectThread,
  threads,
}: SidebarContentProps) {
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any[]>([]);

  const handleSearchChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;

      setSearchQuery(value);

      if (!value) {
        setSearchResults([]);
        return;
      }

      const results = contacts.filter((contact) => {
        return contact.otherUserName?.toLowerCase().includes(value.toLowerCase());
      });

      setSearchResults(results);
    },
    [contacts]
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
    (itemType: string, conversationId: string, itemId: string) => {
      // Find contact by itemId or pass relevant info
      onSelectContact?.(itemId);
      setSearchFocused(false);
      setSearchQuery('');
    },
    [onSelectContact]
  );

  const handleThreadSelect = React.useCallback(
    (threadType: string, threadId: string) => {
      onSelectThread?.(threadType, threadId);

      if (closeOnThreadSelect) {
        onClose?.();
      }
    },
    [onSelectThread, onClose, closeOnThreadSelect]
  );

  return (
    <Box className="flex flex-col h-full">
      <Stack direction="row" spacing={2} className="items-center flex-none p-4">
        <Typography className="flex-auto" variant="h5">
          Chats
        </Typography>
        <IconButton
          aria-label="Close sidebar"
          onClick={onClose}
          className="md:hidden"
        >
          <XIcon />
        </IconButton>
      </Stack>
      <Stack spacing={2} className="flex-auto overflow-y-auto p-4">
        <DirectSearch
          isFocused={searchFocused}
          onChange={handleSearchChange}
          onClickAway={handleSearchClickAway}
          onFocus={handleSearchFocus}
          onSelect={handleSearchSelect}
          query={searchQuery}
          results={searchResults}
        />
        <Stack
          as="ul"
          spacing={1}
          style={{ display: searchFocused ? 'none' : 'flex' }}
          className="list-none m-0 p-0"
        >
          {threads.map((thread) => (
            <ThreadItem
              active={currentThreadId === thread.id}
              key={thread.id}
              messages={messages.get(thread.id) ?? []}
              onSelect={() => {
                handleThreadSelect(thread.type, thread.id);
              }}
              thread={thread}
            />
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
