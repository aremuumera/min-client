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
import { useRouter, useParams } from 'next/navigation';

interface ThreadViewProps {
  threadId: string;
}

export function ThreadView({ threadId }: ThreadViewProps) {
  const { messages, conversations, setActiveConversation, loading, loadingMessages, sendMessage, activeInquiryId, setActiveInquiryId, roomInquiries } = React.useContext(ChatContext);
  const { user } = useSelector((state: any) => state.auth);
  const router = useRouter();
  const params = useParams();
  const threadType = params?.threadType as string;

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

      {/* Inquiry Sub-Tabs (Cycles) */}
      {roomInquiries && roomInquiries.length > 1 && (
        <div className="flex-none flex bg-gray-50 border-b border-gray-200 px-4 pt-2 gap-2 overflow-x-auto no-scrollbar">
          {roomInquiries.map((inq: any, index: number) => (
            <button
              key={inq.id}
              onClick={() => {
                setActiveInquiryId?.(inq.id);
                router.push(`/dashboard/chat/${threadType}/${threadId}/${inq.id}`);
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeInquiryId === inq.id
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Trade Cycle #{roomInquiries.length - index}
              {inq.type === 'rfq_offer'
                ? inq.display_price && <span className="ml-1 opacity-70">({inq.currency === 'USD' ? '$' : '₦'}{Number(inq.display_price).toLocaleString()}/unit)</span>
                : inq.quantity && <span className="ml-1 opacity-70">({inq.quantity} {inq.measure_type})</span>
              }
            </button>
          ))}
        </div>
      )}

      <Stack
        ref={messagesRef}
        spacing={2}
        className="flex-auto overflow-y-auto p-6 relative"
        style={{ scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {loadingMessages && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <CircularProgress />
          </div>
        ) : (
          messages.map((message: any) => (
            <MessageBox key={message.id} message={message} />
          ))
        )}
      </Stack>
      {/* {
        thread.metadata?.status === 'pending' && user?.id && thread.metadata?.supplier_id && String(user.id) === String(thread.metadata.supplier_id) ? (
          <ActionPanel thread={thread} />
        ) : (
          <MessageAdd onSend={handleSendMessage} />
        )
      } */}
      {/* Transition to Message Input once acknowledged/started */}
      {(() => {
        const activeInq = roomInquiries.find((i: any) => i.id === activeInquiryId);
        const currentStatus = activeInq?.status || thread.metadata?.status;
        const isRejected = currentStatus === 'rejected';
        const isPending = currentStatus === 'pending';
        const isSupplier = user?.id && (thread.metadata?.supplier_id && String(user.id) === String(thread.metadata.supplier_id));

        // 1) If rejected, show the rejection card (ActionPanel handles this UI)
        if (isRejected) {
          // Merge metadata so ActionPanel gets the correct status and reason
          const rejectedThread = {
            ...thread,
            metadata: {
              ...thread.metadata,
              status: 'rejected',
              rejection_reason: activeInq?.rejection_reason || thread.metadata?.rejection_reason
            }
          };
          return <ActionPanel thread={rejectedThread} />;
        }

        // 2) If pending and user is the supplier, show action buttons
        if (isPending && isSupplier) {
          return <ActionPanel thread={thread} />;
        }

        // 3) Otherwise show message input
        return <MessageAdd onSend={handleSendMessage} />;
      })()}
    </Box >
  );
}
