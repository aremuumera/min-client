import { Loader2 } from 'lucide-react';

/*
 * Fix 3B: a trade is saved even when its chat room could not be created yet. MINMEG creates it again on
 * its own (and tells the parties when it is ready), so until then the trade shows this note instead of
 * the link into the room. `chat_room_ready_at` empty = not created yet; missing (an older answer) = ready.
 */
export const isChatReady = (record: { chat_room_ready_at?: string | null } | null | undefined): boolean =>
  !record || record.chat_room_ready_at !== null;

export function ChatSetupNote({ className = '' }: { className?: string }) {
  return (
    <span role="status" className={`inline-flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 ${className}`}>
      <Loader2 size={13} className="animate-spin" aria-hidden />
      Your chat is being set up. We will tell you when it is ready.
    </span>
  );
}
