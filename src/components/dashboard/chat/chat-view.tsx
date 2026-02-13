'use client';

import * as React from 'react';
import { paths } from '@/config/paths';
import { Box } from '@/components/ui/box';
import { IconButton } from '@/components/ui/icon-button';
import { List as ListIcon } from '@phosphor-icons/react/dist/ssr/List';
import { useRouter } from 'next/navigation';

import { useMediaQuery } from '@/hooks/use-media-query';
import { usePathname } from '@/hooks/use-pathname';

import { ChatContext } from './chat-context';
import { Sidebar } from './sidebar';

export function ChatView({ children }: { children?: React.ReactNode }) {
  const {
    contacts,
    threads,
    messages,
    createThread,
    openDesktopSidebar,
    setOpenDesktopSidebar,
    openMobileSidebar,
    setOpenMobileSidebar,
  } = React.useContext(ChatContext);

  const router = useRouter();

  const pathname = usePathname();

  // The layout does not have a direct access to the current thread id param, we need to extract it from the pathname.
  const segments = pathname.split('/').filter(Boolean);
  const currentThreadId = (segments.length === 4 || segments.length === 5) ? segments[3] : undefined;

  const mdDown = useMediaQuery('down', 'md');

  const handleContactSelect = React.useCallback(
    (contactId: string) => {
      const threadId = createThread({ type: 'direct', recipientId: contactId });

      router.push(paths.dashboard.chat.thread('direct', threadId!));
    },
    [router, createThread]
  );

  const handleThreadSelect = React.useCallback(
    (threadType: string, threadId: string, itemId: string = '0') => {
      router.push(paths.dashboard.chat.thread(threadType, threadId, itemId));
    },
    [router]
  );

  return (
    <Box sx={{ display: 'flex', flex: '1 1 0', minHeight: 0 }}>
      <Sidebar
        contacts={contacts}
        currentThreadId={currentThreadId}
        messages={messages}
        onCloseMobile={() => {
          setOpenMobileSidebar(false);
        }}
        onSelectContact={handleContactSelect}
        onSelectThread={handleThreadSelect}
        openDesktop={openDesktopSidebar}
        openMobile={openMobileSidebar}
        threads={threads}
      />
      <Box sx={{ display: 'flex', flex: '1 1 auto', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: '1px solid var(--mui-palette-divider)', display: 'flex', flex: '0 0 auto', p: 2 }}>
          <IconButton
            aria-label="Toggle sidebar"
            onClick={() => {
              if (mdDown) {
                setOpenMobileSidebar((prev: boolean) => !prev);
              } else {
                setOpenDesktopSidebar((prev: boolean) => !prev);
              }
            }}
          >
            <ListIcon />
          </IconButton>
        </Box>
        {children}
      </Box>
    </Box>
  );
}
