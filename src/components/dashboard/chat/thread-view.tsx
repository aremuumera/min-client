'use client';

import * as React from 'react';
import { Box } from '@/components/ui/box';
import { Stack } from '@/components/ui/stack';
import { Typography } from '@/components/ui/typography';
import { CircularProgress } from '@/components/ui/progress';

import { MessageAdd } from './message-add';
import { MessageBox } from './message-box';
import { ThreadToolbar } from './thread-toolbar';
import { ActionPanel } from './action-panel';
import { ChatContext } from '@/providers/chat-provider';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';

interface ThreadViewProps {
  threadId: string;
}

export function ThreadView({ threadId }: ThreadViewProps) {
  const { messages, conversations, setActiveConversation, loading, sendMessage } = React.useContext(ChatContext);
  const { user } = useSelector((state: any) => state.auth);

  const thread = conversations.find((t: any) => t.conversationId === threadId);

  useEffect(() => {
    if (threadId && thread) {
      setActiveConversation?.(thread);
    }
  }, [threadId, conversations, setActiveConversation, thread]);

  const messagesRef = React.useRef<HTMLDivElement>(null);

  const handleSendMessage = React.useCallback(
    async (type: string, content: any) => {
      try {
        if (type === 'text' && typeof content === 'string' && content.trim()) {
          await sendMessage?.(content, [], 'text');
        } else if (type === 'file' && content) {
          await sendMessage?.('', [content], 'file');
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    [sendMessage]
  );

  React.useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  if (loading && !thread) {
    return (
      <Box className="flex items-center justify-center h-full flex-auto">
        <CircularProgress />
      </Box>
    );
  }

  if (!thread) {
    return (
      <Box className="flex items-center justify-center flex-auto">
        <Typography color="textSecondary" variant="h6">
          Thread not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col flex-auto min-h-0 h-full">
      <div className='ml-2'>
        <ThreadToolbar thread={thread} />
      </div>
      <Stack
        ref={messagesRef}
        spacing={2}
        className="flex-auto overflow-y-auto p-6"
        style={{ scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {messages.map((message: any) => (
          <MessageBox key={message.id} message={message} />
        ))}
      </Stack>
      {
        thread.metadata?.status === 'pending' && user?.role !== 'buyer' ? (
          <ActionPanel thread={thread} />
        ) : (
          <MessageAdd onSend={handleSendMessage} />
        )
      }
    </Box >
  );
}
