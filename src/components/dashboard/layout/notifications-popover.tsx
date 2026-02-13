'use client';

import * as React from 'react';
import { useContext } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { List, ListItem, ListItemAvatar, ListItemText } from '@/components/ui/list';
import { Popover } from '@/components/ui/popover';
import { Stack } from '@/components/ui/stack';
import { Tooltip } from '@/components/ui/tooltip';
import { Typography } from '@/components/ui/typography';
import { ChatText as ChatTextIcon } from '@phosphor-icons/react/dist/ssr/ChatText';
import { EnvelopeSimple as EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';

import { dayjs } from '@/lib/dayjs';
import { ChatContext } from '../chat/chat_com/chat_context';
import { chatService } from '../chat/chat_service';
import { cn } from '@/utils/helper';
import { useMediaQuery } from '@/hooks/use-media-query';

interface Notification {
    id: string;
    isRead: boolean;
    conversationId: string;
    itemType: string;
    itemId?: string;
    senderName: string;
    message: string;
    timestamp: any;
    itemTitle?: string;
}

interface NotificationsPopoverProps {
    trigger: React.ReactNode;
    onClose?: () => void;
    open?: boolean;
    anchorEl?: any;
}

export function NotificationsPopover({ trigger, onClose, open }: NotificationsPopoverProps) {
    const router = useRouter();
    const { user } = useSelector((state: any) => state.auth);
    const chatContext = useContext(ChatContext);
    const notifications: Notification[] = chatContext?.notifications || [];
    const clearSingleNotification = chatContext?.clearSingleNotification;

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const handleMarkAllAsRead = async () => {
        try {
            const unreadNotifications = notifications.filter((n) => !n.isRead);
            for (const notification of unreadNotifications) {
                await chatService.markConversationAsRead(notification.conversationId, user.id);
            }
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        try {
            if (!notification.isRead) {
                await clearSingleNotification?.(notification.id);
            }
            if (notification.conversationId) {
                router.push(`/dashboard/chat/${notification.itemType}/${notification.conversationId}/${notification?.itemId}`);
                onClose?.();
            }
        } catch (error) {
            console.error('Error handling notification click:', error);
        }
    };

    const isMobile = useMediaQuery('down', 'sm');

    return (
        <Popover
            trigger={trigger}
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) onClose?.();
            }}
            className={cn(
                "w-[calc(100vw-32px)] sm:w-[380px]",
                isMobile && "fixed left-4 right-4 top-20 translate-x-0! right-auto!"
            )}
            position="bottom"
            align={isMobile ? 'center' : 'end'}
        >
            <Stack direction="row" className="items-center justify-between px-4 py-2 border-b border-neutral-200">
                <Typography variant="h6">Notifications</Typography>
                <Stack direction="row" spacing={1}>
                    {unreadCount > 0 && (
                        <Button size="sm" variant="text" onClick={handleMarkAllAsRead}>
                            <EnvelopeSimpleIcon className="mr-1" /> Mark all read
                        </Button>
                    )}
                </Stack>
            </Stack>

            <div className="max-h-[400px] overflow-y-auto w-full pb-2">
                {notifications.length === 0 ? (
                    <Box className="p-4 flex justify-center">
                        <Typography variant="subtitle2" className="text-neutral-500">
                            No notifications at this time...
                        </Typography>
                    </Box>
                ) : (
                    <List>
                        {notifications.slice(0, 5).map((notification, index) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onClick={() => handleNotificationClick(notification)}
                                isLast={index === Math.min(notifications.length, 5) - 1}
                            />
                        ))}
                    </List>
                )}
            </div>

            {notifications.length > 5 && (
                <div className="p-2 border-t border-neutral-200">
                    <Tooltip content="View all notifications">
                        <Button
                            onClick={() => {
                                router.push('/dashboard/notifications');
                                onClose?.();
                            }}
                            variant="outlined"
                            className="w-full"
                        >
                            <ChatTextIcon className="mr-2" /> View all
                        </Button>
                    </Tooltip>
                </div>
            )}
        </Popover>
    );
}

function NotificationItem({ notification, onClick, isLast }: { notification: Notification; onClick: () => void; isLast: boolean }) {
    const getAvatarLetters = (name: string) => {
        if (!name) return '';
        const parts = name.split(' ');
        return parts.length > 1
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            : name.substring(0, 2).toUpperCase();
    };

    return (
        <ListItem
            onClick={onClick}
            className={cn(
                'items-start px-4 py-3 cursor-pointer transition-colors hover:bg-neutral-50',
                !notification.isRead && 'bg-primary-50 hover:bg-primary-100',
                !isLast && 'border-b border-neutral-100'
            )}
        >
            <ListItemAvatar>
                <Avatar style={{ backgroundColor: 'var(--mui-palette-primary-main)', height: '40px', width: '40px' }}>
                    {getAvatarLetters(notification.senderName)}
                </Avatar>
            </ListItemAvatar>
            <ListItemText
                primary={<Typography variant="subtitle2" className="font-semibold">{notification.senderName || 'User'}</Typography>}
                secondary={
                    <div className="flex flex-col gap-0.5">
                        <Typography variant="body2" className="block text-neutral-700 line-clamp-2">
                            {notification.message}
                        </Typography>
                        <Typography variant="caption" className="block text-neutral-400">
                            {dayjs(notification.timestamp).fromNow()}
                        </Typography>
                        {notification.itemTitle && (
                            <Typography variant="caption" className="block text-primary-500 font-medium">
                                {notification.itemTitle}
                            </Typography>
                        )}
                    </div>
                }
            />
            {!notification.isRead && (
                <Box className="w-2 h-2 rounded-full bg-primary-500 ml-2 mt-2 flex-none" />
            )}
        </ListItem>
    );
}
