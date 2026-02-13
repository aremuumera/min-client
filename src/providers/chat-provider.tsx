'use client';

import * as React from 'react';
import { useAppSelector } from '@/redux/hooks';

export interface ChatContextType {
  conversations: any[];
  activeConversation: any | null;
  setActiveConversation: (conversation: any | null) => void;
  messages: any[];
  loading: boolean;
  notifications: any[];
  openDesktopSidebar: boolean;
  setOpenDesktopSidebar: (open: boolean) => void;
  openMobileSidebar: boolean;
  setOpenMobileSidebar: (open: boolean) => void;
  loadingMessages: boolean;
  loadingAttachments: boolean;
  startConversation: (recipientId: string, itemData: any) => Promise<string | null>;
  sendMessage: (text: string, attachments: any[], type: 'text' | 'file') => Promise<boolean>;
  uploadAttachment: (file: File) => Promise<any | null>;
  deleteAttachment: (conversationId: string, messageId: string, attachmentIndex: number) => Promise<boolean>;
  markMessageAsRead: (conversationId: string, messageId: string) => Promise<boolean>;
  clearAllNotifications: () => Promise<boolean>;
  clearSingleNotification: (notificationId: string) => Promise<boolean>;
  markMessageAsDelivered: (conversationId: string, messageId: string) => Promise<boolean>;
}

const ChatContext = React.createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = React.useState<any[]>([]);
  const [activeConversation, setActiveConversation] = React.useState<any | null>(null);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [loadingAttachments, setLoadingAttachments] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [openDesktopSidebar, setOpenDesktopSidebar] = React.useState(true);
  const [openMobileSidebar, setOpenMobileSidebar] = React.useState(false);

  const { user } = useAppSelector((state) => state.auth);

  // Note: Firebase logic will be integrated in Phase 7 implementation
  // For now, we provide the structure to unblock layout migration

  const startConversation = async (recipientId: string, itemData: any) => {
    console.log('Start conversation', { recipientId, itemData });
    return null;
  };

  const sendMessage = async (text: string, attachments: any[], type: 'text' | 'file') => {
    console.log('Send message', { text, attachments, type });
    return true;
  };

  const uploadAttachment = async (file: File) => {
    console.log('Upload attachment', file.name);
    return null;
  };

  const deleteAttachment = async (conversationId: string, messageId: string, attachmentIndex: number) => {
    console.log('Delete attachment', { conversationId, messageId, attachmentIndex });
    return true;
  };

  const markMessageAsRead = async (conversationId: string, messageId: string) => {
    return true;
  };

  const clearAllNotifications = async () => true;
  const clearSingleNotification = async (id: string) => true;
  const markMessageAsDelivered = async (cid: string, mid: string) => true;

  const value = React.useMemo(() => ({
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    loading,
    notifications,
    openDesktopSidebar,
    setOpenDesktopSidebar,
    openMobileSidebar,
    setOpenMobileSidebar,
    loadingMessages,
    loadingAttachments,
    startConversation,
    sendMessage,
    uploadAttachment,
    deleteAttachment,
    markMessageAsRead,
    clearAllNotifications,
    clearSingleNotification,
    markMessageAsDelivered,
  }), [
    conversations, 
    activeConversation, 
    messages, 
    loading, 
    notifications, 
    openDesktopSidebar, 
    openMobileSidebar, 
    loadingMessages, 
    loadingAttachments
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = React.useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
