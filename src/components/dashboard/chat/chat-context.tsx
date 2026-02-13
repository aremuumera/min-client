'use client';

import * as React from 'react';
import { Dispatch, SetStateAction, ReactNode } from 'react';

interface Participant {
  id: string;
  name: string;
  avatar: string;
}

interface Contact {
  id: string;
  name: string;
  avatar: string;
  [key: string]: any;
}

interface Thread {
  id: string;
  type: 'direct' | 'group';
  participants: Participant[];
  unreadCount: number;
  [key: string]: any;
}

interface Message {
  id: string;
  threadId: string;
  type: string;
  author: Participant;
  content: string;
  createdAt: Date;
  [key: string]: any;
}

interface CreateThreadParams {
  type: 'direct' | 'group';
  recipientId?: string;
  recipientIds?: string[];
}

interface CreateMessageParams {
  threadId: string;
  type: string;
  content: string;
}

interface ChatContextValue {
  contacts: Contact[];
  threads: Thread[];
  messages: Map<string, Message[]>;
  createThread: (params: CreateThreadParams) => string | undefined;
  markAsRead: (threadId: string) => void;
  createMessage: (params: CreateMessageParams) => void;
  openDesktopSidebar: boolean;
  setOpenDesktopSidebar: Dispatch<SetStateAction<boolean>>;
  openMobileSidebar: boolean;
  setOpenMobileSidebar: Dispatch<SetStateAction<boolean>>;
}

const noop = () => undefined;

export const ChatContext = React.createContext<ChatContextValue>({
  contacts: [],
  threads: [],
  messages: new Map(),
  createThread: () => undefined,
  markAsRead: noop,
  createMessage: noop,
  openDesktopSidebar: true,
  setOpenDesktopSidebar: () => { },
  openMobileSidebar: true,
  setOpenMobileSidebar: () => { },
});

interface ChatProviderProps {
  children: ReactNode;
  contacts?: Contact[];
  threads?: Thread[];
  messages?: Message[];
}

export function ChatProvider({
  children,
  contacts: initialContacts = [],
  threads: initialLabels = [],
  messages: initialMessages = [],
}: ChatProviderProps) {
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [threads, setThreads] = React.useState<Thread[]>([]);
  const [messages, setMessages] = React.useState<Map<string, Message[]>>(new Map());
  const [openDesktopSidebar, setOpenDesktopSidebar] = React.useState(true);
  const [openMobileSidebar, setOpenMobileSidebar] = React.useState(false);

  React.useEffect(() => {
    setContacts(initialContacts);
  }, [initialContacts]);

  React.useEffect(() => {
    setThreads(initialLabels);
  }, [initialLabels]);

  React.useEffect(() => {
    setMessages(
      initialMessages.reduce((acc, curr) => {
        const byThread = acc.get(curr.threadId) ?? [];
        // We unshift the message to ensure the messages are sorted by date
        byThread.unshift(curr);
        acc.set(curr.threadId, byThread);
        return acc;
      }, new Map())
    );
  }, [initialMessages]);

  const handleCreateThread = React.useCallback(
    (params: CreateThreadParams): string | undefined => {
      // Authenticated user
      const userId = 'USR-000';

      // Check if the thread already exists
      let thread = threads.find((thread) => {
        if (params.type === 'direct') {
          if (thread.type !== 'direct') {
            return false;
          }

          return thread.participants
            .filter((participant) => participant.id !== userId)
            .find((participant) => participant.id === params.recipientId);
        }

        if (thread.type !== 'group') {
          return false;
        }

        const recipientIds = thread.participants
          .filter((participant) => participant.id !== userId)
          .map((participant) => participant.id);

        if (!params.recipientIds || params.recipientIds.length !== recipientIds.length) {
          return false;
        }

        return params.recipientIds.every((recipientId) => recipientIds.includes(recipientId));
      });

      if (thread) {
        return thread.id;
      }

      // Create a new thread

      const participants = [{ id: 'USR-000', name: 'Sofia Rivers', avatar: '/assets/avatar.png' }];

      if (params.type === 'direct') {
        const contact = contacts.find((contact) => contact.id === params.recipientId);

        if (!contact) {
          throw new Error(`Contact with id "${params.recipientId}" not found`);
        }

        participants.push({ id: contact.id, name: contact.name, avatar: contact.avatar });
      } else {
        params.recipientIds?.forEach((recipientId) => {
          const contact = contacts.find((contact) => contact.id === recipientId);

          if (!contact) {
            throw new Error(`Contact with id "${recipientId}" not found`);
          }

          participants.push({ id: contact.id, name: contact.name, avatar: contact.avatar });
        });
      }

      thread = { id: `TRD-${Date.now()}`, type: params.type, participants, unreadCount: 0 };

      // Add it to the threads
      const updatedThreads = [thread, ...threads];

      // Dispatch threads update
      setThreads(updatedThreads);

      return thread.id;
    },
    [contacts, threads]
  );

  const handleMarkAsRead = React.useCallback(
    (threadId: string) => {
      const thread = threads.find((thread) => thread.id === threadId);

      if (!thread) {
        // Thread might no longer exist
        return;
      }

      const updatedThreads = threads.map((threadToUpdate) => {
        if (threadToUpdate.id !== threadId) {
          return threadToUpdate;
        }

        return { ...threadToUpdate, unreadCount: 0 };
      });

      // Dispatch threads update
      setThreads(updatedThreads);
    },
    [threads]
  );

  const handleCreateMessage = React.useCallback(
    (params: CreateMessageParams) => {
      const message = {
        id: `MSG-${Date.now()}`,
        threadId: params.threadId,
        type: params.type,
        author: { id: 'USR-000', name: 'Sofia Rivers', avatar: '/assets/avatar.png' },
        content: params.content,
        createdAt: new Date(),
      };

      const updatedMessages = new Map(messages);

      // Add it to the messages
      if (!updatedMessages.has(params.threadId)) {
        updatedMessages.set(params.threadId, [message]);
      } else {
        updatedMessages.set(params.threadId, [...(updatedMessages.get(params.threadId) || []), message]);
      }

      // Dispatch messages update
      setMessages(updatedMessages);
    },
    [messages]
  );

  console.log('threads', threads);

  return (
    <ChatContext.Provider
      value={{
        contacts,
        threads,
        messages,
        createThread: handleCreateThread,
        markAsRead: handleMarkAsRead,
        createMessage: handleCreateMessage,
        openDesktopSidebar,
        setOpenDesktopSidebar,
        openMobileSidebar,
        setOpenMobileSidebar,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
