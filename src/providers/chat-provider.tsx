'use client'


import React, { createContext, useCallback, useEffect, useState, Dispatch, SetStateAction } from 'react';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useSelector } from 'react-redux';
import { useAuthIdentity } from '@/hooks/use-auth-identity';
import { toast } from 'sonner';
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
  activeTab: 'chat' | 'vault' | 'activity';
  setActiveTab: Dispatch<SetStateAction<'chat' | 'vault' | 'activity'>>;
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
  activeTab: 'chat',
  setActiveTab: () => { },
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
  const [activeTab, setActiveTab] = useState<'chat' | 'vault' | 'activity'>('chat');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [openDesktopSidebar, setOpenDesktopSidebar] = React.useState(true);
  const [openMobileSidebar, setOpenMobileSidebar] = React.useState(false);
  const [acknowledgeInquiry] = useAcknowledgeInquiryMutation();
  const [rejectInquiry] = useRejectInquiryMutation();
  const { user, effectiveUserId: rawEffectiveUserId, fullName: authFullName } = useAuthIdentity();
  const effectiveUserId = String(rawEffectiveUserId || '');
  const userRole = user?.role || user?.team_role || user?.rtype || 'buyer';
  const fullName = authFullName || `${user?.firstName || ''} ${user?.lastName || ''}`;

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
    const conversationId = activeConversation?.conversationId;

    if (conversationId) {
      const isTradeType = ['trade', 'product', 'rfq', 'business'].includes(threadType) || activeConversation?.conversationType === 'trade';

      if (isTradeType) {
        unsubscribe = customerTradeChatService.getRoomInquiries(
          String(conversationId),
          effectiveUserId,
          userRole,
          (inquiries: any[]) => {
            setRoomInquiries(inquiries);

            // Auto-select the inquiry from URL or the most recent one
            const urlItemId = params?.itemId as string;
            if (inquiries.length > 0) {
              setActiveInquiryId(prev => {
                // URL itemId is the inquiry's external_id = Firestore doc ID = inquiry.id in roomInquiries
                if (urlItemId) {
                  const urlMatch = inquiries.find(i => i.id === urlItemId);
                  if (urlMatch) return urlMatch.id;
                }
                // Keep current selection if still valid
                if (prev && inquiries.find(i => i.id === prev)) {
                  return prev;
                }
                // Fallback to first inquiry
                return inquiries[0].id;
              });
            } else {
              setActiveInquiryId(null);
            }
          },
          (error: any) => {
            console.error('Error listening to room inquiries:', error);
            toast.error('Failed to sync trade inquiries. Please check your connection.');
          }
        );
      } else {
        setRoomInquiries(prev => prev.length > 0 ? [] : prev);
      }
    } else {
      setRoomInquiries(prev => prev.length > 0 ? [] : prev);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeConversation?.conversationId, activeConversation?.conversationType, threadType, effectiveUserId, userRole, params?.itemId]);

  // Loading messages when active conversation changes
  useEffect(() => {
    let unsubscribe: any = null;
    const conversationId = activeConversation?.conversationId;
    const userSpoke = activeConversation?.userSpoke;

    if (conversationId && userSpoke) {
      const isTradeType = ['trade', 'product', 'rfq', 'business'].includes(threadType) || activeConversation?.conversationType === 'trade';

      if (isTradeType) {
        if (!activeInquiryId) {
          setMessages(prev => prev.length > 0 ? [] : prev);
          return;
        }

        if (!user) return;

        setLoadingMessages(true);
        unsubscribe = customerTradeChatService.getSpokeMessages(
          String(conversationId),
          activeInquiryId,
          userSpoke,
          (messageList: any[]) => {
            setMessages(messageList);
            setLoadingMessages(false);

            customerTradeChatService.markSpokeAsRead(
              String(conversationId),
              activeInquiryId,
              userSpoke,
              String(user.id)
            );
          },
          (error: any) => {
            console.error('Error listening to messages:', error);
            toast.error('Failed to sync messages. Real-time updates may be delayed.');
          }
        );
      } else {
        unsubscribe = chatService.getMessages(conversationId, (messageList: Message[]) => {
          setMessages(messageList);

          if (effectiveUserId && activeConversation.unreadCount > 0) {
            chatService.markConversationAsRead(conversationId, effectiveUserId);
          }
        });
      }
    } else {
      setMessages(prev => prev.length > 0 ? [] : prev);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeConversation?.conversationId, activeConversation?.userSpoke, activeConversation?.conversationType, user, threadType, effectiveUserId, activeInquiryId]);

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
      } catch (error: any) {
        setLoadingMessages(false);
        console.error('Error sending message:', error);
        toast.error(error?.message || 'Failed to send message');
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
          } catch (error: any) {
            console.error('Error uploading trade attachment:', error);
            toast.error(error?.message || 'Error uploading trade attachment');
            throw error;
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
      } catch (error: any) {
        console.error('Error uploading attachment:', error);
        toast.error(error?.message || 'Error uploading attachment');
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
        },
        (error: any) => {
          console.error('Error listening to trade rooms:', error);
          toast.error('Failed to load trade rooms. Please refresh the page.');
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
      const stillExists = conversations.some(c =>
        String(c.conversationId).trim().toLowerCase() === String(activeConversation.conversationId).trim().toLowerCase()
      );
      if (!stillExists) {
        setActiveConversation(null);
        setActiveInquiryId(null);
        // If the user is on the specific chat URL, redirect to chat home
        if (threadId) {
          router.push('/dashboard/chat');
        }
      }
    }
  }, [conversations, activeConversation?.conversationId, threadId, router]);





  // Sync/Synthesize active conversation for trades
  useEffect(() => {
    const isTradeType = ['trade', 'product', 'rfq', 'business'].includes(threadType);
    if (!isTradeType || !threadId) return;

    const existing = conversations.find((c) =>
      String(c.conversationId).trim().toLowerCase() === String(threadId).trim().toLowerCase()
    );

    if (existing) {
      const activeCycle = roomInquiries.find(i => String(i.id).trim().toLowerCase() === String(activeInquiryId).trim().toLowerCase());
      const cycleStatus = activeCycle?.status;
      const currentStatus = cycleStatus || existing.metadata?.status;

      setActiveConversation(prev => {
        if (
          prev &&
          String(prev.conversationId).trim().toLowerCase() === String(existing.conversationId).trim().toLowerCase() &&
          prev.metadata?.status === currentStatus &&
          prev.itemTitle === existing.itemTitle
        ) {
          return prev;
        }
        return {
          ...existing,
          metadata: {
            ...existing.metadata,
            status: currentStatus
          }
        };
      });
    } else {
      // Room not in conversations list — either loading or hidden.
      // First check if room is explicitly hidden for this user before synthesizing.
      customerTradeChatService.getTradeRoomMetadata(threadId).then(metadata => {
        if (!metadata) return;
        // If user is in hidden_for_user_ids, redirect away — don't show anything
        if (Array.isArray(metadata.hidden_for_user_ids) && metadata.hidden_for_user_ids.includes(effectiveUserId)) {
          setActiveConversation(null);
          setActiveInquiryId(null);
          router.push('/dashboard/chat');
          return;
        }
        // Otherwise synthesize the temporary conversation
        setActiveConversation(prev => {
          if (prev && String(prev.conversationId).trim().toLowerCase() === String(threadId).trim().toLowerCase()) {
            return {
              ...prev,
              itemTitle: metadata.mineral_tag?.replace(/_/g, ' ') || 'Trade Inquiry',
              userSpoke: customerTradeChatService.getSpokeByContext(effectiveUserId, metadata),
              metadata: metadata
            };
          }

          return {
            conversationId: threadId,
            conversationType: 'trade',
            unreadCount: 0,
            otherUserName: 'Min-meg Trade Desk',
            otherCompanyName: 'Platform Admin',
            itemTitle: metadata.mineral_tag?.replace(/_/g, ' ') || 'Trade Inquiry',
            itemType: 'product',
            userSpoke: customerTradeChatService.getSpokeByContext(effectiveUserId, metadata),
            metadata: metadata
          };
        });
      });
    }
  }, [threadType, threadId, conversations, effectiveUserId, activeInquiryId, roomInquiries]);





  const value = {
    conversations, // List of conversations for the current user
    activeConversation, // Currently active conversation of the current user
    setActiveConversation, // Function to set the active conversation
    activeInquiryId,
    setActiveInquiryId,
    activeTab,
    setActiveTab,
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
