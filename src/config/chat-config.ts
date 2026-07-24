/**
 * Centralized Chat Configuration & Identity Constants
 */

export const TRADE_DESK_IDENTITY = {
  SENDER_ID: 'SYSTEM',
  DISPLAY_NAME: 'Min-meg Trade Desk',
  COMPANY_NAME: 'Platform Admin',
  ROLE_LABEL: 'Platform Admin',
  DEFAULT_AVATAR: 'MD',
  // Includes all historical system sender names to guarantee 100% unified avatar rendering
  LEGACY_SENDER_NAMES: [
    'System',
    'System Admin',
    'System Notice',
    'Min-meg Trade Desk',
    'Trade Desk',
    'Trade Inquiry',
    'Trade Inspector',
  ],
} as const;

/**
 * Helper to identify whether a chat message originated from the System/Trade Desk
 */
export function isSystemOrAdminMessage(message: any): boolean {
  if (!message) return false;
  const senderId = message?.senderId || message?.sender_id;
  const senderRole = message?.sender_role;
  const senderDisplay = message?.sender_display || message?.senderName || '';

  if (senderId === TRADE_DESK_IDENTITY.SENDER_ID || senderId === 'admin') return true;
  if (senderRole === 'system' || senderRole === 'admin') return true;
  if (message?.type === 'system') return true;

  return TRADE_DESK_IDENTITY.LEGACY_SENDER_NAMES.some((name) =>
    senderDisplay.toLowerCase().includes(name.toLowerCase())
  );
}
