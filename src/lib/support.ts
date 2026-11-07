/* Support chat (docs/new/frontend/implementation/step-2.6d-support-chat.md). Shapes follow the backend's support module. */
export interface SupportLink {
  type: 'TRADE' | 'LISTING';
  id: string;
}
export interface SupportMessage {
  id: string;
  senderSide: 'COMPANY' | 'STAFF';
  senderId: string;
  senderName: string;
  text: string;
  attachments: { url: string; name: string; type: string }[];
  link: SupportLink | null;
  createdAt: string | null;
}
export interface SupportMessagesPage {
  rows: SupportMessage[];
  hasMore: boolean;
}
export const MAX_SUPPORT_FILES = 5;
export interface MySupportConversation {
  id: string;
  status: 'OPEN' | 'CLOSED';
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastSenderSide: 'COMPANY' | 'STAFF' | null;
  unread: number;
}
