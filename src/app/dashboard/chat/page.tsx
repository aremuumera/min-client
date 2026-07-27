import * as React from 'react';
import { MessageSquare, ShieldCheck } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 h-full p-8 text-center bg-white">
      <div className="max-w-md w-full p-8 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 mx-auto flex items-center justify-center text-emerald-600">
          <MessageSquare size={26} />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-black text-gray-900">Min-meg Trade Desk</h3>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Select a trade inquiry or conversation from the sidebar to start messaging.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
          <ShieldCheck size={14} />
          <span>Encrypted Trade Communication</span>
        </div>
      </div>
    </div>
  );
}
