import * as React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Box } from '@/components/ui/box';
import { Stack } from '@/components/ui/stack';
import { Typography } from '@/components/ui/typography';
import { usePopover } from '@/hooks/use-popover';
import { Menu, MenuItem } from '@/components/ui/menu';
import { DotsThreeCircleVertical } from '@phosphor-icons/react';
import { useRouter, useParams } from 'next/navigation';

import { InvoiceAgreementModal } from '../invoice/invoice_modal';
import { InvoiceAgreementButton } from '../invoice/invoice-agreement-button';
import { generateTextAvatar, stringToColor } from '@/utils/chat-utils';
import tradeApi from '@/redux/features/trade/trade_api';

import { ChatContext } from '@/providers/chat-provider';

export function ThreadToolbar({ thread }: any) {
  const { activeInquiryId, setActiveInquiryId, roomInquiries } = React.useContext(ChatContext);
  const router = useRouter();
  const params = useParams();
  const threadType = params?.threadType as string;
  const threadId = params?.threadId as string;

  const popover = usePopover();
  const [openInvoiceModal, setOpenInvoiceModal] = React.useState(false);

  const avatarBgColor = stringToColor(thread.otherUserName || 'User');

  const activeCycle = React.useMemo(() => {
    if (activeInquiryId && roomInquiries?.length > 0) {
      return roomInquiries.find((inq: any) => inq.id === activeInquiryId) || roomInquiries[0];
    }
    return roomInquiries?.[0] || null;
  }, [activeInquiryId, roomInquiries]);

  const displayItemName = activeCycle?.item_name || thread.itemTitle || 'Trade Room';
  const displayStatus = activeCycle?.status || thread.metadata?.status || 'Pending';

  return (
    <React.Fragment>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: 'center',
          borderBottom: '1px solid var(--mui-palette-divider)',
          flex: '0 0 auto',
          justifyContent: 'space-between',
          minHeight: '64px',
          px: 2,
          py: 1,
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0, flex: 1 }}>
          <Avatar
            size="sm"
            style={{
              backgroundColor: avatarBgColor,
              color: 'white',
            }}
          >
            {generateTextAvatar(thread.otherUserName)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography noWrap variant="subtitle2">
              {thread.conversationType === 'trade' || thread.itemType === 'trade'
                ? 'Min-meg Trade Desk'
                : thread.itemType !== 'business'
                  ? `${thread.otherUserName}  -  (${thread.otherCompanyName || 'Individual'})`
                  : ''}
            </Typography>

            <div className="flex items-center gap-2 overflow-hidden">
              <Typography noWrap variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {thread.conversationType === 'trade' || thread.itemType === 'trade'
                  ? displayItemName
                  : thread.itemType !== 'business' ? thread.itemTitle : thread.otherUserName}
              </Typography>

              {roomInquiries?.length > 1 && (
                <Menu
                  trigger={
                    <button className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-bold text-gray-600 border border-gray-200 transition-colors shrink-0">
                      REF: #{String(activeCycle?.reference || activeCycle?.id || '...').slice(-6).toUpperCase()}
                      <DotsThreeCircleVertical size={14} />
                    </button>
                  }
                >
                  <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-bold border-b border-gray-100">Switch Trade Cycle</p>
                  {roomInquiries.map((cycle: any) => (
                    <MenuItem key={cycle.id} onClick={() => {
                      setActiveInquiryId(cycle.id);
                      router.push(`/dashboard/chat/${threadType}/${threadId}/${cycle.id}`);
                    }}>
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
              )}
            </div>
          </Box>
        </Stack>

        <div className="hidden md:flex items-center gap-3">
          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${displayStatus === 'completed' ? 'bg-green-100 text-green-700' :
            displayStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
            {displayStatus}
          </span>
        </div>
      </Stack>

      <InvoiceAgreementModal open={openInvoiceModal} onClose={() => setOpenInvoiceModal(false)} thread={thread} />
    </React.Fragment>
  );
}
