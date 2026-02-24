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
    unreadCount: number;
    lastMessageTime?: { seconds: number };
    itemTitle?: string;
    itemId?: string;
    type: string;
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
  const { messages } = useContext(ChatContext);
  const otherUser = messages.find((message: any) => message.senderId === otherUserId);

  // Format timestamp from lastMessageTime
  const formattedTime = lastMessageTime
    ? dayjs(lastMessageTime instanceof Date ? lastMessageTime : (lastMessageTime as any).seconds * 1000).fromNow()
    : '';

  // Generate text avatar from username
  const textAvatar = generateTextAvatar(otherUserName || '');

  // Generate color from username for consistent avatar background
  const avatarBgColor = stringToColor(otherUserName || '');

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
          className={`${unreadCount > 0 ? 'ring-2 ring-emerald-500' : ''}`}
          style={{
            backgroundColor: avatarBgColor,
            height: '40px',
            width: '40px',
            fontSize: 'var(--fontSize-sm)',
          }}
        >
          {textAvatar}
        </Avatar>

        {/* RECIPIENTS & CONTENT */}
        <Box className="flex-auto overflow-hidden relative">
          {itemType !== 'business' ? (
            <Typography noWrap className="text-[12px] text-[#818080]" variant="subtitle2">
              {otherUserName || itemTitle}
            </Typography>
          ) : (
            <Typography noWrap className="text-[12px] text-[#818080]" variant="subtitle2">
              {otherCompanyName}
            </Typography>
          )}
          <Typography noWrap className="text-[14px] font-bold" variant="subtitle2">
            {itemType !== 'business' ? itemTitle : otherUserName}
          </Typography>
          <Stack direction="row" spacing={1} className="items-center">
            <Typography color="text.secondary" noWrap className="flex-auto" variant="subtitle2">
              {getDisplayContent(lastMessage, user?.id)}
            </Typography>
          </Stack>
        </Box>

        {/* STATUS & TIME (right column) */}
        <Box className="flex flex-col items-end gap-1 shrink-0">
          {metadata?.status && (
            <Box className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter border leading-none
              ${metadata.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                metadata.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                  'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
              {metadata.status}
            </Box>
          )}
          <Typography color="text.secondary" className="whitespace-nowrap relative" variant="caption">
            {formattedTime}
            {unreadCount > 0 && (
              <Box
                className="bg-emerald-500 text-white text-[12px] rounded-full absolute -right-[2px] -top-[25px] flex items-center justify-center p-1 h-[18px] min-w-[18px]"
                style={{ zIndex: 50 }}
              >
                {unreadCount}
              </Box>
            )}
          </Typography>
        </Box>
      </Box>

      <Divider className="mt-2 border-[var(--mui-palette-divider)]" />
    </li>
  );
}
