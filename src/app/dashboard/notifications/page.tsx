'use client';

import * as React from 'react';
import { useContext } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { List, ListItem, ListItemAvatar, ListItemText } from '@/components/ui/list';
import { Stack } from '@/components/ui/stack';
import { Typography } from '@/components/ui/typography';
import { ChatText as ChatTextIcon, X as XIcon } from '@phosphor-icons/react/dist/ssr';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { cn } from '@/utils/helper';

import { dayjs } from '@/lib/dayjs';
import { chatService } from '@/components/dashboard/chat/chat_service';
import { ChatContext } from '@/components/dashboard/chat/chat_com/chat_context';
import { useAppSelector } from '@/redux';

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
    senderId: string;
    senderCompanyName?: string;
    type: string;
    contentType: string;
}

const NotificationsPage = () => {
    const router = useRouter();
    const { user } = useAppSelector((state) => state.auth);
    const chatContext = useContext(ChatContext);

    const notifications: Notification[] = chatContext?.notifications || [];
    const clearAllNotifications = chatContext?.clearAllNotifications;
    const clearSingleNotification = chatContext?.clearSingleNotification;

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const handleMarkAllAsRead = async () => {
        try {
            const unreadNotifications = notifications.filter((n) => !n.isRead);
            for (const notification of unreadNotifications) {
                if (user?.id) {
                    await chatService.markConversationAsRead(notification.conversationId, user.id);
                }
            }
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const handleClearAll = async () => {
        try {
            if (clearAllNotifications) {
                await clearAllNotifications();
            }
        } catch (error) {
            console.error('Error clearing all notifications:', error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        try {
            if (!notification.isRead) {
                await clearSingleNotification?.(notification.id);
            }
            if (notification.conversationId) {
                router.push(`/dashboard/chat/${notification.itemType}/${notification.conversationId}/${notification?.itemId}`);
            }
        } catch (error) {
            console.error('Error handling notification click:', error);
        }
    };

    return (
        <Box className="p-6">
            <Stack direction="row" className="justify-between items-center mb-6">
                <Typography variant="h4">Notifications</Typography>
                <Stack direction="row" spacing={2}>
                    {unreadCount > 0 && (
                        <Button variant="outlined" onClick={handleMarkAllAsRead}>
                            <ChatTextIcon className="mr-2" /> Mark all as read
                        </Button>
                    )}
                    <Button variant="outlined" className="text-red-500 border-red-500 hover:bg-red-50" onClick={handleClearAll}>
                        <XIcon className="mr-2" /> Clear all
                    </Button>
                </Stack>
            </Stack>

            <Divider className="mb-6" />

            {notifications.length === 0 ? (
                <Box className="flex flex-col items-center pt-20">
                    <ChatTextIcon size={48} className="text-neutral-400" />
                    <Typography variant="h6" className="mt-4">
                        No notifications yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" className="mt-2">
                        Your notifications will appear here
                    </Typography>
                </Box>
            ) : (
                <List className="bg-white rounded-lg shadow-sm border border-neutral-200">
                    {notifications.map((notification, index) => (
                        <React.Fragment key={notification.id}>
                            <NotificationListItem notification={notification} onClick={() => handleNotificationClick(notification)} />
                            {index < notifications.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>
            )}
        </Box>
    );
};

function NotificationListItem({ notification, onClick }: { notification: Notification; onClick: () => void }) {
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
                'items-start px-6 py-4 cursor-pointer transition-colors hover:bg-neutral-50',
                !notification.isRead && 'bg-primary-50 hover:bg-primary-100'
            )}
        >
            <ListItemAvatar>
                <Avatar style={{ backgroundColor: 'var(--mui-palette-primary-main)' }}>
                    {getAvatarLetters(notification.senderName)}
                </Avatar>
            </ListItemAvatar>
            <ListItemText
                primary={<Typography variant="subtitle2" className="font-semibold">{notification.senderName || 'User'}</Typography>}
                secondary={
                    <div className="flex flex-col gap-1">
                        <Typography variant="body2" className="block">
                            {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" className="block text-neutral-500">
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
                <Box className="w-2 h-2 rounded-full bg-primary-500 ml-2 mt-2" />
            )}
        </ListItem>
    );
}

export default NotificationsPage;
