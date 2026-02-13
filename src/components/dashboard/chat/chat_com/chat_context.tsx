import React, { createContext, useCallback, useEffect, useState, Dispatch, SetStateAction } from 'react';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useSelector } from 'react-redux';
import { useRouter, useParams, usePathname } from 'next/navigation';

import { chatService, db, getUserName } from '../chat_service';

export interface Conversation {
  conversationId: string;
  unreadCount: number;
  [key: string]: any;
}

export interface Message {
  id: string;
  senderId: string;
  isRead: boolean;
  [key: string]: any;
}

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  loadingMessages: boolean;
  loadingAttachments: boolean;
  notifications: any[];
  openDesktopSidebar: boolean;
  setOpenDesktopSidebar: Dispatch<SetStateAction<boolean>>;
  openMobileSidebar: boolean;
  setOpenMobileSidebar: Dispatch<SetStateAction<boolean>>;
  setActiveConversation: (conversation: Conversation | null) => void;
  startConversation: (recipientId: string, itemData: any) => Promise<string | null>;
  sendMessage: (text: string, attachments: any[], type: string) => Promise<boolean>;
  uploadAttachment: (file: File) => Promise<any>;
  deleteAttachment: (conversationId: string, messageId: string, attachmentIndex: number) => Promise<boolean>;
  markMessageAsRead: (conversationId: string, messageId: string) => Promise<boolean>;
  clearAllNotifications: () => Promise<boolean>;
  clearSingleNotification: (notificationId: string) => Promise<boolean>;
  markMessageAsDelivered: (conversationId: string, messageId: string) => Promise<boolean>;
}

export const ChatContext = createContext<ChatContextType>({
  conversations: [],
  activeConversation: null,
  messages: [],
  loading: true,
  loadingMessages: false,
  loadingAttachments: false,
  notifications: [],
  openDesktopSidebar: true,
  setOpenDesktopSidebar: () => {},
  openMobileSidebar: false,
  setOpenMobileSidebar: () => {},
  setActiveConversation: () => {},
  startConversation: async () => null,
  sendMessage: async () => false,
  uploadAttachment: async () => null,
  deleteAttachment: async () => false,
  markMessageAsRead: async () => false,
  clearAllNotifications: async () => false,
  clearSingleNotification: async () => false,
  markMessageAsDelivered: async () => false,
});

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [openDesktopSidebar, setOpenDesktopSidebar] = React.useState(true);
  const [openMobileSidebar, setOpenMobileSidebar] = React.useState(false);
  const { user } = useSelector((state: any) => state.auth);
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`;

  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const threadId = params?.threadId as string;
  const threadType = params?.threadType as string;

  // Loading  user's conversations
  useEffect(() => {
    let unsubscribe = null;

    if (user?.id) {
      setLoading(true);
      unsubscribe = chatService.getUserConversations(user.id, (conversationList: Conversation[]) => {
        setConversations(conversationList);
        setLoading(false);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Loading  notifications
  useEffect(() => {
    let unsubscribe = null;

    if (user?.id) {
      unsubscribe = chatService.getUserNotifications(user.id, (notificationList: any[]) => {
        setNotifications(notificationList);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Loading  messages when active conversation changes
  useEffect(() => {
    let unsubscribe = null;

    if (activeConversation) {
      unsubscribe = chatService.getMessages(activeConversation.conversationId, (messageList: Message[]) => {
        setMessages(messageList);

        // Mark conversation as read if it has unread messages
        if (user && activeConversation.unreadCount > 0) {
          chatService.markConversationAsRead(activeConversation.conversationId, user.id);
        }
      });
    } else {
      setMessages([]);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeConversation, user, router]);

  // In your conversation component
  useEffect(() => {
    if (!activeConversation || !user?.id) return;

    const unsubscribe = chatService.trackConversationActivity(activeConversation.conversationId, user.id);

    return () => {
      unsubscribe(); // Clean up when component unmounts
    };
  }, [activeConversation, user]);

  // Function to start a new conversation
  const startConversation = useCallback(
    async (recipientId: string, itemData: any) => {
      if (!user) return null;

      try {
        const conversationId = await chatService.startConversation(user.id, recipientId, itemData);

        return conversationId;
      } catch (error) {
        console.error('Error starting conversation:', error);
        return null;
      }
    },
    [user]
  );

  // Function to send a message
  const sendMessage = useCallback(
    async (text: string, attachments: any[] = [], type: string) => {
      if (!user || !activeConversation) return false;

      if (!text && attachments.length === 0) return false; // No content to send
      if (type !== 'text' && type !== 'file') return false; // Invalid message type

      try {
        setLoadingMessages(true);
        await chatService.sendMessage(
          activeConversation.conversationId,
          user.id,
          `${fullName}`,
          `${user?.companyName}`,
          text,
          attachments,
          type
        );

        return true;
      } catch (error) {
        setLoadingMessages(false);
        console.error('Error sending message:', error);
        return false;
      } finally {
        setLoadingMessages(false);
      }
    },
    [user, activeConversation, setLoadingMessages, setLoading]
  );

  // Function to upload attachment
  const uploadAttachment = useCallback(
    async (file: File) => {
      if (!activeConversation) return null;

      try {
        setLoadingMessages(true);
        setLoadingAttachments(true); // Set loading state for attachments
        // Upload file to Firebase Storage
        const attachment = await chatService.uploadAttachment(file, activeConversation.conversationId);

        // Return complete attachment object with metadata
        return {
          name: file.name,
          size: file.size,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          url: attachment.url,
          contentType: file.type,
        };
      } catch (error) {
        console.error('Error uploading attachment:', error);
        return null;
      } finally {
        setLoadingMessages(false);
        setLoadingAttachments(false); // Reset loading state for attachments
      }
    },
    [activeConversation]
  );

  const deleteAttachment = useCallback(async (conversationId: string, messageId: string, attachmentIndex: number) => {
    console.log('deleteAttachment', { conversationId, messageId, attachmentIndex });
    try {
      await chatService.deleteAttachment(conversationId, messageId, attachmentIndex);
      return true;
    } catch (error) {
      console.error('Error deleting attachment:', error);
      return false;
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    if (!user?.id) return false;
    try {
      await chatService.clearAllNotifications(user.id);
      return true;
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      return false;
    }
  }, [user]);

  const markMessageAsDelivered = useCallback(async (conversationId: string, messageId: string) => {
    try {
      await chatService.markMessageAsDelivered(conversationId, messageId);
      return true;
    } catch (error) {
      console.error('Error marking message as delivered:', error);
      return false;
    }
  }, []);

  const markMessageAsRead = useCallback(async (conversationId: string, messageId: string) => {
    try {
      await chatService.markMessageAsRead(conversationId, messageId);
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }, []);

  const clearSingleNotification = useCallback(async (notificationId: string) => {
    try {
      await chatService.clearSingleNotification(notificationId);
      return true;
    } catch (error) {
      console.error('Error clearing single notification:', error);
      return false;
    }
  }, []);

  // In ChatProvider component
  useEffect(() => {
    if (!activeConversation || !user?.id) return;

    const unreadMessages = messages.filter((msg) => msg.senderId !== user.id && !msg.isRead);

    if (unreadMessages.length > 0) {
      const batch = writeBatch(db);
      unreadMessages.forEach((msg) => {
        const msgRef = doc(db, 'conversations', activeConversation.conversationId, 'messages', msg.id);
        batch.update(msgRef, {
          status: 'read',
          isRead: true,
          readAt: serverTimestamp(),
        });
      });

      // Also update the conversation to mark it as read
      chatService.markConversationAsRead(activeConversation.conversationId, user.id);

      batch.update(doc(db, 'conversations', activeConversation.conversationId), {
        isRead: true,
        updatedAt: serverTimestamp(),
      });

      // Update user's unread count
      batch.update(doc(db, 'userConversations', user.id), {
        [`conversations.${activeConversation.conversationId}.unreadCount`]: 0,
      });

      batch.commit().catch(console.error);
    }
  }, [messages, activeConversation, user]);

  const value = {
    conversations, // List of conversations for the current user
    activeConversation, // Currently active conversation of the current user
    setActiveConversation, // Function to set the active conversation
    messages, // List of messages for the active conversation
    loading,
    notifications, // List of notifications for the current user
    startConversation, // Function to start a new conversation
    sendMessage, // Function to send a message in the active conversation
    uploadAttachment, // Function to upload an attachment in the active conversation
    openDesktopSidebar,
    setOpenDesktopSidebar,
    openMobileSidebar,
    setOpenMobileSidebar,
    loadingMessages,
    setLoadingMessages,
    loadingAttachments,
    setLoadingAttachments,
    deleteAttachment,
    markMessageAsRead,
    clearAllNotifications,
    clearSingleNotification,
    markMessageAsDelivered,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
