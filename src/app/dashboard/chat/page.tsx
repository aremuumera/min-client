'use client';

import * as React from 'react';
import { MessageSquare, ShieldCheck, List } from 'lucide-react';
import { ChatContext } from '@/providers/chat-provider';

export default function ChatPage() {
  const { setOpenMobileSidebar, setOpenDesktopSidebar } = React.useContext(ChatContext);

  const handleOpenSidebar = () => {
    setOpenMobileSidebar(true);
    setOpenDesktopSidebar(true);
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 h-full p-4 sm:p-8 text-center bg-white relative">
      {/* Mobile Top Bar Action Button */}
      <div className="sm:hidden absolute top-3 left-3 z-10">
        <button
          onClick={handleOpenSidebar}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs active:bg-emerald-700 transition-colors"
        >
          <List size={16} />
          <span>Open Conversations</span>
        </button>
      </div>

      <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 mx-auto flex items-center justify-center text-emerald-600">
          <MessageSquare size={26} />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-black text-gray-900">Min-meg Trade Desk</h3>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Select a trade inquiry or conversation from the sidebar to start messaging.
          </p>
        </div>

        {/* Action Button for Mobile */}
        <button
          onClick={handleOpenSidebar}
          className="w-full sm:hidden py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
        >
          <List size={16} />
          <span>View All Trade Threads</span>
        </button>

        <div className="pt-2 flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
          <ShieldCheck size={14} />
          <span>Encrypted Trade Communication</span>
        </div>
      </div>
    </div>
  );
}
