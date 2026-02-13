'use client';

import * as React from 'react';
import { Box } from '@/components/ui/box';
import { Stack } from '@/components/ui/stack';
import { Typography } from '@/components/ui/typography';
import { CircularProgress } from '@/components/ui/progress';

import { MessageAdd } from './message-add';
import { MessageBox } from './message-box';
import { ThreadToolbar } from './thread-toolbar';
import { ChatContext } from './chat_com/chat_context';
import { useEffect } from 'react';

interface ThreadViewProps {
  threadId: string;
}

export function ThreadView({ threadId }: ThreadViewProps) {
  const { messages, conversations, setActiveConversation, loading, sendMessage } = React.useContext(ChatContext);

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

  if (loading) {
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
      <ThreadToolbar thread={thread} />
      <Stack
        ref={messagesRef}
        spacing={2}
        className="flex-auto overflow-y-auto p-6"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.map((message: any) => (
          <MessageBox key={message.id} message={message} />
        ))}
      </Stack>
      <MessageAdd onSend={handleSendMessage} />
    </Box>
  );
}
