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
import { InspectorActionPanel } from './inspector-action-panel';
import { DocumentVault } from './document-vault';
import { ChatContext } from '@/providers/chat-provider';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface ThreadViewProps {
  threadId: string;
}

export function ThreadView({ threadId }: ThreadViewProps) {
  const { messages, conversations, activeConversation, setActiveConversation, loading, loadingMessages, sendMessage, activeInquiryId, setActiveInquiryId, roomInquiries, activeTab, setActiveTab } = React.useContext(ChatContext);
  const { user } = useSelector((state: any) => state.auth);
  const router = useRouter();
  const params = useParams();
  const threadType = params?.threadType as string;

  const thread = conversations.find((t: any) => t.conversationId === threadId);

  console.log('roomInquiries', roomInquiries)

  useEffect(() => {
    if (threadId && thread) {
      setActiveConversation?.(thread);
    }
  }, [threadId, conversations, setActiveConversation, thread]);

  const isInspector = user?.id && thread?.metadata?.inspector_id && String(user.id) === String(thread.metadata.inspector_id);
  const isSupplier = user?.id && thread?.metadata?.supplier_id && String(user.id) === String(thread.metadata.supplier_id);

  const messagesRef = React.useRef<HTMLDivElement>(null);

  const handleSendMessage = React.useCallback(
    async (type: string, content: any) => {
      try {
        if (type === 'text' && typeof content === 'string' && content.trim()) {
          await sendMessage?.(content, [], 'text');
        } else if (type === 'file' && content) {
          await sendMessage?.('', [content], 'file');
        }
      } catch (error: any) {
        console.error('Failed to send message:', error);
        toast.error(error?.message || 'Failed to send message. Please try again.');
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
              <span className="ml-1 opacity-70">
                ({inq.quantity} {inq.measure_type || 'MT'}
                {/* Hide price from inspectors */}
                {inq.type === 'rfq_offer' && inq.display_price && !isInspector && (
                  <> • {inq.currency === 'USD' ? '$' : '₦'}{Number(inq.display_price).toLocaleString()}/unit</>
                )}
                {/* Always show ref suffix for differentiation */}
                {inq.id && (
                  <> • Ref: ..{String(inq.id).slice(-4).toUpperCase()}</>
                )}
                )
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main Mode Tabs */}
      <div className="flex bg-white border-b border-gray-100 flex-none px-6 pt-2 select-none shadow-sm z-10 relative">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'chat'
            ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
            : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
        >
          Team Chat
        </button>
        <button
          onClick={() => setActiveTab('vault')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'vault'
            ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
            : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
        >
          Document Vault
        </button>
      </div>

      {activeTab === 'vault' ? (
        <div className="flex-auto overflow-y-auto bg-gray-50 relative p-6">
          <DocumentVault
            inquiryId={activeInquiryId || ''}
            itemType={(() => {
              const inq = roomInquiries.find((i: any) => i.id === activeInquiryId);
              if (!inq) return undefined;
              // Handle both new 'type' and legacy 'type' formats
              return (inq.type === 'rfq' || inq.type === 'rfq_offer') ? 'rfq' : 'product';
            })()}
          />
        </div>
      ) : (
        <>
          <Stack
            ref={messagesRef}
            spacing={2}
            className="flex-auto overflow-y-auto p-6 relative bg-gray-50/30"
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

          {/* Transition to Message Input once acknowledged/started */}
          {(() => {
            const activeInq = roomInquiries.find((i: any) => i.id === activeInquiryId);
            const currentStatus = activeInq?.status || thread.metadata?.status;
            const isRejected = currentStatus === 'REJECTED' || currentStatus === 'rejected';
            const isPending = currentStatus === 'PENDING' || currentStatus === 'pending' || currentStatus === 'pending_negotiation' || currentStatus === 'PENDING_NEGOTIATION';
            const _isSupplier = user?.id && (thread.metadata?.supplier_id && user.id === thread.metadata.supplier_id);
            const _isInspector = user?.id && (thread.metadata?.inspector_id && user.id === thread.metadata.inspector_id);

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

            // 2) If pending and user is the supplier, show action buttons (Product Inquiry only, NOT RFQ offers)
            if (isPending && _isSupplier && thread.metadata?.entity_type !== 'rfq') {
              return <ActionPanel thread={thread} />;
            }

            // 3) If user is an inspector, check their specific assignment status
            if (_isInspector) {
              const inspectorStatus = activeInq?.inspector_status || activeInq?.status || thread.metadata?.status;

              // Transition to chat ONLY if they have officially ACCEPTED or progressed further
              const isAccepted = ['ACCEPTED', 'SITE_VISIT', 'COMPLETED'].includes(inspectorStatus);

              if (!isAccepted) {
                return <InspectorActionPanel thread={thread} />;
              }
            }

            // 4) Otherwise show message input
            return <MessageAdd onSend={handleSendMessage} />;
          })()}
        </>
      )}
    </Box >
  );
}
