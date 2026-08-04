import * as React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Typography } from '@/components/ui/typography';
import { usePopover } from '@/hooks/use-popover';
import { Menu, MenuItem } from '@/components/ui/menu';
import { Copy, Check } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

import { InvoiceAgreementModal } from '../invoice/invoice_modal';
import { generateTextAvatar, stringToColor } from '@/utils/chat-utils';

import { ChatContext } from '@/providers/chat-provider';
import { TRADE_DESK_IDENTITY } from '@/config/chat-config';
import { formatTradeStatusLabel } from '@/config/trade-stepper-config';

export function ThreadToolbar({ thread }: any) {
  const { activeInquiryId, setActiveInquiryId, roomInquiries } = React.useContext(ChatContext);
  const router = useRouter();
  const params = useParams();
  const threadType = params?.threadType as string;
  const threadId = params?.threadId as string;

  const [copied, setCopied] = React.useState(false);
  const [openInvoiceModal, setOpenInvoiceModal] = React.useState(false);

  const isTradeDesk = thread?.conversationType === 'trade' || thread?.itemType === 'trade' || thread?.otherUserName === TRADE_DESK_IDENTITY.DISPLAY_NAME;
  const avatarBgColor = isTradeDesk ? '#059669' : stringToColor(thread.otherUserName || 'User');

  const activeCycle = React.useMemo(() => {
    if (activeInquiryId && roomInquiries?.length > 0) {
      return roomInquiries.find((inq: any) => inq.id === activeInquiryId) || roomInquiries[0];
    }
    return roomInquiries?.[0] || null;
  }, [activeInquiryId, roomInquiries]);

  const displayItemName = activeCycle?.item_name || thread.itemTitle || 'Trade Room';
  const displayStatus = activeCycle?.status || thread.metadata?.status || 'Pending';

  const statusBadgeClass = String(displayStatus).toLowerCase().includes('completed')
    ? 'bg-green-100 text-green-700 border-green-200'
    : String(displayStatus).toLowerCase().includes('cancelled') || String(displayStatus).toLowerCase().includes('rejected')
    ? 'bg-red-100 text-red-700 border-red-200'
    : 'bg-emerald-50 text-emerald-800 border-emerald-200';

  const fullTradeId = activeCycle?.reference || activeCycle?.id || thread?.metadata?.inquiry_id || '...';
  const refCode = String(fullTradeId).slice(-6).toUpperCase();

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullTradeId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const { setOpenMobileSidebar, setOpenDesktopSidebar } = React.useContext(ChatContext);

  const handleSidebarToggle = () => {
    setOpenMobileSidebar((prev: boolean) => !prev);
    setOpenDesktopSidebar((prev: boolean) => !prev);
  };

  return (
    <React.Fragment>
      {/* Responsive Toolbar Header */}
      <div className="border-b border-gray-200 bg-white px-2.5 sm:px-4 py-1.5 flex items-center justify-between gap-2 min-h-[50px] select-none">
        {/* Left Side: Sidebar Toggle + Avatar + Subtitle (Min-meg Trade Desk + Ref ID + Trades count) & Item Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          <button
            onClick={handleSidebarToggle}
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 transition-colors shrink-0"
            title="Toggle Trade Threads Sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <Avatar
            size="sm"
            style={{
              backgroundColor: avatarBgColor,
              color: 'white',
              width: 28,
              height: 28,
              fontSize: '11px',
            }}
            className="shrink-0"
          >
            {generateTextAvatar(thread.otherUserName)}
          </Avatar>

          <div className="min-w-0 flex-1">
            {/* Top Subtitle Row: Title + Copyable Ref ID + Trades Badge inline */}
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap sm:flex-nowrap">
              <span className="hidden sm:inline-block text-[10px] sm:text-xs text-gray-500 font-medium truncate">
                {thread.conversationType === 'trade' || thread.itemType === 'trade'
                  ? 'Min-meg Trade Desk'
                  : thread.itemType !== 'business'
                    ? `${thread.otherUserName} - (${thread.otherCompanyName || 'Individual'})`
                    : ''}
              </span>

              {/* Copyable Trade ID Badge next to Min-meg Trade Desk */}
              {roomInquiries?.length > 1 ? (
                <Menu
                  trigger={
                    <button
                      className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded text-[9px] font-mono font-bold border border-gray-200 transition-colors shrink-0 whitespace-nowrap"
                      title="Trade Ref ID (Click to copy / switch)"
                    >
                      <span>REF: #{refCode}</span>
                      <span onClick={handleCopyId} className="hover:text-emerald-700 p-0.5">
                        {copied ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} className="text-gray-400" />}
                      </span>
                    </button>
                  }
                >
                  <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-bold border-b border-gray-100">
                    Switch Trade Cycle ({roomInquiries.length})
                  </p>
                  {roomInquiries.map((cycle: any) => (
                    <MenuItem
                      key={cycle.id}
                      onClick={() => {
                        setActiveInquiryId(cycle.id);
                        router.push(`/dashboard/chat/${threadType}/${threadId}/${cycle.id}`);
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">#{String(cycle.reference || cycle.id).slice(-8).toUpperCase()}</span>
                        <span className="text-[10px] text-gray-500">
                          {cycle.item_name || 'Trade Inquiry'} - {cycle.status}
                          {cycle.display_price ? ` • ${cycle.currency === 'USD' ? '$' : '₦'}${Number(cycle.display_price).toLocaleString()}/unit` : ''}
                        </span>
                      </div>
                    </MenuItem>
                  ))}
                </Menu>
              ) : (
                <button
                  onClick={handleCopyId}
                  className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded text-[9px] font-mono font-bold border border-gray-200 transition-colors shrink-0 whitespace-nowrap"
                  title="Click to copy Trade Ref ID"
                >
                  <span>REF: #{refCode}</span>
                  {copied ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} className="text-gray-400" />}
                </button>
              )}

              {/* Reduced Trades Count Badge right beside Trade ID */}
              {roomInquiries && roomInquiries.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  {roomInquiries.length} {roomInquiries.length === 1 ? 'Trade' : 'Trades'}
                </span>
              )}
            </div>

            {/* Main Item Title */}
            <div className="flex items-center gap-1.5 overflow-hidden mt-0.5">
              <Typography noWrap variant="subtitle2" className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                {thread.conversationType === 'trade' || thread.itemType === 'trade'
                  ? displayItemName
                  : thread.itemType !== 'business' ? thread.itemTitle : thread.otherUserName}
              </Typography>
            </div>
          </div>
        </div>

        {/* Right Side: Tight Status Badge */}
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <span className={`px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-tight border shrink-0 whitespace-nowrap ${statusBadgeClass}`}>
            {formatTradeStatusLabel(displayStatus)}
          </span>
        </div>
      </div>

      <InvoiceAgreementModal open={openInvoiceModal} onClose={() => setOpenInvoiceModal(false)} thread={thread} />
    </React.Fragment>
  );
}

export default ThreadToolbar;
