import React, { useCallback, useContext, useEffect, useState } from 'react';
import { List as ListIcon } from '@phosphor-icons/react/dist/ssr/List';
import {
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  Typography
} from '@/components/ui';
import { useRouter, useParams, usePathname } from 'next/navigation';

import { useMediaQuery } from '@/hooks/use-media-query';

import { ChatContext } from '@/providers/chat-provider';
import { Sidebar } from './sidebar';

export function ChatView({ children }: { children?: React.ReactNode }) {
  const params = useParams();
  const threadId = params?.threadId as string;

  // console.log('params in chat', params);
  const {
    conversations,
    activeConversation,
    notifications,
    setActiveConversation,
    messages,
    loading,
    openDesktopSidebar,
    setOpenDesktopSidebar,
    openMobileSidebar,
    setOpenMobileSidebar,
  } = useContext(ChatContext);
  const router = useRouter();
  const pathname = usePathname();

  console.log('conversations', conversations);
  console.log('activeConversation', activeConversation);
  console.log('messages', messages);
  console.log('loading', loading);
  console.log('notifications', notifications);

  const mdDown = useMediaQuery('down', 'md');

  // Set active conversation when URL param changes (guard against redundant state updates)
  useEffect(() => {
    if (threadId && Array.isArray(conversations) && conversations.length > 0) {
      const conversation = conversations.find((c) =>
        String(c.conversationId).trim().toLowerCase() === String(threadId).trim().toLowerCase()
      );
      if (conversation && String(activeConversation?.conversationId).trim().toLowerCase() !== String(conversation.conversationId).trim().toLowerCase()) {
        setActiveConversation(conversation);
      }
    }
  }, [threadId, conversations, activeConversation?.conversationId, setActiveConversation]);

  // Auto-open mobile sidebar on mobile if no active thread is selected
  useEffect(() => {
    if (mdDown && !threadId) {
      setOpenMobileSidebar(true);
    }
  }, [mdDown, threadId, setOpenMobileSidebar]);

  // Handle conversation selection
  const handleContactSelect = useCallback(
    (id: string) => {
      if (id && Array.isArray(conversations) && conversations.length > 0) {
        const conversation = conversations.find((c) =>
          String(c.conversationId).trim().toLowerCase() === String(id).trim().toLowerCase()
        );
        if (conversation && String(activeConversation?.conversationId).trim().toLowerCase() !== String(conversation.conversationId).trim().toLowerCase()) {
          setActiveConversation(conversation);
        }
      }
    },
    [setActiveConversation, conversations, activeConversation?.conversationId]
  );

  // Handle thread / active conversation selection
  const handleThreadSelect = useCallback(
    (threadType: any, threadId: any, itemId: any) => {
      const targetPath = `/dashboard/chat/${threadType}/${threadId}/${itemId}`;
      if (pathname !== targetPath) {
        router.push(targetPath);
      }
    },
    [router, pathname]
  );

  const handleSidebarToggle = () => {
    if (mdDown) {
      setOpenMobileSidebar((prev) => !prev);
    } else {
      setOpenDesktopSidebar((prev) => !prev);
    }
  };

  const handleCloseMobileSidebar = () => {
    setOpenMobileSidebar(false);
  };

  // Loading state
  if (loading && conversations.length === 0) {
    return (
      <Box className="flex justify-center items-center h-screen flex-1">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box className="flex flex-1 min-h-0 h-full">
        <Sidebar
          conversations={conversations}
          currentConversationId={activeConversation?.conversationId}
          currentThreadId={activeConversation?.conversationId || activeConversation?.conversationId as any}
          messages={messages}
          onCloseMobile={handleCloseMobileSidebar}
          onSelectContact={handleContactSelect}
          onSelectConversation={handleThreadSelect}
          openDesktop={openDesktopSidebar}
          openMobile={openMobileSidebar}
          threads={conversations}
        />
        <Box className="flex flex-[1_1_auto] flex-col overflow-hidden">
          {/* <Box className="border-b border-neutral-200 flex flex-[0_0_auto]">
            <IconButton onClick={handleSidebarToggle} aria-label='Toggle Sidebar'>
              <ListIcon />
            </IconButton>
          </Box> */}
          {children}
        </Box>
      </Box>
    </>
  );
}
