'use client';

import * as React from 'react';
import { useContext } from 'react';
import { Divider } from '@/components/ui/divider';
import { Avatar } from '@/components/ui/avatar';
import { Box } from '@/components/ui/box';
import { Stack } from '@/components/ui/stack';
import { Typography } from '@/components/ui/typography';
import { useSelector } from 'react-redux';

import { dayjs } from '@/lib/dayjs';
import { usePathname } from '@/hooks/use-pathname';

import { ChatContext } from '@/providers/chat-provider';
import { generateTextAvatar, stringToColor } from '@/utils/chat-utils';

import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { formatTradeStatusLabel } from '@/config/trade-stepper-config';

const typeColorMap: Record<string, string> = {
  product: 'bg-blue-50 text-blue-600 border-blue-100',
  rfq: 'bg-purple-50 text-purple-600 border-purple-100',
  business: 'bg-gray-50 text-gray-600 border-gray-100',
  admin: 'bg-amber-50 text-amber-600 border-amber-100',
  trade: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

function getDisplayContent(lastMessage: any, userId: string): string {
  // If lastMessage is a string, just return it
  if (typeof lastMessage === 'string') {
    return lastMessage;
  }

  // Otherwise, handle the message object structure
  const author = lastMessage?.otherUserId === userId ? 'Me: ' : '';
  const message = lastMessage?.type === 'image' ? 'Sent a photo' : lastMessage?.content;

  return `${author}${message || ''}`;
}

interface ThreadItemProps {
  active?: boolean;
  thread: {
    id: string;
    conversationId: string;
    itemType: string;
    lastMessage?: any;
    otherUserId?: string;
    otherUserName?: string;
    otherCompanyName?: string;
    tradeRef?: string;
    aliasText?: string;
    roleTag?: string;
    avatarText?: string;
    unreadCount: number;
    lastMessageTime?: { seconds: number };
    itemTitle?: string;
    itemId?: string;
    type: string;
    metadata?: {
      status?: string;
      [key: string]: any;
    };
  };
  onSelect?: () => void;
  messages: any[]; // Passed from sidebar
}

export function ThreadItem({ active = false, thread, onSelect }: ThreadItemProps) {
  const {
    conversationId,
    itemType,
    lastMessage,
    otherUserId,
    otherUserName,
    otherCompanyName,
    unreadCount,
    lastMessageTime,
    itemTitle,
    metadata
  } = thread;
  const { user } = useSelector((state: any) => state.auth);
  const pathname = usePathname();
  const { messages, activeConversation, activeInquiryId, roomInquiries } = useContext(ChatContext);
  const otherUser = messages.find((message: any) => message.senderId === otherUserId);

  // --- Dynamic Status Sync ---
  const isSelected = activeConversation?.conversationId === conversationId;
  const activeCycle = isSelected ? roomInquiries.find(i => i.id === activeInquiryId) : null;
  // const displayStatus = activeCycle?.status || metadata?.status;
  const displayStatus = isSelected && activeCycle?.status ? activeCycle.status : 'ACTIVE';

  // Format timestamp from lastMessageTime
  const formattedTime = lastMessageTime
    ? dayjs(lastMessageTime instanceof Date ? lastMessageTime : (lastMessageTime as any).seconds * 1000).fromNow()
    : '';

  // Generate text avatar from username
  const isTradeDesk = itemType === 'trade' || otherUserName === 'Min-meg Trade Desk';
  const textAvatar = thread.avatarText || (isTradeDesk ? 'MD' : generateTextAvatar(otherUserName || ''));

  // Avatar background color - Single Emerald Green
  const avatarBgColor = '#059669';

  // Determining background color based on unreadCount and active state
  const getBackgroundColor = () => {
    if (unreadCount > 0) {
      return 'rgba(16, 185, 129, 0.08)'; // Light emerald-500 highlight for unread
    }
    return 'transparent';
  };

  // Check if current route matches this conversation
  const isActive = pathname.includes(`/dashboard/chat/${itemType}/${conversationId}/${thread.itemId}`);

  return (
    <li className="select-none">
      <Box
        onClick={onSelect}
        onKeyUp={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            onSelect?.();
          }
        }}
        role="button"
        className={`flex items-center gap-2 p-3 cursor-pointer transition-all duration-200 rounded-xl outline-none
          ${isActive || active ? 'bg-emerald-50 border border-emerald-100 shadow-sm' : getBackgroundColor()}
          hover:bg-emerald-50/50`}
        tabIndex={0}
      >
        {/* Text Avatar */}
        <Avatar
          className={`text-white! ${unreadCount > 0 ? 'ring-2 ring-emerald-500' : ''}`}
          style={{
            backgroundColor: avatarBgColor,
            color: '#ffffff',
            height: '40px',
            width: '40px',
            fontSize: 'var(--fontSize-sm)',
          }}
        >
          {textAvatar}
        </Avatar>

        {/* RECIPIENTS & CONTENT */}
        <Box className="flex-auto min-w-0 space-y-0.5">
          {/* Row 1: Sub-header Title ("Min-meg Trade Desk") + Role Tag (Right: PURCHASE / SALES) */}
          <div className="flex items-center justify-between gap-1 min-w-0">
            <Typography noWrap className="text-[12px] font-semibold text-gray-600 truncate" variant="subtitle2">
              {itemType !== 'business' ? (otherUserName || itemTitle) : otherCompanyName}
            </Typography>
            {Boolean(thread.roleTag) && (
              <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                {thread.roleTag}
              </span>
            )}
          </div>

          {/* Row 2: Ref ID + Copy Button (Left) | Alias Pill Badge (Right: Supplier #1) */}
          <div className="flex items-center justify-between gap-1 min-w-0 my-0.5">
            {thread.tradeRef ? (
              <div className="flex items-center gap-1 text-[10px] font-bold font-mono text-gray-700 bg-gray-100/80 px-1.5 py-0.5 rounded border border-gray-200/60 shrink-0">
                <span>TRM-{conversationId.substring(0, 8).toUpperCase()}...</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(conversationId);
                    toast.info('Full Trade ID copied to clipboard');
                  }}
                  className="text-gray-400 hover:text-emerald-600 transition-colors p-0.5 shrink-0 ml-0.5"
                  title="Copy Full Trade ID"
                >
                  <Copy size={10} />
                </button>
              </div>
            ) : <div />}

            {thread.aliasText && (
              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80 shrink-0">
                {thread.aliasText}
              </span>
            )}
          </div>

          {/* Row 3: Product Name */}
          <Typography noWrap className="text-[13px] font-bold text-gray-900 leading-snug" variant="subtitle2">
            {itemType !== 'business' ? itemTitle : otherUserName}
          </Typography>

          {/* Row 4: Category Tag + Status Badge (Left) | Timestamp (Right) */}
          <div className="flex items-center justify-between gap-2 min-w-0 pt-0.5">
            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
              <span className={`text-[8px] font-bold uppercase px-1 py-0.5 rounded border shrink-0 ${typeColorMap[itemType] || typeColorMap.product}`}>
                {itemType}
              </span>
              {displayStatus && (
                <span
                  title={formatTradeStatusLabel(displayStatus)}
                  className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter border leading-none shrink min-w-0 truncate max-w-[120px]
                  ${String(displayStatus).toLowerCase().includes('pending') ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    String(displayStatus).toLowerCase().includes('reject') || String(displayStatus).toLowerCase().includes('cancel') ? 'bg-red-50 text-red-600 border-red-100' :
                      'bg-emerald-50 text-emerald-600 border-emerald-100'}`}
                >
                  {formatTradeStatusLabel(displayStatus)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-auto">
              <Typography color="text.secondary" className="text-[10px] whitespace-nowrap" variant="caption">
                {formattedTime}
              </Typography>
              {unreadCount > 0 && (
                <span className="bg-emerald-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.2 shrink-0">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
        </Box>
      </Box>

      <Divider className="mt-2 border-[var(--mui-palette-divider)]" />
    </li>
  );
}
