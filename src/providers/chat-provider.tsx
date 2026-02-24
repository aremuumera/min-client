'use client'


import React, { createContext, useCallback, useEffect, useState, Dispatch, SetStateAction } from 'react';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useSelector } from 'react-redux';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { chatService, db, getUserName } from '@/components/dashboard/chat/chat_service';
import { customerTradeChatService } from '@/components/dashboard/chat/trade_chat_service';
import { useAcknowledgeInquiryMutation, useRejectInquiryMutation } from '@/redux/features/trade/trade_api';


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
  acknowledgeTrade: (tradeId: string) => Promise<boolean>;
  rejectTrade: (tradeId: string, reason: string) => Promise<boolean>;
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
  setOpenDesktopSidebar: () => { },
  openMobileSidebar: false,
  setOpenMobileSidebar: () => { },
  setActiveConversation: () => { },
  startConversation: async () => null,
  sendMessage: async () => false,
  uploadAttachment: async () => null,
  deleteAttachment: async () => false,
  markMessageAsRead: async () => false,
  clearAllNotifications: async () => false,
  clearSingleNotification: async () => false,
  markMessageAsDelivered: async () => false,
  acknowledgeTrade: async () => false,
  rejectTrade: async () => false,
});

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [directConversations, setDirectConversations] = useState<Conversation[]>([]);
  const [tradeConversations, setTradeConversations] = useState<Conversation[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [openDesktopSidebar, setOpenDesktopSidebar] = React.useState(true);
  const [openMobileSidebar, setOpenMobileSidebar] = React.useState(false);
  const [acknowledgeInquiry] = useAcknowledgeInquiryMutation();
  const [rejectInquiry] = useRejectInquiryMutation();
  const { user, isTeamMember, ownerUserId } = useSelector((state: any) => state.auth);
  const effectiveUserId = isTeamMember ? ownerUserId : user?.id;
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`;

  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const threadId = params?.threadId as string;
  const threadType = params?.threadType as string;

  console.log('ChatProvider Debug:', { effectiveUserId, role: user?.role, loading });

  /*
    Previous Flow for buyer to supplier
  */
  // Loading user's conversations (Direct) // ─── LEGACY: Peer-to-Peer Conversation Loader ───

  // useEffect(() => {
  //   let unsubscribe = null;

  //   if (effectiveUserId) {
  //     setLoading(true);
  //     unsubscribe = chatService.getUserConversations(effectiveUserId, (list: Conversation[]) => {
  //       setDirectConversations(list);
  //       setLoading(false);
  //     });
  //   }

  //   return () => {
  //     if (unsubscribe) unsubscribe();
  //   };
  // }, [effectiveUserId]);

  // Loading  notifications
  useEffect(() => {
    let unsubscribe = null;

    if (effectiveUserId) {
      unsubscribe = chatService.getUserNotifications(effectiveUserId, (notificationList: any[]) => {
        setNotifications(notificationList);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Loading  messages when active conversation changes
  useEffect(() => {
    let unsubscribe: any = null;

    if (activeConversation) {
      // unsubscribe = chatService.getMessages(activeConversation.conversationId, (messageList) => {
      const isTradeType = ['trade', 'product', 'rfq', 'business'].includes(threadType) || activeConversation.conversationType === 'trade';

      if (isTradeType) {
        const spoke = customerTradeChatService.getUserSpoke(user?.role);
        unsubscribe = customerTradeChatService.getSpokeMessages(activeConversation.conversationId, spoke, (messageList: any[]) => {
          setMessages(messageList);

          // Mark conversation as read
          if (effectiveUserId) {
            customerTradeChatService.markSpokeAsRead(activeConversation.conversationId, spoke, effectiveUserId);
          }
        });
      } else {
        unsubscribe = chatService.getMessages(activeConversation.conversationId, (messageList: Message[]) => {
          setMessages(messageList);

          // Mark conversation as read if it has unread messages
          if (effectiveUserId && activeConversation.unreadCount > 0) {
            chatService.markConversationAsRead(activeConversation.conversationId, effectiveUserId);
          }
        });
      }
    } else {
      setMessages([]);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeConversation, user, router, threadType, effectiveUserId]);

  // In your conversation component
  useEffect(() => {
    if (!activeConversation || !effectiveUserId) return;

    const unsubscribe = chatService.trackConversationActivity(activeConversation.conversationId, effectiveUserId);

    return () => {
      unsubscribe(); // Clean up when component unmounts
    };
  }, [activeConversation, effectiveUserId]);

  // Function to start a new conversation
  const startConversation = useCallback(
    async (recipientId: string, itemData: any) => {
      if (!effectiveUserId) return null;

      try {
        const conversationId = await chatService.startConversation(effectiveUserId, recipientId, itemData);

        return conversationId;
      } catch (error) {
        console.error('Error starting conversation:', error);
        return null;
      }
    },
    [effectiveUserId]
  );

  // Function to send a message
  const sendMessage = useCallback(
    async (text: string, attachments: any[] = [], type: string) => {
      if (!user || !activeConversation) return false;

      if (!text && attachments.length === 0) return false; // No content to send
      if (type !== 'text' && type !== 'file') return false; // Invalid message type

      try {
        setLoadingMessages(true);

        const isTradeType = ['trade', 'product', 'rfq', 'business'].includes(threadType) ||
          activeConversation.conversationType === 'trade' ||
          activeConversation.itemType === 'trade';

        if (isTradeType) {
          const spoke = customerTradeChatService.getUserSpoke(user?.role);
          await customerTradeChatService.sendMessage(
            activeConversation.conversationId,
            spoke,
            user.id,
            user.role,
            fullName,
            user?.companyName || user?.company_name || 'Buyer',
            text,
            attachments
          );
        } else {
          await chatService.sendMessage(
            activeConversation.conversationId,
            user.id,
            `${fullName}`,
            `${user?.companyName}`,
            text,
            attachments,
            type
          );
        }

        return true;
      } catch (error) {
        setLoadingMessages(false);
        console.error('Error sending message:', error);
        return false;
      } finally {
        setLoadingMessages(false);
      }
    },
    [user, activeConversation, setLoadingMessages, setLoading, threadType, fullName]
  );

  // Function to upload attachment
  const uploadAttachment = useCallback(
    async (file: File) => {
      if (!activeConversation) return null;

      try {
        setLoadingMessages(true);
        setLoadingAttachments(true); // Set loading state for attachments
        // const attachment = await chatService.uploadAttachment(file, activeConversation.conversationId);
        let attachment: any;
        const isTradeType = ['trade', 'product', 'rfq', 'business'].includes(threadType) ||
          activeConversation.conversationType === 'trade' ||
          activeConversation.itemType === 'trade';

        if (isTradeType) {
          const spoke = customerTradeChatService.getUserSpoke(user?.role);
          attachment = await customerTradeChatService.uploadAttachment(file, activeConversation.conversationId, spoke);
        } else {
          attachment = await chatService.uploadAttachment(file, activeConversation.conversationId);
        }

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
    [activeConversation, threadType, user?.role]
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
    if (!effectiveUserId) return false;
    try {
      await chatService.clearAllNotifications(effectiveUserId);
      return true;
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      return false;
    }
  }, [effectiveUserId]);

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
    if (!activeConversation || !effectiveUserId) return;

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
      chatService.markConversationAsRead(activeConversation.conversationId, effectiveUserId);

      batch.update(doc(db, 'conversations', activeConversation.conversationId), {
        isRead: true,
        updatedAt: serverTimestamp(),
      });

      // Update user's unread count
      batch.update(doc(db, 'userConversations', effectiveUserId), {
        [`conversations.${activeConversation.conversationId}.unreadCount`]: 0,
      });

      batch.commit().catch(console.error);
    }
  }, [messages, activeConversation, effectiveUserId]);

  const acknowledgeTrade = useCallback(async (tradeId: string) => {
    try {
      await acknowledgeInquiry(tradeId).unwrap();
      return true;
    } catch (error) {
      console.error('Failed to acknowledge trade:', error);
      return false;
    }
  }, [acknowledgeInquiry]);

  const rejectTrade = useCallback(async (tradeId: string, reason: string) => {
    try {
      await rejectInquiry({ id: tradeId, reason }).unwrap();
      return true;
    } catch (error) {
      console.error('Failed to reject trade:', error);
      return false;
    }
  }, [rejectInquiry]);






  /*
New Flow for for all roles to Admin
*/


  // Loading user's trade rooms
  useEffect(() => {
    let unsubscribe: any = null;

    if (effectiveUserId && user?.role) {
      console.log('Fetching trade rooms for:', effectiveUserId, user.role);
      setLoading(true);
      unsubscribe = customerTradeChatService.getUserTradeRooms(effectiveUserId, user.role, (list: any[]) => {
        console.log('Trade rooms received:', list.length);
        setTradeConversations(list);
        setLoading(false);
      });
    } else {
      console.log('Skipping trade room fetch - missing:', { effectiveUserId, role: user?.role });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [effectiveUserId, user?.role]);



  // Merge conversations
  useEffect(() => {
    // Commenting out legacy merge: const merged = [...directConversations];
    let merged: any[] = [];

    // Add trade conversations that aren't already represented (unlikely to overlap IDs but good practice)
    tradeConversations.forEach(trade => {
      const exists = merged.find(c => c.conversationId === trade.conversationId);
      if (!exists) {
        merged.push(trade as any);
      }
    });

    // Sort by last message time
    merged.sort((a, b) => {
      const timeA = new Date(a.lastMessageTime || 0).getTime();
      const timeB = new Date(b.lastMessageTime || 0).getTime();
      return timeB - timeA;
    });

    setConversations(merged);
  }, [tradeConversations]);





  // Synthesize active conversation for trades
  useEffect(() => {
    const isTradeType = ['trade', 'product', 'rfq', 'business'].includes(threadType);
    if (isTradeType && threadId && !activeConversation) {
      // Create a temporary conversation object for the trade
      const tempConversation: Conversation = {
        conversationId: threadId,
        conversationType: 'trade',
        unreadCount: 0,
        otherUserName: 'Min-meg Trade Desk',
        otherCompanyName: 'Platform Admin',
        itemTitle: 'Trade Inquiry',
        itemType: 'trade'
      };

      const existing = conversations.find((c) => c.conversationId === threadId);
      if (existing) {
        setActiveConversation(existing);
      } else {
        setActiveConversation(tempConversation);
        // Fetch actual metadata if needed
        customerTradeChatService.getTradeRoomMetadata(threadId).then(metadata => {
          if (metadata) {
            setActiveConversation({
              ...tempConversation,
              itemTitle: metadata.mineral_tag?.replace(/_/g, ' ') || 'Trade Inquiry',
              metadata: metadata
            });
          }
        });
      }
    }
  }, [threadType, threadId, activeConversation, conversations]);





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
    acknowledgeTrade,
    rejectTrade,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};


export function useChat() {
  const context = React.useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
