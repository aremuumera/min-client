import React, { useContext, useState } from 'react';
import { FileText as DescriptionIcon } from '@phosphor-icons/react/dist/ssr';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Popover } from '@/components/ui/popover';
import { Tooltip } from '@/components/ui/tooltip';
import { Typography } from '@/components/ui/typography';

import { ChatContext } from '../chat/chat_com/chat_context';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useTheme } from '@/providers';

/**
 * Button component to initiate invoice agreement creation
 * Should be placed in the chat toolbar or message input area
 */
interface InvoiceAgreementButtonProps {
  thread: any;
  hasExistingInvoice: boolean;
  onOpenModal: () => void;
}

export const InvoiceAgreementButton = ({ thread, hasExistingInvoice, onOpenModal }: InvoiceAgreementButtonProps) => {
  const { messages, conversations } = useContext(ChatContext);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  console.log('thread in button', thread);

  const open = Boolean(anchorEl);
  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const theme = useTheme();
  // const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Only show button if there are messages (negotiation has started)
  const hasMessages = messages && messages.length > 0;

  // Check if an invoice already exists for this conversation
  // const [hasExistingInvoice, setHasExistingInvoice] = useState(false); // This is now passed as a prop

  if (!hasMessages) {
    return null;
  }

  return (
    <Box>
      {/* {!hasExistingInvoice && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', pb: 1 }}>
          <Chip label="Agreement Pending" size="small" color="warning" sx={{ fontSize: '0.75rem' }} />
        </Box>
      )} */}
      <Box sx={{ display: 'flex', alignItems: { sm: 'center', xs: 'end', justifyContent: 'end' }, gap: 1 }}>
        {!isMobile && (
          <Tooltip
            content="Create Trade Agreement for Inspection"
            position="bottom"
          >
            <Button
              variant="outlined"
              size="sm"
              onClick={onOpenModal}
              disabled={hasExistingInvoice}
              className="capitalize rounded-lg px-4 py-2 text-sm font-medium"
            >
              <DescriptionIcon className="mr-2 h-4 w-4" />
              Create Agreement
            </Button>
          </Tooltip>
        )}

        {/* MOBILE */}
            <Popover
              open={open}
              onOpenChange={(o) => !o && handleClose()}
              position="bottom"
              align="center"
              trigger={
                <Button
                  variant="outlined"
                  size="sm"
                  className="min-w-[40px] px-1"
                >
                  <DescriptionIcon className="h-4 w-4" />
                </Button>
              }
            >
              <Box className="p-4 max-w-[240px]">
                <Typography variant="body2" className="mb-4">
                  Create Trade Agreement for Inspection.
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    onOpenModal();
                    handleClose();
                  }}
                  disabled={hasExistingInvoice}
                  size="sm"
                  className="capitalize"
                >
                  Create Agreement
                </Button>
              </Box>
            </Popover>
      </Box>
    </Box>
  );
}
