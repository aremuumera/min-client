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
  activeInquiryId: string | null;
  setActiveInquiryId: (id: string | null) => void;
  roomInquiries: any[];
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
  activeInquiryId: null,
  setActiveInquiryId: () => { },
  roomInquiries: [],
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
  const [activeInquiryId, setActiveInquiryId] = useState<string | null>(null);
  const [roomInquiries, setRoomInquiries] = useState<any[]>([]);
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
  const effectiveUserId = String(ownerUserId || user?.id || '').replace(/-/g, '');
  const userRole = user?.role || user?.team_role || user?.rtype || 'buyer';
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`;

  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const threadId = params?.threadId as string;
  const threadType = params?.threadType as string;

  // console.log('ChatProvider: Initializing with', { effectiveUserId, userRole });

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

  // Loading active room inquiries (tabs)
  useEffect(() => {
    let unsubscribe: any = null;

    if (activeConversation) {
      const isTradeType = ['trade', 'product', 'rfq', 'business'].includes(threadType) || activeConversation.conversationType === 'trade';

      if (isTradeType) {
        const conversationId = activeConversation.conversationId;

        // console.log('🟣 [ChatProvider] Room inquiries effect ENTERED. conversationId:', conversationId, 'effectiveUserId:', effectiveUserId, 'userRole:', userRole, 'firestorePath:', `trade_rooms/${conversationId}/trades`);

        unsubscribe = customerTradeChatService.getRoomInquiries(
          String(conversationId),
          effectiveUserId,
          userRole,
          (inquiries: any[]) => {
            // console.log('🔵 [ChatProvider] Room inquiries received:', inquiries.length, 'ids:', inquiries.map(i => i.id), 'for room:', conversationId);
            setRoomInquiries(inquiries);

            // Auto-select the inquiry from URL or the most recent one
            const urlItemId = params?.itemId as string;
            if (inquiries.length > 0) {
              setActiveInquiryId(prev => {
                // 1. If we have a URL param, prioritize it
                if (urlItemId && inquiries.find(i => i.id === urlItemId)) {
                  return urlItemId;
                }
                // 2. If we already had an active one that's still valid, keep it
                if (prev && inquiries.find(i => i.id === prev)) {
                  return prev;
                }
                // 3. Fallback to the first (newest) inquiry
                return inquiries[0].id;
              });
            } else {
              setActiveInquiryId(null);
            }
          }
        );
      } else {
        setRoomInquiries([]);
      }
    } else {
      setRoomInquiries([]);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeConversation, threadType]);

  // Loading  messages when active conversation changes
  useEffect(() => {
    let unsubscribe: any = null;

    if (activeConversation) {
      // unsubscribe = chatService.getMessages(activeConversation.conversationId, (messageList) => {
      const isTradeType = ['trade', 'product', 'rfq', 'business'].includes(threadType) || activeConversation.conversationType === 'trade';

      if (isTradeType) {
        if (!activeInquiryId) {
          // console.log('🔴 [ChatProvider] No activeInquiryId — messages cleared. threadType:', threadType, 'conversationId:', activeConversation.conversationId);
          setMessages([]);
          return;
        }

        const effectiveUserId = String(user.ownerUserId || user.id);
        const conversationId = activeConversation.conversationId;

        // console.log('🟢 [ChatProvider] Subscribing to messages:', {
        //   conversationId,
        //   activeInquiryId,
        //   userSpoke: activeConversation.userSpoke,
        //   firestorePath: `trade_rooms/${conversationId}/trades/${activeInquiryId}/threads/${activeConversation.userSpoke}/messages`,
        // });

        setLoadingMessages(true);
        unsubscribe = customerTradeChatService.getSpokeMessages(
          String(conversationId),
          activeInquiryId,
          activeConversation.userSpoke,
          (messageList: any[]) => {
            // console.log('🟡 [ChatProvider] Messages received:', messageList.length, 'for spoke:', activeConversation.userSpoke);
            setMessages(messageList);
            setLoadingMessages(false);

            // Mark as read when messages load or active conversation changes
            customerTradeChatService.markSpokeAsRead(
              String(conversationId),
              activeInquiryId,
              activeConversation.userSpoke,
              String(user.id)
            );
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
  }, [activeConversation, user, router, threadType, effectiveUserId, activeInquiryId]);

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
          const effectiveUserId = String(user.ownerUserId || user.id);
          const conversationId = activeConversation.conversationId;

          try {
            if (!activeInquiryId) return false;
            const msgId = await customerTradeChatService.sendMessage(
              String(conversationId),
              activeInquiryId,
              activeConversation.userSpoke,
              String(user.id),
              userRole,
              fullName,
              user.companyName || user.company_name || '',
              text,
              attachments
            );
          } catch (error) {
            console.error('Error sending trade message:', error);
            return false;
          }
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
    [user, activeConversation, setLoadingMessages, setLoading, threadType, fullName, activeInquiryId]
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
          const conversationId = activeConversation.conversationId;

          try {
            if (!activeInquiryId) return null;
            attachment = await customerTradeChatService.uploadAttachment(file, String(conversationId), activeInquiryId, activeConversation.userSpoke);
          } catch (error) {
            console.error('Error uploading trade attachment:', error);
            return null;
          }
        } else {
          attachment = await chatService.uploadAttachment(file, activeConversation.conversationId);
        }

        // Robust type detection for attachments
        let type = "file";
        const mimeType = file.type.toLowerCase();
        const fileName = file.name.toLowerCase();

        if (mimeType.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|heic|jfif)$/i.test(fileName)) {
          type = "image";
        } else if (mimeType.startsWith("video/") || /\.(mp4|webm|ogg|mov)$/i.test(fileName)) {
          type = "video";
        }

        // Return complete attachment object with metadata
        return {
          name: file.name,
          size: file.size,
          type,
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
    [activeConversation, threadType, user?.role, activeInquiryId]
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

  useEffect(() => {
    if (!activeConversation || !effectiveUserId) return;

    // Skip for trade conversations as they have their own marking logic in another effect
    const isTradeType = activeConversation.conversationType === 'trade' || ['trade', 'product', 'rfq', 'business'].includes(threadType);
    if (isTradeType) return;

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
    } catch (error: any) {
      console.error('Failed to acknowledge trade:', error);
      // Log more details if available
      if (error.data) {
        console.error('Acknowledge error data:', error.data);
      }
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

    if (effectiveUserId && userRole) {
      console.log('Fetching trade rooms for:', effectiveUserId, userRole);
      setLoading(true);
      unsubscribe = customerTradeChatService.getUserTradeRooms(
        effectiveUserId,
        userRole,
        (list: any[]) => {
          // console.log('Trade rooms received:', list.length);
          setTradeConversations(list);
          setLoading(false);
        });
    } else {
      // console.log('Skipping trade room fetch - missing:', { effectiveUserId, role: userRole });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [effectiveUserId, userRole]);



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

  // Cleanup active conversation if it's no longer in the list (e.g. hidden/closed)
  useEffect(() => {
    if (activeConversation && conversations.length > 0) {
      const stillExists = conversations.some(c => c.conversationId === activeConversation.conversationId);
      if (!stillExists) {
        // console.log('Active conversation no longer in list. Clearing state.');
        setActiveConversation(null);
        setActiveInquiryId(null);
        // Optional: router.push('/dashboard/chat'); 
        // But many components already handle null activeConversation by showing a placeholder.
      }
    }
  }, [conversations, activeConversation]);





  // Sync/Synthesize active conversation for trades
  useEffect(() => {
    const isTradeType = ['trade', 'product', 'rfq', 'business'].includes(threadType);
    if (!isTradeType || !threadId) return;

    const existing = conversations.find((c) => c.conversationId === threadId);

    if (existing) {
      // Find the active cycle status from roomInquiries if possible
      const activeCycle = roomInquiries.find(i => i.id === activeInquiryId);
      const cycleStatus = activeCycle?.status;

      const currentStatus = cycleStatus || existing.metadata?.status;

      // Sync if status/metadata changed, or if switching to a new threadId
      if (!activeConversation ||
        activeConversation.conversationId !== existing.conversationId ||
        activeConversation.metadata?.status !== currentStatus) {

        setActiveConversation({
          ...existing,
          metadata: {
            ...existing.metadata,
            status: currentStatus // Sync with active cycle!
          }
        });
      }
    } else if (!activeConversation) {
      // Build temporary conversation object until metadata loads
      const tempConversation: Conversation = {
        conversationId: threadId,
        conversationType: 'trade',
        unreadCount: 0,
        otherUserName: 'Min-meg Trade Desk',
        otherCompanyName: 'Platform Admin',
        itemTitle: 'Trade Inquiry',
        itemType: 'product', // Map to a visible category immediately
        userSpoke: 'admin_buyer' as any
      };

      setActiveConversation(tempConversation);

      // Fetch fallback metadata
      customerTradeChatService.getTradeRoomMetadata(threadId).then(metadata => {
        if (metadata) {
          setActiveConversation({
            ...tempConversation,
            itemTitle: metadata.mineral_tag?.replace(/_/g, ' ') || 'Trade Inquiry',
            userSpoke: customerTradeChatService.getSpokeByContext(effectiveUserId, metadata),
            metadata: metadata
          });
        }
      });
    }
  }, [threadType, threadId, activeConversation, conversations, effectiveUserId, activeInquiryId, roomInquiries]);





  const value = {
    conversations, // List of conversations for the current user
    activeConversation, // Currently active conversation of the current user
    setActiveConversation, // Function to set the active conversation
    activeInquiryId,
    setActiveInquiryId,
    roomInquiries,
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
